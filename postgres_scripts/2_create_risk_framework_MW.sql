
------------------------------
-- 2: Create risk-framework --
------------------------------

--Now calculated at district-level
--TO DO: build structure where each component is rated on its lowest level, and the aggregate score is built up dynamically

------------------------
-- 2.1: Vulnerability --
------------------------

drop table if exists "MW_datamodel"."vulnerability_scores";

with 
--PLACEHOLDER: Add new vulnerability variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high vulnerability?)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
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
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
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

--Life expectancy (Higher = less vulnerable >> DO switch scale around)
,life_exp as (
	select t0.pcode_level2
		,t1.life_expectancy as life_exp
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
life_exp_minmax as (
	select min(life_exp) as min
		,max(life_exp) as max
	from life_exp
	),
life_exp_score as (
	select t0.*
		,((max - life_exp) / ( max - min)) * 10 as life_exp_score
	from life_exp t0
	left join life_exp_minmax t1 on 1=1
	)

--Infant mortality (Higher = more vulnerable >> DO NOT switch scale around)
,infant_mort as (
	select t0.pcode_level2
		,t1.infant_mortality as infant_mort
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
infant_mort_minmax as (
	select min(infant_mort) as min
		,max(infant_mort) as max
	from infant_mort
	),
infant_mort_score as (
	select t0.*
		,((infant_mort - min) / ( max - min)) * 10 as infant_mort_score
	from infant_mort t0
	left join infant_mort_minmax t1 on 1=1
	)

--(Semi)permanent construction materials (Higher = less vulnerable >> DO switch scale around)
,construction as (
	select t0.pcode_level2
		,t1.construction_semipermanent as construction
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
construction_minmax as (
	select min(construction) as min
		,max(construction) as max
	from construction
	),
construction_score as (
	select t0.*
		,((max - construction) / ( max - min)) * 10 as construction_score
	from construction t0
	left join construction_minmax t1 on 1=1
	)

--Food consumption score (Higher = less vulnerable >> DO switch scale around)
,fcs as (
	select t0.pcode_level2
		,t1.fcs as fcs
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
fcs_minmax as (
	select min(fcs) as min
		,max(fcs) as max
	from fcs
	),
fcs_score as (
	select t0.*
		,((max - fcs) / ( max - min)) * 10 as fcs_score
	from fcs t0
	left join fcs_minmax t1 on 1=1
	)

--JOINING ALL
select t0.pcode_level2
	,poverty_score,poverty
	,life_exp_score,life_exp
	,infant_mort_score,infant_mort
	,construction_score,construction
	,fcs_score,fcs
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(coalesce((10-poverty_score)/10*9+1,1) 
			* coalesce((10-life_exp_score)/10*9+1,1) 
			* coalesce((10-infant_mort_score)/10*9+1,1)
			* coalesce((10-construction_score)/10*9+1,1)
			* coalesce((10-fcs_score)/10*9+1,1)
			--PLACEHOLDER
			--* coalesce((10-XXX_score)/10*9+1,1)
			,cast(1 as float)/cast((
				case when poverty_score is null then 0 else 1 end +
				case when life_exp_score is null then 0 else 1 end +
				case when infant_mort_score is null then 0 else 1 end +
				case when construction_score is null then 0 else 1 end +
				--PLACEHOLDER
				--case when XXX_score is null then 0 else 1 end +
				case when fcs_score is null then 0 else 1 end)
		as float)))/9*10 as vulnerability_score
into "MW_datamodel"."vulnerability_scores"
from "MW_datamodel"."Geo_level2" t0
left join poverty_score t2		on t0.pcode_level2 = t2.pcode_level2
left join life_exp_score t3		on t0.pcode_level2 = t3.pcode_level2
left join infant_mort_score t4		on t0.pcode_level2 = t4.pcode_level2
left join construction_score t5		on t0.pcode_level2 = t5.pcode_level2
left join fcs_score t6			on t0.pcode_level2 = t6.pcode_level2
--PLACEHOLDER: add new variable here
--left join XXX_score t7		on t0.pcode_level3 = t7.pcode_level3
;

------------------
-- 2.2: Hazards --
------------------

drop table if exists "MW_datamodel"."hazard_scores";

with 
--PLACEHOLDER: Add new hazard variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high hazard?)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
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
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
haz_risk_minmax as (
	select min(flood_phys_exp) as min_flood
		,max(flood_phys_exp) as max_flood
--		,min(cyclone_phys_exp) as min_cyclone
--		,max(cyclone_phys_exp) as max_cyclone
		,min(earthquake7_phys_exp) as min_earthquake
		,max(earthquake7_phys_exp) as max_earthquake
--		,min(tsunami_phys_exp) as min_tsunami
--		,max(tsunami_phys_exp) as max_tsunami
		,min(drought_phys_exp) as min_drought
		,max(drought_phys_exp) as max_drought
	from haz_risk
	), 
haz_risk_score as (
	select t0.*
		,case when max_flood = min_flood then null else ((flood_phys_exp - min_flood) / (max_flood - min_flood)) * 10 end as flood_score
--		,case when max_cyclone = min_cyclone then null else ((cyclone_phys_exp - min_cyclone) / (max_cyclone - min_cyclone)) * 10 end as cyclone_score
		,case when max_earthquake = min_earthquake then null else ((earthquake7_phys_exp - min_earthquake) / (max_earthquake - min_earthquake)) * 10 end as earthquake_score
--		,case when max_tsunami = min_tsunami then null else ((tsunami_phys_exp - min_tsunami) / (max_tsunami - min_tsunami)) * 10 end as tsunami_score
		,case when max_drought = min_drought then null else ((drought_phys_exp - min_drought) / (max_drought - min_drought)) * 10 end as drought_score
	from haz_risk t0
	left join haz_risk_minmax t1 on 1=1
	)
--select * from haz_pe_score

--JOINING ALL
select t1.pcode_level2
	,flood_score,flood_phys_exp
--	,cyclone_score,cyclone_phys_exp (0 for Malawi)
	,earthquake_score,earthquake7_phys_exp
--	,tsunami_score,tsunami_phys_exp (o for Malawi)
	,drought_score,drought_phys_exp
	--PLACEHOLDER
	--,XXX_scorre,XXX
	,(10 - power(coalesce((10-flood_score)/10*9+1,1) 
--		* coalesce((10-cyclone_score)/10*9+1,1) 
		* coalesce((10-earthquake_score)/10*9+1,1)
--		* coalesce((10-tsunami_score)/10*9+1,1) 
		* coalesce((10-drought_score)/10*9+1,1)
		--PLACEHOLDER
		--* coalesce((10-XXX_score)/10*9+1,1)
		,cast(1 as float)/cast(3 as float))
		)/cast(9 as float)*cast(10 as float) as hazard_score
into "MW_datamodel"."hazard_scores"
from "MW_datamodel"."Geo_level2" t0
left join haz_risk_score t1	on t0.pcode_level2 = t1.pcode_level2
--PLACEHOLDER
--left join XXX_score t2	on t0.pcode_level2 = t2.pcode_level2
;




----------------------------------
-- 2.3: Lack of Coping capacity --
----------------------------------

drop table if exists "MW_datamodel"."coping_capacity_scores";

with
--PLACEHOLDER: Add new coping capacity variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high lack of coping capacity? NOTE: 10 means high LACK OF coping capacity, so LOW coping capacity)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
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

electricity as (
	select t0.pcode_level2
		,t1.electricity 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "MW_datamodel"."Geo_level2" 	t0
	left join "MW_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
	), 
electricity_minmax as (
	select min(electricity) as min
		,max(electricity) as max
	from electricity
	),
electricity_score as (
	select t0.*
		,((max - electricity) / (max - min)) * 10 as electricity_score		--POSSIBLE SCALE INVERSION HERE: ,((max - XXX) / (max - min)) * 10 as XXX_score
	from electricity t0
	left join electricity_minmax t1 on 1=1
	)	
--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
,travel as (
	select t0.pcode_level2
		,sum(log(case when t1.traveltime = 0 then 0.1 else t1.traveltime end) * t1.population) / sum(t1.population) as travel
	from "MW_datamodel"."Geo_level2" t0
	left join "MW_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level2 = t1.pcode_parent
	group by 1
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

--health density (# of facilities per 10,000 people): more facilities means higher coping capacity, so lower score
,hospitals as (
	select t0.pcode_level2
		,sum(log(case when health_density = 0 then 0.1 else health_density end) * t1.population) / sum(t1.population) as hospitals
	from "MW_datamodel"."Geo_level2" t0
	left join "MW_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level2 = t1.pcode_parent
	group by 1
	),
hospitals_minmax as (
	select min(hospitals) as min
		,max(hospitals) as max
	from hospitals
	),
hospitals_score as (
	select t0.*
		,(cast((max - hospitals) as numeric) / cast((max - min) as numeric)) * 10 as hospitals_score
	from hospitals t0
	join hospitals_minmax t1 on 1=1
	)

--Mobile access: higher access means higher coping capacity, so lower score
,mobile as (
	select t0.pcode_level2
		,mobile_access as mobile
	from "MW_datamodel"."Geo_level2" t0
	left join "MW_datamodel"."Indicators_2_TOTAL" t1 on t0.pcode_level2 = t1.pcode
	),
mobile_minmax as (
	select min(mobile) as min
		,max(mobile) as max
	from mobile
	),
mobile_score as (
	select t0.*
		,(cast((max - mobile) as numeric) / cast((max - min) as numeric)) * 10 as mobile_score
	from mobile t0
	join mobile_minmax t1 on 1=1
	)

--Improved sanitation: means higher coping capacity, so lower score
,sanitation as (
	select t0.pcode_level2
		,improved_sanitation as sanitation
	from "MW_datamodel"."Geo_level2" t0
	left join "MW_datamodel"."Indicators_2_TOTAL" t1 on t0.pcode_level2 = t1.pcode
	),
sanitation_minmax as (
	select min(sanitation) as min
		,max(sanitation) as max
	from sanitation
	),
sanitation_score as (
	select t0.*
		,(cast((max - sanitation) as numeric) / cast((max - min) as numeric)) * 10 as sanitation_score
	from sanitation t0
	join sanitation_minmax t1 on 1=1
	)

--Piped water: means higher coping capacity, so lower score
,pipewater as (
	select t0.pcode_level2
		,watersource_piped as pipewater
	from "MW_datamodel"."Geo_level2" t0
	left join "MW_datamodel"."Indicators_2_TOTAL" t1 on t0.pcode_level2 = t1.pcode
	),
pipewater_minmax as (
	select min(pipewater) as min
		,max(pipewater) as max
	from pipewater
	),
pipewater_score as (
	select t0.*
		,(cast((max - pipewater) as numeric) / cast((max - min) as numeric)) * 10 as pipewater_score
	from pipewater t0
	join pipewater_minmax t1 on 1=1
	)

--JOINING ALL
select t1.pcode_level2
	,travel_score,travel
	,hospitals_score,hospitals
	,mobile_score,mobile
	,sanitation_score,sanitation
	,pipewater_score,pipewater
	,electricity_score,electricity
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(1
			* coalesce((10-travel_score)/10*9+1,1)
			 * coalesce((10-hospitals_score)/10*9+1,1)
			 * coalesce((10-mobile_score)/10*9+1,1)
			 * coalesce((10-sanitation_score)/10*9+1,1)
			 * coalesce((10-pipewater_score)/10*9+1,1)
			 * coalesce((10-electricity_score)/10*9+1,1)
			 --PLACEHOLDER
			 --* coalesce((10-XXX_score)/10*9+1,1)
			,cast(1 as float)/cast((0
		+ case when travel_score is null then 0 else 1 end
		+ case when hospitals_score is null then 0 else 1 end
		+ case when mobile_score is null then 0 else 1 end
		+ case when sanitation_score is null then 0 else 1 end
		+ case when pipewater_score is null then 0 else 1 end
		+ case when electricity_score is null then 0 else 1 end
		--PLACEHOLDER
		--+ case when XXX_score is null then 0 else 1 end 
		) as float)))/9*10 as coping_capacity_score
into "MW_datamodel"."coping_capacity_scores"
from "MW_datamodel"."Geo_level2" t0
left join travel_score t1	on t0.pcode_level2 = t1.pcode_level2
left join hospitals_score t2	on t0.pcode_level2 = t2.pcode_level2
left join mobile_score t3 	on t0.pcode_level2 = t3.pcode_level2
left join sanitation_score t4 	on t0.pcode_level2 = t4.pcode_level2
left join pipewater_score t5 	on t0.pcode_level2 = t5.pcode_level2
left join electricity_score t6 	on t0.pcode_level2 = t6.pcode_level2
--PLACEHOLDER
--left join XXX_score t6 		on t0.pcode_level2 = t6.pcode_level2
;


----------------
-- 2.4: Total --
----------------


drop table if exists "MW_datamodel"."total_scores_level2";
select t1.pcode_level2
	,vulnerability_score
	,hazard_score
	,coping_capacity_score
	,poverty_score,life_exp_score,infant_mort_score,construction_score,fcs_score
	,flood_score,earthquake_score,drought_score
	,travel_score,hospitals_score,mobile_score,sanitation_score,pipewater_score,electricity_score
	--PLACEHOLDER
	--,XXX_score
	,(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
		* coalesce((10-hazard_score)/10*9+1,1)
		* coalesce((10-coping_capacity_score)/10*9+1,1)
		, cast(1 as float)/cast(3 as float)))/9*10 as risk_score
into "MW_datamodel"."total_scores_level2"
from "MW_datamodel"."Geo_level2" t0
left join "MW_datamodel"."vulnerability_scores" t1	on t0.pcode_level2 = t1.pcode_level2
left join "MW_datamodel"."hazard_scores" t2		on t0.pcode_level2 = t2.pcode_level2
left join "MW_datamodel"."coping_capacity_scores" t3	on t0.pcode_level2 = t3.pcode_level2
--order by 7
;

--ADD risk scores to Indicators_TOTAL table
drop table if exists "MW_datamodel"."Indicators_2_TOTAL_temp";
select *
into "MW_datamodel"."Indicators_2_TOTAL_temp"
from "MW_datamodel"."Indicators_2_TOTAL" t0
left join "MW_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
drop table "MW_datamodel"."Indicators_2_TOTAL";
select * into "MW_datamodel"."Indicators_2_TOTAL" from "MW_datamodel"."Indicators_2_TOTAL_temp";
drop table "MW_datamodel"."Indicators_2_TOTAL_temp";
--select * from "MW_datamodel"."Indicators_2_TOTAL" 




------------------
-- LEVEL 3 --
------------------


drop table if exists "MW_datamodel"."vulnerability_scores_level3";

with 
--Poverty (Higher poverty = more vulnerable >> DO NOT switch scale around)
poverty as (
	select t0.pcode_level3
		,t1.poverty_incidence as poverty
	from "MW_datamodel"."Geo_level3" 	t0
	left join "MW_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
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
--select * from poverty_score
--JOINING ALL
select t0.pcode_level3
	,poverty_score,poverty
	,case when poverty_score is null then null else
		(10-power(coalesce((10-poverty_score)/10*9+1,1) 
			,cast(1 as float)/cast((0
				+ case when poverty_score is null then 0 else 1 end
			) as float)))/9*10 
	end as vulnerability_score
into "MW_datamodel"."vulnerability_scores_level3"
from "MW_datamodel"."Geo_level3" t0
left join poverty_score t2		on t0.pcode_level3 = t2.pcode_level3
;
--select * from "MW_datamodel"."vulnerability_scores_level3"

drop table if exists "MW_datamodel"."hazard_scores_level3";
with 
haz_risk as (
	select t0.pcode_level3
		,log(case when flood_phys_exp = 0 then 0.00001 else flood_phys_exp end) as flood_phys_exp
		,log(case when earthquake7_phys_exp = 0 then 0.00001 else earthquake7_phys_exp end) as earthquake7_phys_exp
		,log(case when drought_phys_exp = 0 then 0.00001 else drought_phys_exp end) as drought_phys_exp
	from "MW_datamodel"."Geo_level3" 	t0
	left join "MW_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	)
, 
haz_risk_minmax as (
	select min(flood_phys_exp) as min_flood
		,max(flood_phys_exp) as max_flood
		,min(earthquake7_phys_exp) as min_earthquake
		,max(earthquake7_phys_exp) as max_earthquake
		,min(drought_phys_exp) as min_drought
		,max(drought_phys_exp) as max_drought
	from haz_risk
	)
,--select * from haz_risk_minmax
haz_risk_score as (
	select t0.*
		,case when max_flood = min_flood then null else ((flood_phys_exp - min_flood) / (max_flood - min_flood)) * 10 end as flood_score
		,case when max_earthquake = min_earthquake then null else ((earthquake7_phys_exp - min_earthquake) / (max_earthquake - min_earthquake)) * 10 end as earthquake_score
		,case when max_drought = min_drought then null else ((drought_phys_exp - min_drought) / (max_drought - min_drought)) * 10 end as drought_score
	from haz_risk t0
	left join haz_risk_minmax t1 on 1=1
	)
--select * from haz_risk_score

--JOINING ALL
select t1.pcode_level3
	,flood_score,flood_phys_exp
	,earthquake_score,earthquake7_phys_exp
	,drought_score,drought_phys_exp
	,(10 - power(coalesce((10-flood_score)/10*9+1,1) 
		* coalesce((10-earthquake_score)/10*9+1,1)
		* coalesce((10-drought_score)/10*9+1,1)
		,cast(1 as float)/cast(3 as float))
		)/cast(9 as float)*cast(10 as float) as hazard_score
into "MW_datamodel"."hazard_scores_level3"
from "MW_datamodel"."Geo_level3" t0
left join haz_risk_score t1	on t0.pcode_level3 = t1.pcode_level3
;
--select * from "MW_datamodel"."hazard_scores_level3"


drop table if exists "MW_datamodel"."coping_scores_level3";

with
electricity as (
	select t0.pcode_level3
		,t1.electricity 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "MW_datamodel"."Geo_level3" 	t0
	left join "MW_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
electricity_minmax as (
	select min(electricity) as min
		,max(electricity) as max
	from electricity
	),
electricity_score as (
	select t0.*
		,((max - electricity) / (max - min)) * 10 as electricity_score		--POSSIBLE SCALE INVERSION HERE: ,((max - XXX) / (max - min)) * 10 as XXX_score
	from electricity t0
	left join electricity_minmax t1 on 1=1
	),
--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
travel as (
	select t0.pcode_level3
		,log(1 + t1.traveltime) as travel
	from "MW_datamodel"."Geo_level3" t0
	left join "MW_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level3 = t1.pcode
	)
,--select * from travel
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

--health density (# of facilities per 10,000 people): more facilities means higher coping capacity, so lower score
,hospitals as (
	select t0.pcode_level3
		,log(case when health_density = 0 then 0.1 else health_density end) as hospitals
	from "MW_datamodel"."Geo_level3" t0
	left join "MW_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level3 = t1.pcode
	),
hospitals_minmax as (
	select min(hospitals) as min
		,max(hospitals) as max
	from hospitals
	),
hospitals_score as (
	select t0.*
		,(cast((max - hospitals) as numeric) / cast((max - min) as numeric)) * 10 as hospitals_score
	from hospitals t0
	join hospitals_minmax t1 on 1=1
	)

--JOINING ALL
select t1.pcode_level3
	,travel_score,travel
	,hospitals_score,hospitals
	,electricity_score,electricity
	,(10-power(1
		* coalesce((10-travel_score)/10*9+1,1)
		* coalesce((10-hospitals_score)/10*9+1,1)
		* coalesce((10-electricity_score)/10*9+1,1)
			,cast(1 as float)/cast(0
		+ case when travel_score is null then 0 else 1 end
		+ case when hospitals_score is null then 0 else 1 end
		+ case when electricity_score is null then 0 else 1 end as float)))/9*10 as coping_capacity_score
into "MW_datamodel"."coping_scores_level3"
from "MW_datamodel"."Geo_level3" t0
left join travel_score t1	on t0.pcode_level3 = t1.pcode_level3
left join hospitals_score t2	on t0.pcode_level3 = t2.pcode_level3
left join electricity_score t6 	on t0.pcode_level3 = t6.pcode_level3
;
--select * from "MW_datamodel"."coping_scores_level3"

drop table if exists "MW_datamodel"."total_scores_level3";
select t1.pcode_level3
	,vulnerability_score
	,hazard_score
	,coping_capacity_score
	,poverty_score
	,flood_score,earthquake_score,drought_score
	,travel_score,hospitals_score,electricity_score
	,(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
		* coalesce((10-hazard_score)/10*9+1,1)
		* coalesce((10-coping_capacity_score)/10*9+1,1)
		, cast(1 as float)/cast(3 as float)))/9*10 as risk_score
into "MW_datamodel"."total_scores_level3"
from "MW_datamodel"."Geo_level3" t0
left join "MW_datamodel"."vulnerability_scores_level3" t1	on t0.pcode_level3 = t1.pcode_level3
left join "MW_datamodel"."hazard_scores_level3" t2		on t0.pcode_level3 = t2.pcode_level3
left join "MW_datamodel"."coping_scores_level3" t3	on t0.pcode_level3 = t3.pcode_level3
--order by 7
;
--select * from "MW_datamodel"."total_scores_level3"

--ADD risk scores to Indicators_TOTAL table
drop table if exists "MW_datamodel"."Indicators_3_TOTAL_temp";
select *
into "MW_datamodel"."Indicators_3_TOTAL_temp"
from "MW_datamodel"."Indicators_3_TOTAL" t0
left join "MW_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
drop table "MW_datamodel"."Indicators_3_TOTAL";
select * into "MW_datamodel"."Indicators_3_TOTAL" from "MW_datamodel"."Indicators_3_TOTAL_temp";
drop table "MW_datamodel"."Indicators_3_TOTAL_temp";
--select * from "MW_datamodel"."Indicators_3_TOTAL" 


------------------
-- LEVEL 4 --
------------------


drop table if exists "MW_datamodel"."vulnerability_scores_level4";

with 
--Poverty (Higher poverty = more vulnerable >> DO NOT switch scale around)
poverty as (
	select t0.pcode_level4
		,t1.poverty_incidence as poverty
	from "MW_datamodel"."Geo_level4" 	t0
	left join "MW_datamodel"."Indicators_4_TOTAL"	t1 on t0.pcode_level4 = t1.pcode
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
--select * from poverty_score
--JOINING ALL
select t0.pcode_level4
	,poverty_score,poverty
	,case when poverty_score is null then null else
		(10-power(coalesce((10-poverty_score)/10*9+1,1) 
			,cast(1 as float)/cast((0
				+ case when poverty_score is null then 0 else 1 end
			) as float)))/9*10 
	end as vulnerability_score
into "MW_datamodel"."vulnerability_scores_level4"
from "MW_datamodel"."Geo_level4" t0
left join poverty_score t2		on t0.pcode_level4 = t2.pcode_level4
;
--select * from "MW_datamodel"."vulnerability_scores_level4"

drop table if exists "MW_datamodel"."hazard_scores_level4";
with 
haz_risk as (
	select t0.pcode_level4
		,flood_risk --log(1 + flood_phys_exp) as flood_phys_exp
		,drought_risk --log(1 + drought_phys_exp) as drought_phys_exp
	from "MW_datamodel"."Geo_level4" 	t0
	left join "MW_datamodel"."Indicators_4_TOTAL"	t1 on t0.pcode_level4 = t1.pcode
	)
, 
haz_risk_minmax as (
	select min(flood_risk) as min_flood
		,max(flood_risk) as max_flood
		,min(drought_risk) as min_drought
		,max(drought_risk) as max_drought
	from haz_risk
	)
,--select * from haz_risk_minmax
haz_risk_score as (
	select t0.*
		,case when max_flood = min_flood then null else ((flood_risk - min_flood) / (max_flood - min_flood)) * 10 end as flood_score
		,case when max_drought = min_drought then null else ((drought_risk - min_drought) / (max_drought - min_drought)) * 10 end as drought_score
	from haz_risk t0
	left join haz_risk_minmax t1 on 1=1
	)
--select * from haz_risk_score

--JOINING ALL
select t1.pcode_level4
	,flood_score,flood_risk
	,drought_score,drought_risk
	,case when drought_score is null and flood_score is null then null else
	(10 - power(coalesce((10-flood_score)/10*9+1,1) 
		* coalesce((10-drought_score)/10*9+1,1)
		,cast(1 as float)/cast(3 as float))
		)/cast(9 as float)*cast(10 as float) 
		end as hazard_score
into "MW_datamodel"."hazard_scores_level4"
from "MW_datamodel"."Geo_level4" t0
left join haz_risk_score t1	on t0.pcode_level4 = t1.pcode_level4
;
--select * from "MW_datamodel"."hazard_scores_level4"


drop table if exists "MW_datamodel"."coping_scores_level4";

with
--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
travel_hospital as (
	select t0.pcode_level4
		,log(1 + t1.traveltime_hospital) as travel_hospital
	from "MW_datamodel"."Geo_level4" t0
	left join "MW_datamodel"."Indicators_4_TOTAL" t1 on t0.pcode_level4 = t1.pcode
	)
,--select * from travel
travel_hospital_minmax as (
	select min(travel_hospital) as min
		,max(travel_hospital) as max
	from travel_hospital
	),
travel_hospital_score as (
	select t0.*
		,((travel_hospital - min) / (max - min)) * 10 as travel_hospital_score
	from travel_hospital t0
	join travel_hospital_minmax t1 on 1=1
	)
,
--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
travel_sec_school as (
	select t0.pcode_level4
		,log(1 + t1.traveltime_sec_school) as travel_sec_school
	from "MW_datamodel"."Geo_level4" t0
	left join "MW_datamodel"."Indicators_4_TOTAL" t1 on t0.pcode_level4 = t1.pcode
	)
,--select * from travel
travel_sec_school_minmax as (
	select min(travel_sec_school) as min
		,max(travel_sec_school) as max
	from travel_sec_school
	),
travel_sec_school_score as (
	select t0.*
		,((travel_sec_school - min) / (max - min)) * 10 as travel_sec_school_score
	from travel_sec_school t0
	join travel_sec_school_minmax t1 on 1=1
	)
,
--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
travel_tradingcentre as (
	select t0.pcode_level4
		,log(1 + t1.traveltime_tradingcentre) as travel_tradingcentre
	from "MW_datamodel"."Geo_level4" t0
	left join "MW_datamodel"."Indicators_4_TOTAL" t1 on t0.pcode_level4 = t1.pcode
	)
,--select * from travel
travel_tradingcentre_minmax as (
	select min(travel_tradingcentre) as min
		,max(travel_tradingcentre) as max
	from travel_tradingcentre
	),
travel_tradingcentre_score as (
	select t0.*
		,((travel_tradingcentre - min) / (max - min)) * 10 as travel_tradingcentre_score
	from travel_tradingcentre t0
	join travel_tradingcentre_minmax t1 on 1=1
	)
	
--JOINING ALL
select t1.pcode_level4
	,travel_hospital_score,travel_hospital
	,travel_sec_school_score,travel_sec_school
	,travel_tradingcentre_score,travel_tradingcentre
	,case when travel_hospital_score is null and travel_sec_school_score is null and travel_tradingcentre_score is null then null else 
	(10-power(1
		* coalesce((10-travel_hospital_score)/10*9+1,1)
		* coalesce((10-travel_sec_school_score)/10*9+1,1)
		* coalesce((10-travel_tradingcentre_score)/10*9+1,1)
			,cast(1 as float)/cast(0
		+ case when travel_hospital_score is null then 0 else 1 end
		+ case when travel_sec_school_score is null then 0 else 1 end
		+ case when travel_tradingcentre_score is null then 0 else 1 end
		as float)))/9*10 
		end as coping_capacity_score
into "MW_datamodel"."coping_scores_level4"
from "MW_datamodel"."Geo_level4" t0
left join travel_hospital_score t1	on t0.pcode_level4 = t1.pcode_level4
left join travel_sec_school_score t2	on t0.pcode_level4 = t2.pcode_level4
left join travel_tradingcentre_score t3	on t0.pcode_level4 = t3.pcode_level4
;
--select * from "MW_datamodel"."coping_scores_level4"

drop table if exists "MW_datamodel"."total_scores_level4";
select t1.pcode_level4
	,vulnerability_score
	,hazard_score
	,coping_capacity_score
	,poverty_score
	,flood_score,drought_score
	,travel_hospital_score,travel_sec_school_score,travel_tradingcentre_score
	,(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
		* coalesce((10-hazard_score)/10*9+1,1)
		* coalesce((10-coping_capacity_score)/10*9+1,1)
		, cast(1 as float)/cast(0
		+ case when vulnerability_score is null then 0 else 1 end
		+ case when hazard_score is null then 0 else 1 end
		+ case when coping_capacity_score is null then 0 else 1 end
		as float)))/9*10 as risk_score
into "MW_datamodel"."total_scores_level4"
from "MW_datamodel"."Geo_level4" t0
left join "MW_datamodel"."vulnerability_scores_level4" t1	on t0.pcode_level4 = t1.pcode_level4
left join "MW_datamodel"."hazard_scores_level4" t2		on t0.pcode_level4 = t2.pcode_level4
left join "MW_datamodel"."coping_scores_level4" t3		on t0.pcode_level4 = t3.pcode_level4
--order by 7
;
--select * from "MW_datamodel"."total_scores_level4"

--ADD risk scores to Indicators_TOTAL table
drop table if exists "MW_datamodel"."Indicators_4_TOTAL_temp";
select *
into "MW_datamodel"."Indicators_4_TOTAL_temp"
from "MW_datamodel"."Indicators_4_TOTAL" t0
left join "MW_datamodel"."total_scores_level4" t1
on t0.pcode = t1.pcode_level4
;
drop table "MW_datamodel"."Indicators_4_TOTAL";
select * into "MW_datamodel"."Indicators_4_TOTAL" from "MW_datamodel"."Indicators_4_TOTAL_temp";
drop table "MW_datamodel"."Indicators_4_TOTAL_temp";
--select * from "MW_datamodel"."Indicators_4_TOTAL" 














