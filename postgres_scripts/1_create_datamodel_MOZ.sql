
drop schema if exists "MOZ_datamodel" cascade;
create schema "MOZ_datamodel";

-------------------------
-- 0: Load source data --
-------------------------


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------

 
drop table if exists "MOZ_datamodel"."Geo_level1";
select hrpcode as pcode_level1
	,province as name
	,hrparent as pcode_level0
	,geom
into "MOZ_datamodel"."Geo_level1"
from geo_source.MOZ_adm1_mapshaper
;
--select * from "MOZ_datamodel"."Geo_level1"

drop table if exists "MOZ_datamodel"."Geo_level2";
select p_code as pcode_level2
	,district as name
	,prov_code as pcode_level1
	,geom
into "MOZ_datamodel"."Geo_level2"
from geo_source.MOZ_adm2_mapshaper
;
--select * from "MOZ_datamodel"."Geo_level2"

drop table if exists "MOZ_datamodel"."Geo_level3";
select p_code as pcode_level3
	,posto as name
	,d_pcode as pcode_level2
	,geom
into "MOZ_datamodel"."Geo_level3"
from geo_source.MOZ_adm3_mapshaper
;
--select * from "MOZ_datamodel"."Geo_level3"




------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 3 data --
------------------

drop table if exists "MOZ_datamodel"."Indicators_3_area";
select p_code as pcode_level3
	,st_area(st_transform(geom,4326)::geography)/1000000 as land_area
into "MOZ_datamodel"."Indicators_3_area"
from geo_source.MOZ_adm3_mapshaper
;
--select * from "MOZ_datamodel"."Indicators_3_area"

drop table if exists "MOZ_datamodel"."Indicators_3_population";
select "P_CODE" as pcode_level3
	,population
into "MOZ_datamodel"."Indicators_3_population"
from MOZ_source.population_worldpop
;
--select * from "MOZ_datamodel"."Indicators_3_population"

drop table if exists "MOZ_datamodel"."Indicators_3_hazards";
select "PCODE" as pcode_level3
	,cs_sum + cy_sum as cyclone_phys_exp 	
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "MOZ_datamodel"."Indicators_3_hazards"
from MOZ_source.hazards
;


drop table if exists "MOZ_datamodel"."Indicators_3_traveltime";
select "P_CODE" as pcode_level3
	,case when traveltime < 0 then 0 else traveltime end as traveltime
into "MOZ_datamodel"."Indicators_3_traveltime"
from MOZ_source.traveltime
;


drop table if exists "MOZ_datamodel"."Indicators_3_gdp";
select t0."P_CODE" as pcode_level3
	,gdp * 1000 / population as gdp_per_capita
into "MOZ_datamodel"."Indicators_3_gdp"
from MOZ_source.gdp t0
left join moz_source.population_worldpop t1 on t0."P_CODE" = t1."P_CODE"
;



------------------
-- Level 2 data --
------------------


-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "MOZ_datamodel"."Indicators_3_TOTAL_temp";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
	,case when population = 0 then null when population < cyclone_phys_exp then 1 else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null when population < drought_phys_exp then 1 else drought_phys_exp / population end as drought_phys_exp
	,case when population = 0 then null when population < earthquake7_phys_exp then 1 else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null when population < flood_phys_exp then 1 else flood_phys_exp / population end as flood_phys_exp
	,case when population = 0 then null when population < tsunami_phys_exp then 1 else tsunami_phys_exp / population end as tsunami_phys_exp
	,t4.traveltime
	,t5.gdp_per_capita
	--,tX.XXX ADD NEW VARIABLE HERE
into "MOZ_datamodel"."Indicators_3_TOTAL_temp"
from "MOZ_datamodel"."Geo_level3" t0
left join "MOZ_datamodel"."Indicators_3_area" 		t1	on t0.pcode_level3 = t1.pcode_level3
left join "MOZ_datamodel"."Indicators_3_population"	t2	on t0.pcode_level3 = t2.pcode_level3
left join "MOZ_datamodel"."Indicators_3_hazards" 	t3	on t0.pcode_level3 = t3.pcode_level3
left join "MOZ_datamodel"."Indicators_3_traveltime" 	t4	on t0.pcode_level3 = t4.pcode_level3
left join "MOZ_datamodel"."Indicators_3_gdp" 		t5	on 	t0.pcode_level3 = t5.pcode_level3
--left join "MOZ_datamodel"."Indicators_3_XXX" 		tX	on t0.pcode_level3 = tX.pcode_level3
;
--select * from "MOZ_datamodel"."Indicators_3_TOTAL_temp"

drop table if exists "MOZ_datamodel"."Indicators_2_TOTAL_temp";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,level3.population,land_area,pop_density --ADD NEW LEVEL3 VARIABLES HERE
	,cyclone_phys_exp,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp,tsunami_phys_exp,traveltime
	,gdp_per_capita
	--ADD NEW LEVEL2 VARIABLES HERE
into "MOZ_datamodel"."Indicators_2_TOTAL_temp"
from "MOZ_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(traveltime * population) / sum(population) as traveltime
		,sum(gdp_per_capita * population) / sum(population) as gdp_per_capita
		--ADD NEW LEVEL4-VARIABLES HERE AS WELL
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "MOZ_datamodel"."Indicators_3_TOTAL_temp"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
--left join "MOZ_datamodel"."Indicators_2_XXX" 		t1	on t0.pcode_level2 = t1.pcode_level2
;
--select * from "MOZ_datamodel"."Indicators_2_TOTAL_temp"


drop table if exists "MOZ_datamodel"."Indicators_1_TOTAL_temp";
select t0.pcode_level1 as pcode
	,level2.population,land_area,pop_density --ADD NEW LEVEL2 VARIABLES HERE
	,cyclone_phys_exp,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp,tsunami_phys_exp,traveltime
	,gdp_per_capita
	--ADD NEW LEVEL1 VARIABLES HERE
into "MOZ_datamodel"."Indicators_1_TOTAL_temp"
from "MOZ_datamodel"."Geo_level1" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(traveltime * population) / sum(population) as traveltime
		,sum(gdp_per_capita * population) / sum(population) as gdp_per_capita
		--ADD NEW LEVEL4-VARIABLES HERE AS WELL
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "MOZ_datamodel"."Indicators_2_TOTAL_temp"
	group by 1
	) level2
	on t0.pcode_level1 = level2.pcode_parent
--left join "MOZ_datamodel"."Indicators_1_XXX" 		t1	on t0.pcode_level1 = t1.pcode_level1
;
--select * from "MOZ_datamodel"."Indicators_1_TOTAL_temp"



----------------------------------
-- 2.1: Calculate INFORM-scores --
----------------------------------

--IMPORTANT: Update and Upload metadata_prototype.csv first!

--calculate INFORM-scores at lowest level:level2
select usp_inform('MOZ',3);
select usp_inform('MOZ',2);
select usp_inform('MOZ',1);
--ALTER TABLE "MOZ_datamodel"."total_scores_level2" DROP COLUMN risk_score, DROP COLUMN vulnerability_score, DROP COLUMN hazard_score, DROP COLUMN coping_capacity_score;
--select * from "MOZ_datamodel"."total_scores_level1"


--select usp_inform('BEN',1);
--ALTER TABLE "MOZ_datamodel"."total_scores_level1" DROP COLUMN risk_score, DROP COLUMN vulnerability_score, DROP COLUMN hazard_score, DROP COLUMN coping_capacity_score;
--select * from "MOZ_datamodel"."total_scores_level1"

--ADD risk scores to Indicators_TOTAL table
drop table if exists "MOZ_datamodel"."Indicators_3_TOTAL";
select *
into "MOZ_datamodel"."Indicators_3_TOTAL"
from "MOZ_datamodel"."Indicators_3_TOTAL_temp" t0
left join "MOZ_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
--select * from "MOZ_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "MOZ_datamodel"."Indicators_2_TOTAL";
select *
into "MOZ_datamodel"."Indicators_2_TOTAL"
from "MOZ_datamodel"."Indicators_2_TOTAL_temp" t0
left join "MOZ_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--select * from "MOZ_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "MOZ_datamodel"."Indicators_1_TOTAL";
select *
into "MOZ_datamodel"."Indicators_1_TOTAL"
from "MOZ_datamodel"."Indicators_1_TOTAL_temp" t0
left join "MOZ_datamodel"."total_scores_level1" t1
on t0.pcode = t1.pcode_level1
;
--select * from "MOZ_datamodel"."Indicators_1_TOTAL" 






