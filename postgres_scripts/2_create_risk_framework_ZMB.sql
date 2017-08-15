
------------------------------
-- 2: Create risk-framework --
------------------------------

--Now calculated at district-level
--TO DO: build structure where each component is rated on its lowest level, and the aggregate score is built up dynamically

------------------------
-- 2.1: Vulnerability --
------------------------

drop table if exists "ZMB_datamodel"."vulnerability_scores";

with 
--PLACEHOLDER: Add new vulnerability variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high vulnerability?)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "ZMB_datamodel"."Geo_level2" 	t0
	left join "ZMB_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
XXX_minmax as (
	select min(XXX) as min
		,max(XXX) as max
	from XXX
	),
XXX_score as (
	select t0.*
		,((XXX - min) / (max - min)) * 10 as XXX_score		--POSSIBLE SCALE INVERSION HERE: ,((max - XXX) / (max - min)) * 10 as XXX_score
	from XXX t0
	left join XXX_minmax t1 on 1=1
	),
*/	
--Poverty (Higher poverty = more vulnerable >> DO NOT switch scale around)
poverty as (
	select t0.pcode_level2
		,t1.poverty_incidence as poverty
	from "ZMB_datamodel"."Geo_level2" 	t0
	left join "ZMB_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
poverty_minmax as (
	select min(poverty) as min
		,max(poverty) as max
	from poverty
	),
poverty_score as (
	select t0.*
		,((poverty - min) / ( max - min)) * 10 as poverty_score
	from poverty t0
	left join poverty_minmax t1 on 1=1
	)

--JOINING ALL
select t0.pcode_level2
	,poverty_score,poverty
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(1
			* coalesce((10-poverty_score)/10*9+1,1) 
			--PLACEHOLDER
			--* coalesce((10-XXX_score)/10*9+1,1)
			,cast(1 as float)/cast((0
				+ case when poverty_score is null then 0 else 1 end
				--PLACEHOLDER
				--+ case when XXX_score is null then 0 else 1 end
		) as float)))/9*10 as vulnerability_score
into "ZMB_datamodel"."vulnerability_scores"
from "ZMB_datamodel"."Geo_level2" t0
left join poverty_score t2		on t0.pcode_level2 = t2.pcode_level2
--PLACEHOLDER: add new variable here
--left join XXX_score t7		on t0.pcode_level3 = t7.pcode_level3
;

------------------
-- 2.2: Hazards --
------------------

drop table if exists "ZMB_datamodel"."hazard_scores";

with 
--PLACEHOLDER: Add new hazard variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high hazard?)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "ZMB_datamodel"."Geo_level2" 	t0
	left join "ZMB_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
XXX_minmax as (
	select min(XXX) as min
		,max(XXX) as max
	from XXX
	),
XXX_score as (
	select t0.*
		,((XXX - min) / (max - min)) * 10 as XXX_score		--POSSIBLE SCALE INVERSION HERE: ,((max - XXX) / (max - min)) * 10 as XXX_score
	from XXX t0
	left join XXX_minmax t1 on 1=1
	),
*/	
haz_risk as (
	select t0.pcode_level2
		,log(case when flood_phys_exp = 0 then 0.00001 else flood_phys_exp end) as flood_phys_exp
--		,log(case when cyclone_phys_exp = 0 then 0.00001 else cyclone_phys_exp end) as cyclone_phys_exp
		,log(case when earthquake7_phys_exp = 0 then 0.00001 else earthquake7_phys_exp end) as earthquake7_phys_exp
--		,log(case when tsunami_phys_exp = 0 then 0.00001 else tsunami_phys_exp end) as tsunami_phys_exp
		,log(case when drought_phys_exp = 0 then 0.00001 else drought_phys_exp end) as drought_phys_exp
	from "ZMB_datamodel"."Geo_level2" 	t0
	left join "ZMB_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
haz_risk_minmax as (
	select min(flood_phys_exp) as min_flood
		,max(flood_phys_exp) as max_flood
		,min(earthquake7_phys_exp) as min_earthquake
		,max(earthquake7_phys_exp) as max_earthquake
		,min(drought_phys_exp) as min_drought
		,max(drought_phys_exp) as max_drought
	from haz_risk
	), 
haz_risk_score as (
	select t0.*
		,case when max_flood = min_flood then null else ((flood_phys_exp - min_flood) / (max_flood - min_flood)) * 10 end as flood_score
		,case when max_earthquake = min_earthquake then null else ((earthquake7_phys_exp - min_earthquake) / (max_earthquake - min_earthquake)) * 10 end as earthquake_score
		,case when max_drought = min_drought then null else ((drought_phys_exp - min_drought) / (max_drought - min_drought)) * 10 end as drought_score
	from haz_risk t0
	left join haz_risk_minmax t1 on 1=1
	)
--select * from haz_pe_score

--JOINING ALL
select t1.pcode_level2
	,flood_score,flood_phys_exp
	,earthquake_score,earthquake7_phys_exp
	,drought_score,drought_phys_exp
	--PLACEHOLDER
	--,XXX_scorre,XXX
	,(10 - power(1
		* coalesce((10-flood_score)/10*9+1,1) 
		* coalesce((10-earthquake_score)/10*9+1,1)
		* coalesce((10-drought_score)/10*9+1,1)
		--PLACEHOLDER
		--* coalesce((10-XXX_score)/10*9+1,1)
		,cast(1 as float)/cast(3 as float))
		)/cast(9 as float)*cast(10 as float) as hazard_score
into "ZMB_datamodel"."hazard_scores"
from "ZMB_datamodel"."Geo_level2" t0
left join haz_risk_score t1	on t0.pcode_level2 = t1.pcode_level2
--PLACEHOLDER
--left join XXX_score t2	on t0.pcode_level2 = t2.pcode_level2
;




----------------------------------
-- 2.3: Lack of Coping capacity --
----------------------------------

drop table if exists "ZMB_datamodel"."coping_capacity_scores";

with
--PLACEHOLDER: Add new coping capacity variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high lack of coping capacity? NOTE: 10 means high LACK OF coping capacity, so LOW coping capacity)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "ZMB_datamodel"."Geo_level2" 	t0
	left join "ZMB_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
XXX_minmax as (
	select min(XXX) as min
		,max(XXX) as max
	from XXX
	),
XXX_score as (
	select t0.*
		,((XXX - min) / (max - min)) * 10 as XXX_score		--POSSIBLE SCALE INVERSION HERE: ,((max - XXX) / (max - min)) * 10 as XXX_score
	from XXX t0
	left join XXX_minmax t1 on 1=1
	),
*/

--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
travel as (
	select t0.pcode_level2
		,log(1 + t1.traveltime) as travel
	from "ZMB_datamodel"."Geo_level2" t0
	left join "ZMB_datamodel"."Indicators_2_TOTAL" t1 on t0.pcode_level2 = t1.pcode
	),
travel_minmax as (
	select min(travel) as min
		,max(travel) as max
	from travel
	),
travel_score as (
	select t0.*
		,((travel - min) / (max - min)) * 10 as travel_score
	from travel t0
	join travel_minmax t1 on 1=1
	)
--select * from travel_score

--JOINING ALL
select t1.pcode_level2
	,travel_score,travel
	--PLACEHOLDER
	--,XXX_score,XXX
	,case when travel_score is null then null else
	(10-power(1
		* coalesce((10-travel_score)/10*9+1,1)
		--PLACEHOLDER
		 --* coalesce((10-XXX_score)/10*9+1,1)
			,cast(1 as float)/cast((0
		+ case when travel_score is null then 0 else 1 end
		--PLACEHOLDER
		--+ case when XXX_score is null then 0 else 1 end 
		) as float)))/9*10 end as coping_capacity_score
into "ZMB_datamodel"."coping_capacity_scores"
from "ZMB_datamodel"."Geo_level2" t0
left join travel_score t1	on t0.pcode_level2 = t1.pcode_level2
--PLACEHOLDER
--left join XXX_score t6 		on t0.pcode_level2 = t6.pcode_level2
;


----------------
-- 2.4: Total --
----------------


drop table if exists "ZMB_datamodel"."total_scores_level2";
select t1.pcode_level2
	,vulnerability_score
	,hazard_score
	,coping_capacity_score
	,poverty_score
	,flood_score,earthquake_score,drought_score
	,travel_score
	--PLACEHOLDER
	--,XXX_score
	,(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
		* coalesce((10-hazard_score)/10*9+1,1)
		* coalesce((10-coping_capacity_score)/10*9+1,1)
		, cast(1 as float)/cast(3 as float)))/9*10 as risk_score
into "ZMB_datamodel"."total_scores_level2"
from "ZMB_datamodel"."Geo_level2" t0
left join "ZMB_datamodel"."vulnerability_scores" t1	on t0.pcode_level2 = t1.pcode_level2
left join "ZMB_datamodel"."hazard_scores" t2		on t0.pcode_level2 = t2.pcode_level2
left join "ZMB_datamodel"."coping_capacity_scores" t3	on t0.pcode_level2 = t3.pcode_level2
--order by 7
;

-------------
-- Level 1 --
-------------

drop table if exists "ZMB_datamodel"."total_scores_level1";
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
into "ZMB_datamodel"."total_scores_level1"
from "ZMB_datamodel"."total_scores_level2" t0
join "ZMB_datamodel"."Indicators_2_TOTAL_temp" t1	on t0.pcode_level2 = t1.pcode
group by t1.pcode_parent
;

---------------------------------
-- Add scores to TOTALS tables --
---------------------------------

--ADD risk scores to Indicators_TOTAL table
drop table if exists "ZMB_datamodel"."Indicators_2_TOTAL";
select *
into "ZMB_datamodel"."Indicators_2_TOTAL"
from "ZMB_datamodel"."Indicators_2_TOTAL_temp" t0
left join "ZMB_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--drop table "ZMB_datamodel"."Indicators_2_TOTAL";
--select * into "ZMB_datamodel"."Indicators_2_TOTAL" from "ZMB_datamodel"."Indicators_2_TOTAL_temp";
--drop table "ZMB_datamodel"."Indicators_2_TOTAL_temp";
--select * from "ZMB_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "ZMB_datamodel"."Indicators_1_TOTAL";
select *
into "ZMB_datamodel"."Indicators_1_TOTAL"
from "ZMB_datamodel"."Indicators_1_TOTAL_temp" t0
left join "ZMB_datamodel"."total_scores_level1" t1
on t0.pcode = t1.pcode_level1
;
--drop table "ZMB_datamodel"."Indicators_1_TOTAL";
--select * into "ZMB_datamodel"."Indicators_1_TOTAL" from "ZMB_datamodel"."Indicators_1_TOTAL_temp";
--drop table "ZMB_datamodel"."Indicators_1_TOTAL_temp";
--select * from "ZMB_datamodel"."Indicators_1_TOTAL" 







