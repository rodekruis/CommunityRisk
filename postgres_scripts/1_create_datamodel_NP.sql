drop schema if exists "NP_datamodel" cascade;
create schema "NP_datamodel";

-------------------------
-- 0: Load source data --
-------------------------


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------


drop table if exists "NP_datamodel"."Geo_level2";
select hrpcode as pcode_level2
	,zone_name as name
	,hrparent as pcode_level1
	,t2.geom
into "NP_datamodel"."Geo_level2"
from "geo_source"."Geo_NP_level2" t1
left join "geo_source"."Geo_NP_level2_mapshaper" t2	on t1.gid = t2.gid
;

drop table if exists "NP_datamodel"."Geo_level3";
select hrpcode as pcode_level3
	,district as name
	,hrparent as pcode_level2
	,t2.geom
into "NP_datamodel"."Geo_level3"
from "geo_source"."Geo_NP_level3" t1
left join "geo_source"."Geo_NP_level3_mapshaper" t2	on t1.gid = t2.gid
;

drop table if exists "NP_datamodel"."Geo_level4";
select hrpcode as pcode_level4
	,vdc_name as name
	,hrparent as pcode_level3
	,geom
into "NP_datamodel"."Geo_level4"
from "geo_source"."Geo_NP_level4"
;

------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 4 data --
------------------

drop table if exists "NP_datamodel"."Indicators_4_area";
select pcode_level4
	,st_area(st_transform(geom,4326)::geography)/1000000 as land_area
into "NP_datamodel"."Indicators_4_area"
from "NP_datamodel"."Geo_level4"
;

drop table if exists "NP_datamodel"."Indicators_4_population";
select 'NP-' || "P_CODE" as pcode_level4
	,"Popn2011" as population
into "NP_datamodel"."Indicators_4_population"
from np_source."Indicators_4_population"
;

drop table if exists "NP_datamodel"."Indicators_4_traveltime";
select "PCODE" as pcode_level4
	,tt_mean as traveltime
into "NP_datamodel"."Indicators_4_traveltime"
from np_source."Indicators_4_traveltime"
;


------------------
-- Level 3 data --
------------------

drop table if exists "NP_datamodel"."Indicators_3_hazards";
select "PCODE" as pcode_level3
	,cs_sum + cy_sum as cyclone_phys_exp 	/* Combine into one variable */
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "NP_datamodel"."Indicators_3_hazards"
from "np_source"."Indicators_3_hazards"
;

drop table if exists "NP_datamodel"."Indicators_3_vulnerability";
SELECT 'NP-' || ocha_pcode as pcode_level3
	,earlydeath/100 as earlydeath
	,illiteracy/100 as illiteracy
	,nosafewater/100 as nosafewater
	,malnourished/100 as malnourished
	,provisioning/100 as provisioning
	,hpi/100 as hpi
	,hdi
INTO "NP_datamodel"."Indicators_3_vulnerability"
FROM np_source."Indicators_3_evelien"
;

--walltype
drop table if exists "NP_datamodel"."Indicators_3_walltype";
with total as (
SELECT ocha_pcode
	,(walls_mudbonded+ walls_cementbonded+ walls_wood+ 
       walls_bamboo+ walls_unbakedbrick+ walls_others+ walls_notstated) as total
FROM np_source."Indicators_3_evelien"
)
select 'NP-' || t0.ocha_pcode as pcode_level3
	,walls_mudbonded/total as walls_mudbonded
	,walls_cementbonded/total as walls_cementbonded
	,walls_wood/total as walls_wood
	,walls_bamboo/total as walls_bamboo
	,walls_unbakedbrick/total as walls_unbakedbrick
	,walls_others/total as walls_others
	,walls_notstated/total as walls_notstated
INTO "NP_datamodel"."Indicators_3_walltype"
FROM "np_source"."Indicators_3_evelien" t0
LEFT JOIN total on t0.ocha_pcode = total.ocha_pcode
;

--rooftype
drop table if exists "NP_datamodel"."Indicators_3_rooftype";
with total as (
SELECT ocha_pcode
	,(roof_thatch+ roof_iron+ roof_tile+ roof_rcc+ roof_wood+ roof_mud+ 
       roof_others+ roof_notstated) as total
FROM np_source."Indicators_3_evelien"
)
select 'NP-' || t0.ocha_pcode as pcode_level3
	,roof_thatch/total as roof_thatch
	,roof_iron/total as roof_iron
	,roof_tile/total as roof_tile
	,roof_rcc/total as roof_rcc
	,roof_wood/total as roof_wood
	,roof_mud/total as roof_mud
	,roof_others/total as roof_others
	,roof_notstated/total as roof_notstated
INTO "NP_datamodel"."Indicators_3_rooftype"
FROM "np_source"."Indicators_3_evelien" t0
LEFT JOIN total on t0.ocha_pcode = total.ocha_pcode
;


/*
SELECT index, dist_code, ocha_pcode, zone, reg_code, zone_code, dist_name, 
       areakm2, housing_units2011, house_density, total_buildings, total_hh2011, 
       hh_size, popdensity, pop, earlydeath, illiteracy, nosafewater, 
       malnourished, provisioning, hpi, hdi, foundation_mudbonded, foundation_cementbonded, 
       foundation_rccpillar, foundation_woodenpillar, foundation_others, 
       foundation_notstated, walls_mudbonded, walls_cementbonded, walls_wood, 
       walls_bamboo, walls_unbakedbrick, walls_others, walls_notstated, 
       roof_thatch, roof_iron, roof_tile, roof_rcc, roof_wood, roof_mud, 
       roof_others, roof_notstated
  FROM np_source."Indicators_3_evelien";
  */


------------------
-- Level 2 data --
------------------


-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "NP_datamodel"."Indicators_4_TOTAL_temp";
select t0.pcode_level4 as pcode
	,t0.pcode_level3 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
	,traveltime
	--,tX.XXX ADD NEW VARIABLE HERE
into "NP_datamodel"."Indicators_4_TOTAL_temp"
from "NP_datamodel"."Geo_level4" t0
left join "NP_datamodel"."Indicators_4_area" 		t1	on t0.pcode_level4 = t1.pcode_level4
left join "NP_datamodel"."Indicators_4_population" 	t2	on t0.pcode_level4 = t2.pcode_level4
left join "NP_datamodel"."Indicators_4_traveltime" 	t3	on t0.pcode_level4 = t3.pcode_level4
--left join "NP_datamodel"."Indicators_4_XXX" 		tX	on t0.pcode_level4 = tX.pcode_level4
;


drop table if exists "NP_datamodel"."Indicators_3_TOTAL_temp";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,level4.land_area,population,pop_density,traveltime
	--ADD NEW LEVEL4 VARIABLES HERE AGAIN AS WELL (in aggregated form)
	,t1.earlydeath,illiteracy,nosafewater,malnourished,provisioning,hpi,hdi
	,case when population = 0 then null else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null else drought_phys_exp / population end as drought_phys_exp
	,case when population = 0 then null else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null else flood_phys_exp / population end as flood_phys_exp
	,case when population = 0 then null else tsunami_phys_exp / population end as tsunami_phys_exp
	--ADD NEW LEVEL3 VARIABLES HERE
into "NP_datamodel"."Indicators_3_TOTAL_temp"
from "NP_datamodel"."Geo_level3" t0
left join (
	select pcode_parent
		,sum(land_area) as land_area
		,sum(population) as population
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(traveltime * population) / sum(population) as traveltime
		--ADD NEW LEVEL4 VARIABLES HERE AGAIN AS WELL (in aggregated form)
	from "NP_datamodel"."Indicators_4_TOTAL_temp"
	group by 1
	) level4
	on t0.pcode_level3 = level4.pcode_parent
left join "NP_datamodel"."Indicators_3_vulnerability" 	t1	on t0.pcode_level3 = t1.pcode_level3
left join "NP_datamodel"."Indicators_3_hazards" 	t2	on t0.pcode_level3 = t2.pcode_level3
--left join "NP_datamodel"."Indicators_3_XXX" 		t3	on t0.pcode_level3 = t3.pcode_level3
;


drop table if exists "NP_datamodel"."Indicators_2_TOTAL_temp";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,level3.population,land_area,pop_density,traveltime --ADD NEW LEVEL4 VARIABLES HERE
	,level3.earlydeath,illiteracy,nosafewater,malnourished,provisioning,hpi,hdi,cyclone_phys_exp,drought_phys_exp,tsunami_phys_exp,flood_phys_exp,earthquake7_phys_exp --ADD NEW LEVEL3 VARIABLES HERE
	--ADD NEW LEVEL2 VARIABLES HERE
into "NP_datamodel"."Indicators_2_TOTAL_temp"
from "NP_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(traveltime * population) / sum(population) as traveltime
		--ADD NEW LEVEL4-VARIABLES HERE AS WELL
		,sum(earlydeath * population) / sum(population) as earlydeath
		,sum(illiteracy * population) / sum(population) as illiteracy
		,sum(nosafewater * population) / sum(population) as nosafewater
		,sum(malnourished * population) / sum(population) as malnourished
		,sum(provisioning * population) / sum(population) as provisioning
		,sum(hpi * population) / sum(population) as hpi
		,sum(hdi * population) / sum(population) as hdi
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "NP_datamodel"."Indicators_3_TOTAL_temp"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
--left join "NP_datamodel"."Indicators_2_XXX" 		t1	on t0.pcode_level2 = t1.pcode_level2
;

----------------------------------
-- 2.1: Calculate INFORM-scores --
----------------------------------

--calculate INFORM-scores at lowest level:level3
select usp_inform('NP',3);

--aggregate to higher levels
drop table if exists "NP_datamodel"."total_scores_level2";
select t1.pcode_parent as pcode_level2
	,sum(risk_score * population) / sum(population) as risk_score
	,sum(hazard_score * population) / sum(population) as hazard_score
	,sum(vulnerability_score * population) / sum(population) as vulnerability_score
	,sum(coping_capacity_score * population) / sum(population) as coping_capacity_score
	,sum(earlydeath_score * population) / sum(population) as earlydeath_score,sum(illiteracy_score * population) / sum(population) as illiteracy_score,sum(nosafewater_score * population) / sum(population) as nosafewater_score
		,sum(malnourished_score * population) / sum(population) as malnourished_score,sum(provisioning_score * population) / sum(population) as provisioning_score,sum(hpi_score * population) / sum(population) as hpi_score
		,sum(hdi_score * population) / sum(population) as hdi_score
	,sum(flood_phys_exp_score * population) / sum(population) as flood_phys_exp_score,sum(earthquake7_phys_exp_score * population) / sum(population) as earthquake7_phys_exp_score
		,sum(drought_phys_exp_score * population) / sum(population) as drought_phys_exp_score
	,sum(traveltime_score * population) / sum(population) as traveltime_score
	--PLACEHOLDER
	--,sum(XXX_score * population)/ sum(population) as XXX_score
into "NP_datamodel"."total_scores_level2"
from "NP_datamodel"."total_scores_level3" t0
join "NP_datamodel"."Indicators_3_TOTAL_temp" t1	on t0.pcode_level3 = t1.pcode
group by t1.pcode_parent
;

select usp_inform('NP',4);
ALTER TABLE "NP_datamodel"."total_scores_level4" DROP COLUMN risk_score, DROP COLUMN vulnerability_score, DROP COLUMN hazard_score, DROP COLUMN coping_capacity_score;
--select * from "NP_datamodel"."total_scores_level4"


--ADD risk scores to Indicators_TOTAL table
drop table if exists "NP_datamodel"."Indicators_2_TOTAL";
select *
into "NP_datamodel"."Indicators_2_TOTAL"
from "NP_datamodel"."Indicators_2_TOTAL_temp" t0
left join "NP_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--select * from "NP_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "NP_datamodel"."Indicators_3_TOTAL";
select *
into "NP_datamodel"."Indicators_3_TOTAL"
from "NP_datamodel"."Indicators_3_TOTAL_temp" t0
left join "NP_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
--select * from "NP_datamodel"."Indicators_3_TOTAL" 


--ADD risk scores to Indicators_TOTAL table
drop table if exists "NP_datamodel"."Indicators_4_TOTAL";
select *
into "NP_datamodel"."Indicators_4_TOTAL"
from "NP_datamodel"."Indicators_4_TOTAL_temp" t0
left join "NP_datamodel"."total_scores_level4" t1
on t0.pcode = t1.pcode_level4
;
