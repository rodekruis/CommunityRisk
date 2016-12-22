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


------------------
-- Level 3 data --
------------------

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

drop table if exists "NP_datamodel"."Indicators_3_walltype";
SELECT 'NP-' || ocha_pcode as pcode_level3
	,walls_mudbonded, walls_cementbonded, walls_wood, 
       walls_bamboo, walls_unbakedbrick, walls_others, walls_notstated
INTO "NP_datamodel"."Indicators_3_walltype"
FROM np_source."Indicators_3_evelien"
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

drop table if exists "NP_datamodel"."Indicators_4_TOTAL";
select t0.pcode_level4 as pcode
	,t0.pcode_level3 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
into "NP_datamodel"."Indicators_4_TOTAL"
from "NP_datamodel"."Geo_level4" t0
left join "NP_datamodel"."Indicators_4_area" 		t1	on t0.pcode_level4 = t1.pcode_level4
left join "NP_datamodel"."Indicators_4_population" 	t2	on t0.pcode_level4 = t2.pcode_level4
;


drop table if exists "NP_datamodel"."Indicators_3_TOTAL";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,level4.land_area,population,pop_density
	,t1.earlydeath,illiteracy,nosafewater,malnourished,provisioning,hpi,hdi
into "NP_datamodel"."Indicators_3_TOTAL"
from "NP_datamodel"."Geo_level3" t0
left join (
	select pcode_parent
		,sum(land_area) as land_area
		,sum(population) as population
		,sum(pop_density * land_area) / sum(land_area) as pop_density
	from "NP_datamodel"."Indicators_4_TOTAL"
	group by 1
	) level4
	on t0.pcode_level3 = level4.pcode_parent
left join "NP_datamodel"."Indicators_3_vulnerability" 	t1	on t0.pcode_level3 = t1.pcode_level3
;


drop table if exists "NP_datamodel"."Indicators_2_TOTAL";
select t0.pcode_level2 as pcode
	,level3.population,land_area,pop_density
	,level3.earlydeath,illiteracy,nosafewater,malnourished,provisioning,hpi,hdi
into "NP_datamodel"."Indicators_2_TOTAL"
from "NP_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(earlydeath * population) / sum(population) as earlydeath
		,sum(illiteracy * population) / sum(population) as illiteracy
		,sum(nosafewater * population) / sum(population) as nosafewater
		,sum(malnourished * population) / sum(population) as malnourished
		,sum(provisioning * population) / sum(population) as provisioning
		,sum(hpi * population) / sum(population) as hpi
		,sum(hdi * population) / sum(population) as hdi
	from "NP_datamodel"."Indicators_3_TOTAL"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
;

--select * from "NP_datamodel"."Indicators_3_TOTAL"
drop table if exists "NP_datamodel"."total_scores_level2";
select *
into "NP_datamodel"."total_scores_level2"
from "MW_datamodel"."total_scores_level2"
limit 0;

