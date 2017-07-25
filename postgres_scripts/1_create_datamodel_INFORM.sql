drop schema if exists "INFORM_datamodel" cascade;
create schema "INFORM_datamodel";

-------------------------------
-- 0: LOAD into Source-layer --
-------------------------------
/*
--load indicator data from JSON derived from API
drop  table if exists "inform"."api_data";
create temporary table temp_json (values text) on commit drop;
copy temp_json from 'C:\Users\JannisV\Rode Kruis\CP data\inform_global.json';
--select * from temp_json
select values->>'ISO3' as ISO3,
       values->>'Country' as Country,
       values->>'IndicatorId' as IndicatorId,
       values->>'FullName' as FullName,
       values->>'IndicatorScore' as IndicatorScore      
into "inform_source"."api_data"
from   (
           select json_array_elements(replace(values,'\','\\')::json) as values 
           from   temp_json
       ) a;
--select * from "INFORM_datamodel"."api_data"
*/
-------------------------------
-- 1: LOAD into Source-layer --
-------------------------------

--Make the geo-table: 
drop table if exists "INFORM_datamodel"."Geo_level2";
select t1.iso3 as pcode_level2
	,t1.country as name
	,'' as pcode_level1
	,t2.geom
INTO "INFORM_datamodel"."Geo_level2"
FROM "inform_source"."geo_global" t1
JOIN "inform_source"."geo_global_mapshaper" t2	ON t1.gid = t2.gid
WHERE iso3 not in ('ATA','GRL') --leave out Antarctica and Greenland
; 
--select * from "INFORM_datamodel"."Geo_level2"

--Transpose rows to columns
drop table if exists "INFORM_datamodel"."Indicators_2_TOTAL";
select ISO3 as pcode
	,'' as pcode_parent
	,max(case when indicatorid = 'INFORM' then indicatorscore end) 	as risk_score
	,max(case when indicatorid = 'HA' then indicatorscore end) 	as hazard_score
	,max(case when indicatorid = 'HA.HUM' then indicatorscore end) 	as human_hazard
	,max(case when indicatorid = 'HA.NAT' then indicatorscore end) 	as natural_hazard
	,max(case when indicatorid = 'VU' then indicatorscore end) 	as vulnerability_score
	,max(case when indicatorid = 'VU.SEV' then indicatorscore end) 	as socioeconomic_vul
	,max(case when indicatorid = 'VU.VGR' then indicatorscore end) 	as vul_groups
	,max(case when indicatorid = 'CC' then indicatorscore end) 	as coping_capacity_score
	,max(case when indicatorid = 'CC.INF' then indicatorscore end) 	as infrastructure
	,max(case when indicatorid = 'CC.INS' then indicatorscore end) 	as institutions
	,max(t1.population_2015) as population
into "INFORM_datamodel"."Indicators_2_TOTAL"
from "inform_source"."api_data" t0
left join "inform_source"."worldpopulation" t1 on t0.iso3 = t1."Country Code"
group by ISO3;

--Make a dummy-table which is necessary for now to prevent errors (solve this in future)
drop table if exists "INFORM_datamodel"."total_scores_level2";
select pcode_level2
into "INFORM_datamodel"."total_scores_level2"
from "PH_datamodel"."total_scores_level2"
limit 0;
--select * from "INFORM_datamodel"."total_scores_level2"

