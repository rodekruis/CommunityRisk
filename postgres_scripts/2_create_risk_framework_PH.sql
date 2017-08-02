
------------------------------
-- 2: Create risk-framework --
------------------------------

--Now calculated at municipality-level
--TO DO: build structure where each component is rated on its lowest level, and the aggregate score is built up dynamically

------------------------
-- 2.1: Vulnerability --
------------------------

drop table if exists "PH_datamodel"."vulnerability_scores";

with 
--PLACEHOLDER: Add new vulnerability variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high vulnerability?)
/*
XXX as (
	select t0.pcode_level3
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
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
	select t0.pcode_level3
		,t1.poverty_incidence
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
pov_minmax as (
	select min(poverty_incidence) as min_pov
		,max(poverty_incidence) as max_pov
	from poverty
	),
pov_score as (
	select t0.*
		,((poverty_incidence - min_pov) / (max_pov - min_pov)) * 10 as pov_score
	from poverty t0
	left join pov_minmax t1 on 1=1
	),

--Pantawid (Higher Pantawid = more vulnerable >> DO NOT switch scale around)
pantawid as (
	select t0.pcode_level3
		,t1.pantawid_perc
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
pantawid_minmax as (
	select min(pantawid_perc) as min_pantawid
		,max(pantawid_perc) as max_pantawid
	from pantawid
	),
pantawid_score as (
	select t0.*
		,((pantawid_perc - min_pantawid) / (max_pantawid - min_pantawid)) * 10 as pantawid_score
	from pantawid t0
	left join pantawid_minmax t1 on 1=1
	),

--Income class (Higher income class = more vulnerable DO do NOT switch scale around)
/*
inc_class as (
	select t0.pcode_level3
		,t1.income_class
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
inc_minmax as (
	select min(income_class) as min
		,max(income_class) as max
	from inc_class
	),
inc_score as (
	select t0.*
		,(cast((income_class - min) as numeric) / cast((max - min) as numeric)) * 10 as inc_score
	from inc_class t0
	left join inc_minmax t1 on 1=1
	),
*/

--walltype (Higher walltype = less vulnerable >> DO switch scale around) 
wall as (
	select t0.pcode_level3
		,t1.perc_wall_partly_concrete as wall
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
wall_minmax as (
	select min(wall) as min
		,max(wall) as max
	from wall
	),
wall_score as (
	select t0.*
		,(cast((max - wall) as numeric) / cast((max - min) as numeric)) * 10 as wall_score
	from wall t0
	left join wall_minmax t1 on 1=1
	),

--rooftype (Higher rooftype = less vulnerable >> DO switch scale around) 
roof as (
	select t0.pcode_level3
		,t1.perc_roof_concrete_alu_iron as roof
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
roof_minmax as (
	select min(roof) as min
		,max(roof) as max
	from roof
	),
roof_score as (
	select t0.*
		,(cast((max - roof) as numeric) / cast((max - min) as numeric)) * 10 as roof_score
	from roof t0
	left join roof_minmax t1 on 1=1
	),

--Recent shocks (More shocks = more vulnerable DO do NOT switch scale around)
recent_shocks as (
	select t0.pcode_level3
		,t1.recent_shocks
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
recent_shocks_minmax as (
	select min(recent_shocks) as min
		,max(recent_shocks) as max
	from recent_shocks
	),
recent_shocks_score as (
	select t0.*
		,(cast((recent_shocks - min) as numeric) / cast((max - min) as numeric)) * 10 as recent_shocks_score
	from recent_shocks t0
	left join recent_shocks_minmax t1 on 1=1
	),

--HDI (Higher HDI = less vulnerable >> DO switch scale around) 
hdi as (
	select t0.pcode_level3
		,t1.hdi as hdi
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
hdi_minmax as (
	select min(hdi) as min
		,max(hdi) as max
	from hdi
	),
hdi_score as (
	select t0.*
		,(cast((max - hdi) as numeric) / cast((max - min) as numeric)) * 10 as hdi_score
	from hdi t0
	left join hdi_minmax t1 on 1=1
	)

--JOINING ALL
select t0.pcode_level3
	,pov_score,poverty_incidence
	--,inc_score,income_class
	,hdi_score,hdi
	,wall_score,wall
	,roof_score,roof
	,pantawid_score,pantawid_perc
	,recent_shocks_score,recent_shocks
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(1
		* coalesce((10-pov_score)/10*9+1,1) 
		--* coalesce((10-inc_score)/10*9+1,1) 
		* coalesce((10-hdi_score)/10*9+1,1)
		* coalesce((10-wall_score)/10*9+1,1)
		* coalesce((10-roof_score)/10*9+1,1)
		* coalesce((10-pantawid_score)/10*9+1,1)
		* coalesce((10-recent_shocks_score)/10*9+1,1)	
		--PLACEHOLDER
		--* coalesce((10-XXX_score)/10*9+1,1)			
		,cast(1 as float)/cast((0
			+ case when pov_score is null then 0 else 1 end
			--+ case when inc_score is null then 0 else 1 end
			+ case when wall_score is null then 0 else 1 end
			+ case when roof_score is null then 0 else 1 end
			+ case when pantawid_score is null then 0 else 1 end			
			+ case when hdi_score is null then 0 else 1 end 
			+ case when recent_shocks_score is null then 0 else 1 end
			--PLACEHOLDER
			--+ case when XXX_score is null then 0 else 1 end	
		) as float)))/9*10 as vulnerability_score
into "PH_datamodel"."vulnerability_scores"
from "PH_datamodel"."Geo_level3" t0
left join pov_score t2		on t0.pcode_level3 = t2.pcode_level3
--left join inc_score t3		on t0.pcode_level3 = t3.pcode_level3
left join hdi_score t4		on t0.pcode_level3 = t4.pcode_level3
left join wall_score t5		on t0.pcode_level3 = t5.pcode_level3
left join roof_score t6		on t0.pcode_level3 = t6.pcode_level3
left join pantawid_score t7	on t0.pcode_level3 = t7.pcode_level3
left join recent_shocks_score t8	on t0.pcode_level3 = t8.pcode_level3
--PLACEHOLDER: add new variable here
--left join XXX_score t8	on t0.pcode_level3 = t8.pcode_level3
;
--select * from "PH_datamodel"."vulnerability_scores"

------------------
-- 2.2: Hazards --
------------------

drop table if exists "PH_datamodel"."hazard_scores";

with 

--PLACEHOLDER: Add new hazard variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high hazard?)
/*
XXX as (
	select t0.pcode_level3
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
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
	select t0.pcode_level3
		,log(case when flood_phys_exp = 0 then 0.00001 else flood_phys_exp end) as flood_phys_exp
		,log(case when cyclone_phys_exp = 0 then 0.00001 else cyclone_phys_exp end) as cyclone_phys_exp
		,log(case when earthquake7_phys_exp = 0 then 0.00001 else earthquake7_phys_exp end) as earthquake7_phys_exp
		,log(case when tsunami_phys_exp = 0 then 0.00001 else tsunami_phys_exp end) as tsunami_phys_exp
		,log(case when drought_phys_exp = 0 then 0.00001 else drought_phys_exp end) as drought_phys_exp
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
haz_risk_minmax as (
	select min(flood_phys_exp) as min_flood
		,max(flood_phys_exp) as max_flood
		,min(cyclone_phys_exp) as min_cyclone
		,max(cyclone_phys_exp) as max_cyclone
		,min(earthquake7_phys_exp) as min_earthquake
		,max(earthquake7_phys_exp) as max_earthquake
		,min(tsunami_phys_exp) as min_tsunami
		,max(tsunami_phys_exp) as max_tsunami
		,min(drought_phys_exp) as min_drought
		,max(drought_phys_exp) as max_drought
	from haz_risk
	), 
haz_risk_score as (
	select t0.*
		,((flood_phys_exp - min_flood) / (max_flood - min_flood)) * 10 as flood_score
		,((cyclone_phys_exp - min_cyclone) / (max_cyclone - min_cyclone)) * 10 as cyclone_score
		,((earthquake7_phys_exp - min_earthquake) / (max_earthquake - min_earthquake)) * 10 as earthquake_score
		,((tsunami_phys_exp - min_tsunami) / (max_tsunami - min_tsunami)) * 10 as tsunami_score
		,((drought_phys_exp - min_drought) / (max_drought - min_drought)) * 10 as drought_score
	from haz_risk t0
	left join haz_risk_minmax t1 on 1=1
	)

--JOINING ALL
select t1.pcode_level3
	,flood_score,flood_phys_exp
	,cyclone_score,cyclone_phys_exp
	,earthquake_score,earthquake7_phys_exp
	,tsunami_score,tsunami_phys_exp
	,drought_score,drought_phys_exp
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10 - power(coalesce((10-flood_score)/10*9+1,1) 
		* coalesce((10-cyclone_score)/10*9+1,1) 
		* coalesce((10-earthquake_score)/10*9+1,1) 
		* coalesce((10-tsunami_score)/10*9+1,1) 
		* coalesce((10-drought_score)/10*9+1,1)
		--PLACEHOLDER
		--* coalesce((10-XXX_score)/10*9+1,1)
		,cast(1 as float)/cast(5 as float))
		)/cast(9 as float)*cast(10 as float) as hazard_score
into "PH_datamodel"."hazard_scores"
from "PH_datamodel"."Geo_level3" t0
left join haz_risk_score t1	on t0.pcode_level3 = t1.pcode_level3
--PLACEHOLDER: add new variable here
--left join XXX_score t2	on t0.pcode_level3 = t2.pcode_level3
;
--select * from "PH_datamodel"."hazard_scores"


UPDATE "PH_datamodel"."hazard_scores"
set hazard_score = 0
where hazard_score < 0
;



----------------------------------
-- 2.3: Lack of Coping capacity --
----------------------------------

drop table if exists "PH_datamodel"."coping_capacity_scores";

with

--PLACEHOLDER: Add new coping capacity variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high lack of coping capacity? NOTE: 10 means high LACK OF coping capacity, so LOW coping capacity)
/*
XXX as (
	select t0.pcode_level3
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "PH_datamodel"."Geo_level3" 	t0
	left join "PH_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
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
	select t0.pcode_level3
		,sum(log(case when t1.traveltime = 0 then 0.1 else t1.traveltime end) * t1.population) / sum(t1.population) as traveltime
	from "PH_datamodel"."Geo_level4" t0
	left join "PH_datamodel"."Indicators_4_TOTAL" t1 on t0.pcode_level4 = t1.pcode
	group by 1
	),
travel_minmax as (
	select min(traveltime) as min_travel
		,max(traveltime) as max_travel
	from travel
	),
travel_score as (
	select t0.*
		,((traveltime - min_travel) / (max_travel - min_travel)) * 10 as travel_score
	from travel t0
	join travel_minmax t1 on 1=1
	),
--select * from travel_score order by 3

--health density (# of facilities per 10,000 people): more facilities means higher coping capacity, so lower score
hospitals as (
	select t0.pcode_level3
		,log(case when health_density = 0 then 0.1 else health_density end) as health_density
	from "PH_datamodel"."Geo_level3" t0
	left join "PH_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level3 = t1.pcode order by 2
	),
hospitals_minmax as (
	select min(health_density) as min_hospitals
		,max(health_density) as max_hospitals
	from hospitals
	),
hospitals_score as (
	select t0.*
		,(cast((max_hospitals - health_density) as numeric) / cast((max_hospitals - min_hospitals) as numeric)) * 10 as hospitals_score
	from hospitals t0
	join hospitals_minmax t1 on 1=1
	),
--select * from hospitals_score

--higher governance score means higher coping capacity, so lower score
governance as (
	select t0.pcode_level3
		,log(case when good_governance_index = 0 then 0.1 else good_governance_index end) as governance
	from "PH_datamodel"."Geo_level3" t0
	left join "PH_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level3 = t1.pcode
	),
governance_minmax as (
	select min(governance) as min_governance
		,max(governance) as max_governance
	from governance
	),
governance_score as (
	select t0.*
		,((max_governance - governance) / (max_governance - min_governance)) * 10 as governance_score
	from governance t0
	join governance_minmax t1 on 1=1
	)
--select * from governance_score

--JOINING ALL
select t0.pcode_level3
	,travel_score,traveltime
	,hospitals_score,health_density
	,governance_score,governance
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(coalesce((10-travel_score)/10*9+1,1) 
			* coalesce((10-hospitals_score)/10*9+1,1) 
			* coalesce((10-governance_score)/10*9+1,1)
			--PLACEHOLDER
			--* coalesce((10-XXX_score)/10*9+1,1)			
		,cast(1 as float)/cast((nullif(0
		+ case when travel_score is null then 0 else 1 end 
		+ case when hospitals_score is null then 0 else 1 end 
		+ case when governance_score is null then 0 else 1 end
		--PLACEHOLDER
		--+ case when XXX_score is null then 0 else 1 end
		,0)) as float)))/9*10 as coping_capacity_score
into "PH_datamodel"."coping_capacity_scores"
from "PH_datamodel"."Geo_level3" t0
left join travel_score t1	on t0.pcode_level3 = t1.pcode_level3
left join hospitals_score t2	on t0.pcode_level3 = t2.pcode_level3
left join governance_score t3 	on t0.pcode_level3 = t3.pcode_level3
--PLACEHOLDER: add new variable here
--left join XXX_score t4	on t0.pcode_level3 = t4.pcode_level3
;
--select * from "PH_datamodel"."coping_capacity_scores"

----------------
-- 2.4: Total --
----------------

drop table if exists "PH_datamodel"."total_scores_level3";
select t1.pcode_level3
	,vulnerability_score
	,hazard_score
	,coping_capacity_score
	,pov_score,hdi_score,wall_score,roof_score,pantawid_score,recent_shocks_score
	,flood_score,cyclone_score,earthquake_score,tsunami_score,drought_score
	,travel_score,hospitals_score,governance_score
	--PLACEHOLDER
	--XXX_score,XXX
	,(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
		* coalesce((10-hazard_score)/10*9+1,1)
		* coalesce((10-coping_capacity_score)/10*9+1,1)
		, cast(1 as float)/cast(3 as float)))/9*10 as risk_score
into "PH_datamodel"."total_scores_level3"
from "PH_datamodel"."Geo_level3" t0
left join "PH_datamodel"."vulnerability_scores" t1	on t0.pcode_level3 = t1.pcode_level3
left join "PH_datamodel"."hazard_scores" t2		on t0.pcode_level3 = t2.pcode_level3
left join "PH_datamodel"."coping_capacity_scores" t3	on t0.pcode_level3 = t3.pcode_level3
;

drop table if exists "PH_datamodel"."total_scores_level2";
select t1.pcode_parent as pcode_level2
	,sum(risk_score * population) / sum(population) as risk_score
	,sum(hazard_score * population) / sum(population) as hazard_score
	,sum(vulnerability_score * population) / sum(population) as vulnerability_score
	,sum(coping_capacity_score * population) / sum(population) as coping_capacity_score
	,sum(pov_score * population) / sum(population) as pov_score,sum(hdi_score * population) / sum(population) as hdi_score,sum(recent_shocks_score * population) / sum(population) as recent_shocks_score
	,sum(wall_score * population) / sum(population) as wall_score,sum(roof_score * population) / sum(population) as roof_score,sum(pantawid_score * population) / sum(population) as pantawid_score
	,sum(flood_score * population) / sum(population) as flood_score,sum(cyclone_score * population) / sum(population) as cyclone_score,sum(earthquake_score * population) / sum(population) as earthquake_score
	,sum(tsunami_score * population) / sum(population) as tsunami_score,sum(drought_score * population) / sum(population) as drought_score
	,sum(travel_score * population) / sum(population) as travel_score,sum(hospitals_score * population) / sum(population) as hospitals_score,sum(governance_score * population) / sum(population) as governance_score
	--PLACEHOLDER
	--,sum(XXX_score * population)/ sum(population) as XXX_score
into "PH_datamodel"."total_scores_level2"
from "PH_datamodel"."total_scores_level3" t0
join (select pcode, pcode_parent, population from "PH_datamodel"."Indicators_3_TOTAL") t1	on t0.pcode_level3 = t1.pcode
group by t1.pcode_parent
;

--ADD risk scores to Indicators_TOTAL table
drop table if exists "PH_datamodel"."Indicators_2_TOTAL_temp";
select *
into "PH_datamodel"."Indicators_2_TOTAL_temp"
from "PH_datamodel"."Indicators_2_TOTAL" t0
left join "PH_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
drop table "PH_datamodel"."Indicators_2_TOTAL";
select * into "PH_datamodel"."Indicators_2_TOTAL" from "PH_datamodel"."Indicators_2_TOTAL_temp";
drop table "PH_datamodel"."Indicators_2_TOTAL_temp";
--select * from "PH_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "PH_datamodel"."Indicators_3_TOTAL_temp";
select *
into "PH_datamodel"."Indicators_3_TOTAL_temp"
from "PH_datamodel"."Indicators_3_TOTAL" t0
left join "PH_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
drop table "PH_datamodel"."Indicators_3_TOTAL";
select * into "PH_datamodel"."Indicators_3_TOTAL" from "PH_datamodel"."Indicators_3_TOTAL_temp";
drop table "PH_datamodel"."Indicators_3_TOTAL_temp";
--select * from "PH_datamodel"."Indicators_3_TOTAL" 



