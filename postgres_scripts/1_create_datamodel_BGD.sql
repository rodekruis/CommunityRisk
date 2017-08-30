drop schema if exists "BGD_datamodel" cascade;
create schema "BGD_datamodel";

-------------------------
-- 0: Load source data --
-------------------------

--Preferred option to import csv through postgres_scripts/pg_import_csv.py


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------

drop table if exists "BGD_datamodel"."Geo_level2";
select disgeocode as pcode_level2
	,district as name
	,substring(cast(disgeocode as varchar),1,2) as pcode_level1
	,geom
into "BGD_datamodel"."Geo_level2"
from "geo_source"."bgd_adm2_mapshaper"
;

drop table if exists "BGD_datamodel"."Geo_level3";
select upzcode as pcode_level3
	,upazila as name
	,substring(cast(upzcode as varchar),1,4) as pcode_level2
	,geom
into "BGD_datamodel"."Geo_level3"
from "geo_source"."bgd_adm3_mapshaper"
;

drop table if exists "BGD_datamodel"."Geo_level4";
select geocode11 as pcode_level4
	,"union" as name
	,upzcode as pcode_level3
	,geom
into "BGD_datamodel"."Geo_level4"
from "geo_source"."bgd_adm4_mapshaper"
where landtype = 'Land'
;


------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

-------------
-- Level 3 --
-------------

drop table if exists "BGD_datamodel"."Indicators_3_population";
select *
--into "BGD_datamodel"."Indicators_3_population"
from "geo_source"."bgd_adm4_mapshaper" limit 10
;

drop table if exists "BGD_datamodel"."Indicators_3_hazards";
select "PCODE" as pcode_level3
	,cs_sum + cy_sum as cyclone_phys_exp 	/* Combine into one variable */
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "BGD_datamodel"."Indicators_3_hazards"
from "BGD_source"."Indicators_3_hazards"
;

drop table if exists "BGD_datamodel"."Indicators_3_traveltime";
select "PCODE" as pcode_level3
	,tt_mean as traveltime
into "BGD_datamodel"."Indicators_3_traveltime"
from "BGD_source"."Indicators_3_traveltime"
;

-------------
-- Level 2 --
-------------

drop table if exists "BGD_datamodel"."Indicators_2_poverty";
select t1.pcode_level2
	,t0."Poverty Headcount" as poverty_incidence
into "BGD_datamodel"."Indicators_2_poverty"
from BGD_source."Indicators_2_poverty" t0
left join (select case when name = 'Kapiri Mposhi' then 'Kapiri-Mposhi'
		when name = 'Shang''ombo' then 'Shang’ombo'
		else name end as name
		,pcode_level2
	from "BGD_datamodel"."Geo_level2" 
	)t1 on t0."District" = t1.name
;



-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "BGD_datamodel"."Indicators_3_TOTAL_temp";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,t1.population,land_area
	,population / land_area as pop_density
--	,case when population = 0 then null else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null else drought_phys_exp / population end as drought_phys_exp
	,case when population = 0 then null else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null else flood_phys_exp / population end as flood_phys_exp
--	,case when population = 0 then null else tsunami_phys_exp / population end as tsunami_phys_exp
	,t3.traveltime
into "BGD_datamodel"."Indicators_3_TOTAL_temp"
from "BGD_datamodel"."Geo_level3" t0
left join "BGD_datamodel"."Indicators_3_population" t1	on t0.pcode_level3 = t1.pcode_level3
left join "BGD_datamodel"."Indicators_3_hazards" t2	on t0.pcode_level3 = t2.pcode_level3
left join "BGD_datamodel"."Indicators_3_traveltime" t3	on t0.pcode_level3 = t3.pcode_level3
;


drop table if exists "BGD_datamodel"."Indicators_2_TOTAL_temp";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,level3.population,land_area,pop_density
	,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp
	,traveltime
	,t1.poverty_incidence
into "BGD_datamodel"."Indicators_2_TOTAL_temp"
from "BGD_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
--		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
--		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(traveltime * population) / sum(population) as traveltime
	from "BGD_datamodel"."Indicators_3_TOTAL_temp"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
left join "BGD_datamodel"."Indicators_2_poverty" t1	on t0.pcode_level2 = t1.pcode_level2
;

drop table if exists "BGD_datamodel"."Indicators_1_TOTAL_temp";
select t0.pcode_level1 as pcode
	,t0.pcode_level0 as pcode_parent
	,level2.population,land_area,pop_density
	,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp
	,traveltime
	,poverty_incidence
into "BGD_datamodel"."Indicators_1_TOTAL_temp"
from "BGD_datamodel"."Geo_level1" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
--		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
--		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(traveltime * population) / sum(population) as traveltime
		,sum(poverty_incidence * population) / sum(population) as poverty_incidence
	from "BGD_datamodel"."Indicators_2_TOTAL_temp"
	group by 1
	) level2
	on t0.pcode_level1 = level2.pcode_parent
;

----------------------------------
-- 2.1: Calculate INFORM-scores --
----------------------------------

--calculate INFORM-scores at lowest level:level2
select usp_inform('ZMB',2);


--aggregate to higher levels
drop table if exists "BGD_datamodel"."total_scores_level1";
select t1.pcode_parent as pcode_level1
	,sum(risk_score * population) / sum(population) as risk_score
	,sum(hazard_score * population) / sum(population) as hazard_score
	,sum(vulnerability_score * population) / sum(population) as vulnerability_score
	,sum(coping_capacity_score * population) / sum(population) as coping_capacity_score
	,sum(poverty_incidence_score * population) / sum(population) as poverty_incidence_score
	,sum(flood_phys_exp_score * population) / sum(population) as flood_phys_exp_score,sum(earthquake7_phys_exp_score * population) / sum(population) as earthquake7_phys_exp_score
		,sum(drought_phys_exp_score * population) / sum(population) as drought_phys_exp_score
	,sum(traveltime_score * population) / sum(population) as traveltime_score
	--PLACEHOLDER
	--,sum(XXX_score * population)/ sum(population) as XXX_score
into "BGD_datamodel"."total_scores_level1"
from "BGD_datamodel"."total_scores_level2" t0
join "BGD_datamodel"."Indicators_2_TOTAL_temp" t1	on t0.pcode_level2 = t1.pcode
group by t1.pcode_parent
;

--do the calculation also for level3 (so that individual indicator-scores are available) but set composite scores to null
select usp_inform('ZMB',3);
ALTER TABLE "BGD_datamodel"."total_scores_level3" DROP COLUMN risk_score, DROP COLUMN vulnerability_score, DROP COLUMN hazard_score, DROP COLUMN coping_capacity_score;
--select * from "BGD_datamodel"."total_scores_level3"

--ADD risk scores to Indicators_TOTAL table
drop table if exists "BGD_datamodel"."Indicators_2_TOTAL";
select *
into "BGD_datamodel"."Indicators_2_TOTAL"
from "BGD_datamodel"."Indicators_2_TOTAL_temp" t0
left join "BGD_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--select * from "BGD_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "BGD_datamodel"."Indicators_1_TOTAL";
select *
into "BGD_datamodel"."Indicators_1_TOTAL"
from "BGD_datamodel"."Indicators_1_TOTAL_temp" t0
left join "BGD_datamodel"."total_scores_level1" t1
on t0.pcode = t1.pcode_level1
;
--select * from "BGD_datamodel"."Indicators_1_TOTAL" 

drop table if exists "BGD_datamodel"."Indicators_3_TOTAL";
select *
into "BGD_datamodel"."Indicators_3_TOTAL"
from "BGD_datamodel"."Indicators_3_TOTAL_temp" t0
left join "BGD_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
--select * from "BGD_datamodel"."Indicators_1_TOTAL" 

