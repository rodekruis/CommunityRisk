
drop schema if exists "BEN_datamodel" cascade;
create schema "BEN_datamodel";

-------------------------
-- 0: Load source data --
-------------------------


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------
  
drop table if exists "BEN_datamodel"."Geo_level1";
select rowcacode1 as pcode_level1
	,adm1_name as name
	,cntry_code as pcode_level0
	,geom
into "BEN_datamodel"."Geo_level1"
from geo_source.BEN_adm1
;

drop table if exists "BEN_datamodel"."Geo_level2";
select rowcacode2 as pcode_level2
	,adm2_name as name
	,rowcacode1 as pcode_level1
	,geom
into "BEN_datamodel"."Geo_level2"
from geo_source.BEN_adm2
;

------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 2 data --
------------------

drop table if exists "BEN_datamodel"."Indicators_2_area";
select rowcacode2 as pcode_level2
	,st_area(st_transform(geom,4326)::geography)/1000000 as land_area
into "BEN_datamodel"."Indicators_2_area"
from geo_source.BEN_adm2
;

drop table if exists "BEN_datamodel"."Indicators_4_population";
select "RowcaCode2" as pcode_level2
	,sum as population
into "BEN_datamodel"."Indicators_2_population"
from ben_source."Indicators_2_population"
;

drop table if exists "BEN_datamodel"."Indicators_2_hazards";
select "PCODE" as pcode_level2
	,cs_sum + cy_sum as cyclone_phys_exp 	/* Combine into one variable */
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "BEN_datamodel"."Indicators_2_hazards"
from "ben_source"."Indicators_2_hazards"
;

drop table if exists "BEN_datamodel"."Indicators_2_traveltime";
select "PCODE" as pcode_level2
	,tt_mean as traveltime
into "BEN_datamodel"."Indicators_2_traveltime"
from "ben_source"."Indicators_2_traveltime"
;

drop table if exists "BEN_datamodel"."Indicators_2_waterpoints";
select "RowcaCode2" as pcode_level2
	,"WaterPoints" as waterpoints
into "BEN_datamodel"."Indicators_2_waterpoints"
from "ben_source"."Indicators_2_waterpoints"
;



------------------
-- Level 1 data --
------------------


-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "BEN_datamodel"."Indicators_2_TOTAL_temp";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
	--,case when population = 0 then null else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null else drought_phys_exp / population end as drought_phys_exp
	--,case when population = 0 then null else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null else flood_phys_exp / population end as flood_phys_exp
	--,case when population = 0 then null else tsunami_phys_exp / population end as tsunami_phys_exp
	,t4.traveltime
	,case when waterpoints = 0 then null else cast(t5.waterpoints as float)/ (cast(population as float) / 10000) end as waterpoint_density
	--,tX.XXX ADD NEW VARIABLE HERE
into "BEN_datamodel"."Indicators_2_TOTAL_temp"
from "BEN_datamodel"."Geo_level2" t0
left join "BEN_datamodel"."Indicators_2_area" 		t1	on t0.pcode_level2 = t1.pcode_level2
left join "BEN_datamodel"."Indicators_2_population"	t2	on t0.pcode_level2 = t2.pcode_level2
left join "BEN_datamodel"."Indicators_2_hazards" 	t3	on t0.pcode_level2 = t3.pcode_level2
left join "BEN_datamodel"."Indicators_2_traveltime" 	t4	on t0.pcode_level2 = t4.pcode_level2
left join "BEN_datamodel"."Indicators_2_waterpoints" 	t5	on t0.pcode_level2 = t5.pcode_level2
--left join "BEN_datamodel"."Indicators_2_XXX" 		tX	on t0.pcode_level2 = tX.pcode_level2
;
--select * from "BEN_datamodel"."Indicators_2_TOTAL"


drop table if exists "BEN_datamodel"."Indicators_1_TOTAL_temp";
select t0.pcode_level1 as pcode
	,level2.population,land_area,pop_density,waterpoint_density,drought_phys_exp,flood_phys_exp --ADD NEW LEVEL2 VARIABLES HERE
	--ADD NEW LEVEL1 VARIABLES HERE
into "BEN_datamodel"."Indicators_1_TOTAL_temp"
from "BEN_datamodel"."Geo_level1" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(waterpoint_density * population) / sum(population) as waterpoint_density
--		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
--		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
--		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
--		,sum(traveltime * population) / sum(population) as traveltime
		--ADD NEW LEVEL4-VARIABLES HERE AS WELL
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "BEN_datamodel"."Indicators_2_TOTAL_temp"
	group by 1
	) level2
	on t0.pcode_level1 = level2.pcode_parent
--left join "BEN_datamodel"."Indicators_1_XXX" 		t1	on t0.pcode_level1 = t1.pcode_level1
;



----------------------------------
-- 2.1: Calculate INFORM-scores --
----------------------------------

--calculate INFORM-scores at lowest level:level2
select usp_inform('BEN',2);
ALTER TABLE "BEN_datamodel"."total_scores_level2" DROP COLUMN risk_score, DROP COLUMN vulnerability_score;
--select * from "BEN_datamodel"."total_scores_level2"

--aggregate to higher levels
drop table if exists "BEN_datamodel"."total_scores_level1";
select t1.pcode_parent as pcode_level1
	,sum(hazard_score * population) / sum(population) as hazard_score
	,sum(coping_capacity_score * population) / sum(population) as coping_capacity_score
	,sum(flood_phys_exp_score * population) / sum(population) as flood_phys_exp_score
	,sum(drought_phys_exp_score * population) / sum(population) as drought_phys_exp_score
	,sum(waterpoint_density_score * population) / sum(population) as waterpoint_density_score
	--PLACEHOLDER
	--,sum(XXX_score * population)/ sum(population) as XXX_score
into "BEN_datamodel"."total_scores_level1"
from "BEN_datamodel"."total_scores_level2" t0
join "BEN_datamodel"."Indicators_2_TOTAL_temp" t1	on t0.pcode_level2 = t1.pcode
group by t1.pcode_parent
;


--ADD risk scores to Indicators_TOTAL table
drop table if exists "BEN_datamodel"."Indicators_2_TOTAL";
select *
into "BEN_datamodel"."Indicators_2_TOTAL"
from "BEN_datamodel"."Indicators_2_TOTAL_temp" t0
left join "BEN_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--select * from "BEN_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "BEN_datamodel"."Indicators_1_TOTAL";
select *
into "BEN_datamodel"."Indicators_1_TOTAL"
from "BEN_datamodel"."Indicators_1_TOTAL_temp" t0
left join "BEN_datamodel"."total_scores_level1" t1
on t0.pcode = t1.pcode_level1
;
--select * from "BEN_datamodel"."Indicators_1_TOTAL" 




