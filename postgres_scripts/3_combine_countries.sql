drop schema if exists "tot_datamodel" cascade;
create schema "tot_datamodel";

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------

--TO DO (all levels): adjust to to-be-adjusted variable/table names of Philippines

--Level 2
drop table if exists "tot_datamodel"."Geo_level2";
select 'PH' as country_code
	,pcode_level2
	,name_level2 as name
	,pcode_level1
	,geom
into "tot_datamodel"."Geo_level2"
from "PH_datamodel"."Geo_level2"
union all
select 'MW' as country_code
	,*
from "MW_datamodel"."Geo_level2"
union all
select 'NP' as country_code
	,*
from "NP_datamodel"."Geo_level2"
;

--Level 3
drop table if exists "tot_datamodel"."Geo_level3";
select 'PH' as country_code
	,pcode_level3
	,name_level3 as name
	,pcode_level2
	,geom
into "tot_datamodel"."Geo_level3"
from "PH_datamodel"."Geo_level3"
union all
select 'MW' as country_code
	,*
from "MW_datamodel"."Geo_level3"
union all
select 'NP' as country_code
	,*
from "NP_datamodel"."Geo_level3"
;

--Level 4
drop table if exists "tot_datamodel"."Geo_level4";
select 'PH' as country_code
	,pcode_level4
	,name_level4 as name
	,pcode_level3
	,geom
into "tot_datamodel"."Geo_level4"
from "PH_datamodel"."Geo_level4"
union all
select 'NP' as country_code
	,*
from "NP_datamodel"."Geo_level4"
;

-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------
/*
drop table if exists "tot_datamodel"."Indicators_TOTAL";
--Level 4
--Philippines
select 'PH' as country_code
	,substr(pcode_municipality,1,4) || '0000000'  as pcode_level1
	,substr(pcode_municipality,1,6) || '00000'  as pcode_level2
	,pcode_municipality as pcode_level3
	,pcode_barangay as pcode_level4
	,null as timeperiod
	,null as gender
	,unnest(array['population'
			,'land_area'
			,'gdp'
			,'traveltime'
			--,'rural_urban'
			]) as metric
	,unnest(array[population
			,land_area
			,gdp
			,traveltime
			--,rural_urban
			]) as value
into "tot_datamodel"."Indicators_TOTAL"
from "PH_datamodel"."Indicators_4_TOTAL"

union all

--Level3
--Malawi
select 'MW' as country_code
	,substr(pcode_level2,1,7) as pcode_level1
	,pcode_level2
	,pcode_level3
	,null as pcode_level4
	,null as timeperiod
	,null as gender
	,unnest(array['population'
			,'land_area'
			]) as metric
	,unnest(array[population
			,land_area
			]) as value
from "MW_datamodel"."Indicators_3_TOTAL"

union all 

--Philippines
select 'PH' as country_code
	,substr(pcode_municipality,1,4) || '0000000'  as pcode_level1
	,pcode_province as pcode_level2
	,pcode_municipality as pcode_level3
	,null as pcode_level4
	,null as timeperiod
	,null as gender
	,unnest(array['poverty_incidence','flood_risk','cyclone_risk','landslide_risk','earthquake7_phys_exp','tsunami_phys_exp','cyclone_surge_2m_phys_exp'
			,'nr_facilities','total','good_governance_index','income_class'
			]) as metric
	,unnest(array[poverty_incidence,flood_risk,cyclone_risk,landslide_risk,earthquake7_phys_exp,tsunami_phys_exp,cyclone_surge_2m_phys_exp
			,nr_facilities,total,good_governance_index,income_class
			]) as value
from "PH_datamodel"."Indicators_3_TOTAL"

union all

--Level 2
--Philippines
select 'PH' as country_code
	,substr(pcode_province,1,4) || '0000000'  as pcode_level1
	,pcode_province as pcode_level2
	,null as pcode_level3
	,null as pcode_level4
	,null as timeperiod
	,null as gender
	,unnest(array['hdi'
			]) as metric
	,unnest(array[hdi
			]) as value
from "PH_datamodel"."Indicators_2_TOTAL"
;

select * from (
select t1.country_code
	,t1.pcode_level1
	,t1.pcode_level2
	,t1.pcode_level3
	,t1.timeperiod
	,t1.gender
	,t1.metric
	,case when max(t1.pcode_level4) is null 	then sum(t1.value)
		when t2.agg_method = 'sum' 		then sum(t1.value)
		when t2.agg_method = 'weighted_avg' 	then (case when sum(t3.value) = 0 then null else sum(t1.value * t3.value) / sum(t3.value) end)
	 end as value
from "tot_datamodel"."Indicators_TOTAL" t1
left join public.metadata t2				on t1.metric = t2.variable
left join "tot_datamodel"."Indicators_TOTAL" t3	on 	t1.pcode_level4 = t3.pcode_level4 and t2.weight_var = t3.metric
group by 1,2,3,4,5,6,7
	,t2.agg_method
) aa
where country_code = 'PH'

select *
from "tot_datamodel"."Indicators_TOTAL"
where metric = 'population' and value = 0

--Level 4
drop table if exists "PH_datamodel"."Indicators_4_TOTAL";
select *
into "PH_datamodel"."Indicators_4_TOTAL"
from "PH_datamodel"."Indicators_4_TOTAL_full"
;

--Level 3
drop table if exists "PH_datamodel"."Indicators_4_TOTAL";
select *
into "PH_datamodel"."Indicators_4_TOTAL"
from "PH_datamodel"."Indicators_3_TOTAL_full"
;



*/



