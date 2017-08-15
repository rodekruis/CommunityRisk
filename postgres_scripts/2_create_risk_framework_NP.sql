
------------------------------
-- 2: Create risk-framework --
------------------------------


--TEMP: copy the table structure, so that it exists (errors otherwise)
/*
drop table if exists "NP_datamodel"."total_scores_level2";
select *
into "NP_datamodel"."total_scores_level2"
from "MW_datamodel"."total_scores_level2"
limit 0;
*/

drop table if exists "NP_datamodel"."vulnerability_scores";

with 
--PLACEHOLDER: Add new vulnerability variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high vulnerability?)
/*
XXX as (
	select t0.pcode_level3
		,t1.XXX
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
XXX_minmax as (
	select min(XXX) as min
		,max(XXX) as max
	from XXX
	),
XXX_score as (
	select t0.*
		,((XXX - min) / ( max - min)) * 10 as XXX_score
	from XXX t0
	left join XXX_minmax t1 on 1=1
	)
*/	
--Early Death (Higher earlydeath = more vulnerable >> DO NOT switch scale around)
earlydeath as (
	select t0.pcode_level3
		,t1.earlydeath
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
earlydeath_minmax as (
	select min(earlydeath) as min
		,max(earlydeath) as max
	from earlydeath
	),
earlydeath_score as (
	select t0.*
		,((earlydeath - min) / ( max - min)) * 10 as earlydeath_score
	from earlydeath t0
	left join earlydeath_minmax t1 on 1=1
	)
,
--Illiteracy (Higher illiteracy = more vulnerable >> DO NOT switch scale around)
illiteracy as (
	select t0.pcode_level3
		,t1.illiteracy
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
illiteracy_minmax as (
	select min(illiteracy) as min
		,max(illiteracy) as max
	from illiteracy
	),
illiteracy_score as (
	select t0.*
		,((illiteracy - min) / ( max - min)) * 10 as illiteracy_score
	from illiteracy t0
	left join illiteracy_minmax t1 on 1=1
	)
,
--No safe water (Higher nosafewater = more vulnerable >> DO NOT switch scale around)
nosafewater as (
	select t0.pcode_level3
		,t1.nosafewater
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
nosafewater_minmax as (
	select min(nosafewater) as min
		,max(nosafewater) as max
	from nosafewater
	),
nosafewater_score as (
	select t0.*
		,((nosafewater - min) / ( max - min)) * 10 as nosafewater_score
	from nosafewater t0
	left join nosafewater_minmax t1 on 1=1
	)
,
--Malnourished (Higher malnourished = more vulnerable >> DO NOT switch scale around)
malnourished as (
	select t0.pcode_level3
		,t1.malnourished
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
malnourished_minmax as (
	select min(malnourished) as min
		,max(malnourished) as max
	from malnourished
	),
malnourished_score as (
	select t0.*
		,((malnourished - min) / ( max - min)) * 10 as malnourished_score
	from malnourished t0
	left join malnourished_minmax t1 on 1=1
	)
,
--Provisioning (Higher provisioning = more vulnerable >> DO NOT switch scale around)
provisioning as (
	select t0.pcode_level3
		,t1.provisioning
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
provisioning_minmax as (
	select min(provisioning) as min
		,max(provisioning) as max
	from provisioning
	),
provisioning_score as (
	select t0.*
		,((provisioning - min) / ( max - min)) * 10 as provisioning_score
	from provisioning t0
	left join provisioning_minmax t1 on 1=1
	)
,
--Human Poverty Index (Higher hpi = more vulnerable >> DO NOT switch scale around)
hpi as (
	select t0.pcode_level3
		,t1.hpi
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
hpi_minmax as (
	select min(hpi) as min
		,max(hpi) as max
	from hpi
	),
hpi_score as (
	select t0.*
		,((hpi - min) / ( max - min)) * 10 as hpi_score
	from hpi t0
	left join hpi_minmax t1 on 1=1
	)

,
--Human Development Index (Higher hdi = less vulnerable >> DO switch scale around)
hdi as (
	select t0.pcode_level3
		,t1.hdi
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
	), 
hdi_minmax as (
	select min(hdi) as min
		,max(hdi) as max
	from hdi
	),
hdi_score as (
	select t0.*
		,((max - hdi) / ( max - min)) * 10 as hdi_score
	from hdi t0
	left join hdi_minmax t1 on 1=1
	)


--JOINING ALL
select t0.pcode_level3
	,earlydeath_score,earlydeath
	,illiteracy_score,illiteracy
	,nosafewater_score,nosafewater
	,malnourished_score,malnourished
	,provisioning_score,provisioning
	,hpi_score,hpi
	,hdi_score,hdi
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(coalesce((10-earlydeath_score)/10*9+1,1) 
			* coalesce((10-illiteracy_score)/10*9+1,1) 
			* coalesce((10-nosafewater_score)/10*9+1,1)
			* coalesce((10-malnourished_score)/10*9+1,1)
			* coalesce((10-provisioning_score)/10*9+1,1)
			* coalesce((10-hpi_score)/10*9+1,1)
			* coalesce((10-hdi_score)/10*9+1,1)
			--PLACEHOLDER
			--* coalesce((10-XXX_score)/10*9+1,1)
			,cast(1 as float)/cast((
				case when earlydeath_score is null then 0 else 1 end +
				case when illiteracy_score is null then 0 else 1 end +
				case when nosafewater_score is null then 0 else 1 end +
				case when malnourished_score is null then 0 else 1 end +
				case when hpi_score is null then 0 else 1 end +
				case when hdi_score is null then 0 else 1 end +
				--PLACEHOLDER
				--case when XXX_score is null then 0 else 1 end +
				case when provisioning_score is null then 0 else 1 end)
		as float)))/9*10 as vulnerability_score
into "NP_datamodel"."vulnerability_scores"
from "NP_datamodel"."Geo_level3" t0
left join earlydeath_score t2		on t0.pcode_level3 = t2.pcode_level3
left join illiteracy_score t3		on t0.pcode_level3 = t3.pcode_level3
left join nosafewater_score t4		on t0.pcode_level3 = t4.pcode_level3
left join malnourished_score t5		on t0.pcode_level3 = t5.pcode_level3
left join provisioning_score t6		on t0.pcode_level3 = t6.pcode_level3
left join hpi_score t7			on t0.pcode_level3 = t7.pcode_level3
left join hdi_score t8			on t0.pcode_level3 = t8.pcode_level3
--PLACEHOLDER: add new variable here
--left join XXX_score t7		on t0.pcode_level3 = t7.pcode_level3
;


------------------
-- 2.2: Hazards --
------------------

drop table if exists "NP_datamodel"."hazard_scores";

with 
--PLACEHOLDER: Add new hazard variable to risk framework
--1. select the right variable, name XXX (short name) and replace all XXX's by this short name (e.g. poverty).
--2. decide whether a log-transformation is necessary
--3. decide if the scale needs to be inverted (does high value vor this variable mean low or high hazard?)
/*
XXX as (
	select t0.pcode_level2
		,t1.<XXX_varname> as XXX 		--POSSIBLE LOG-TRANSFORMATION HERE
	from "NP_datamodel"."Geo_level2" 	t0
	left join "NP_datamodel"."Indicators_2_TOTAL"	t1 on t0.pcode_level2 = t1.pcode
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
		,log(1 + flood_phys_exp) as flood_phys_exp
--		,log(1 + cyclone_phys_exp) as cyclone_phys_exp
		,log(1 + earthquake7_phys_exp) as earthquake7_phys_exp
--		,log(1 + tsunami_phys_exp) as tsunami_phys_exp
		,log(1 + drought_phys_exp) as drought_phys_exp
/*		,log(case when flood_phys_exp = 0 then 0.00001 else flood_phys_exp end) as flood_phys_exp
		,log(case when cyclone_phys_exp = 0 then 0.00001 else cyclone_phys_exp end) as cyclone_phys_exp
		,log(case when earthquake7_phys_exp = 0 then 0.00001 else earthquake7_phys_exp end) as earthquake7_phys_exp
		,log(case when tsunami_phys_exp = 0 then 0.00001 else tsunami_phys_exp end) as tsunami_phys_exp
		,log(case when drought_phys_exp = 0 then 0.00001 else drought_phys_exp end) as drought_phys_exp*/
	from "NP_datamodel"."Geo_level3" 	t0
	left join "NP_datamodel"."Indicators_3_TOTAL"	t1 on t0.pcode_level3 = t1.pcode
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
select t1.pcode_level3
	,flood_score,flood_phys_exp
--	,cyclone_score,cyclone_phys_exp
	,earthquake_score,earthquake7_phys_exp
--	,tsunami_score,tsunami_phys_exp
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
into "NP_datamodel"."hazard_scores"
from "NP_datamodel"."Geo_level3" t0
left join haz_risk_score t1	on t0.pcode_level3 = t1.pcode_level3
--PLACEHOLDER
--left join XXX_score t2	on t0.pcode_level3 = t2.pcode_level3
;




----------------------------------
-- 2.3: Lack of Coping capacity --
----------------------------------

drop table if exists "NP_datamodel"."coping_capacity_scores";

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
--travel time: higher travel time is lower coping capacity, so higher (Lack of Coping Capacity) score
travel as (
	select t0.pcode_level3
		,log(1 + t1.traveltime) as travel
	from "NP_datamodel"."Geo_level3" t0
	left join "NP_datamodel"."Indicators_3_TOTAL" t1 on t0.pcode_level3 = t1.pcode
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

--JOINING ALL
select t1.pcode_level3
	,travel_score,travel
	--PLACEHOLDER
	--,XXX_score,XXX
	,(10-power(coalesce(
			(10-travel_score)/10*9+1,1)
			 --PLACEHOLDER
			 --* coalesce((10-XXX_score)/10*9+1,1)
			,cast(1 as float)/cast(
		(
		--PLACEHOLDER
		--case when XXX_score is null then 0 else 1 end + 
		case when travel_score is null then 0 else 1 end)		
		as float)))/9*10 as coping_capacity_score
into "NP_datamodel"."coping_capacity_scores"
from "NP_datamodel"."Geo_level3" t0
left join travel_score t1	on t0.pcode_level3 = t1.pcode_level3
--PLACEHOLDER
--left join XXX_score t6 		on t0.pcode_level2 = t6.pcode_level2
;


----------------
-- 2.4: Total --
----------------

drop table if exists "NP_datamodel"."total_scores_level3";
select t1.pcode_level3
	,vulnerability_score
	,hazard_score
	,coping_capacity_score
	,earlydeath_score,illiteracy_score,nosafewater_score,malnourished_score,provisioning_score,hpi_score,hdi_score
	,flood_score,earthquake_score,drought_score
	,travel_score
	--PLACEHOLDER
	--,XXX_score
	,(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
		* coalesce((10-hazard_score)/10*9+1,1)
		* coalesce((10-coping_capacity_score)/10*9+1,1)
		, cast(1 as float)/cast(3 as float)))/9*10 as risk_score
into "NP_datamodel"."total_scores_level3"
from "NP_datamodel"."Geo_level3" t0
left join "NP_datamodel"."vulnerability_scores" t1	on t0.pcode_level3 = t1.pcode_level3
left join "NP_datamodel"."hazard_scores" t2		on t0.pcode_level3 = t2.pcode_level3
left join "NP_datamodel"."coping_capacity_scores" t3	on t0.pcode_level3 = t3.pcode_level3
;

drop table if exists "NP_datamodel"."total_scores_level2";
select t1.pcode_parent as pcode_level2
	,sum(risk_score * population) / sum(population) as risk_score
	,sum(hazard_score * population) / sum(population) as hazard_score
	,sum(vulnerability_score * population) / sum(population) as vulnerability_score
	,sum(coping_capacity_score * population) / sum(population) as coping_capacity_score
	,sum(earlydeath_score * population) / sum(population) as earlydeath_score,sum(illiteracy_score * population) / sum(population) as illiteracy_score,sum(nosafewater_score * population) / sum(population) as nosafewater_score
		,sum(malnourished_score * population) / sum(population) as malnourished_score,sum(provisioning_score * population) / sum(population) as provisioning_score,sum(hpi_score * population) / sum(population) as hpi_score
		,sum(hdi_score * population) / sum(population) as hdi_score
	,sum(flood_score * population) / sum(population) as flood_score,sum(earthquake_score * population) / sum(population) as earthquake_score,sum(drought_score * population) / sum(population) as drought_score
	,sum(travel_score * population) / sum(population) as travel_score
	--PLACEHOLDER
	--,sum(XXX_score * population)/ sum(population) as XXX_score
into "NP_datamodel"."total_scores_level2"
from "NP_datamodel"."total_scores_level3" t0
join "NP_datamodel"."Indicators_3_TOTAL" t1	on t0.pcode_level3 = t1.pcode
group by t1.pcode_parent
;

--ADD risk scores to Indicators_TOTAL table
drop table if exists "NP_datamodel"."Indicators_2_TOTAL";
select *
into "NP_datamodel"."Indicators_2_TOTAL"
from "NP_datamodel"."Indicators_2_TOTAL_temp" t0
left join "NP_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--drop table "NP_datamodel"."Indicators_2_TOTAL";
--select * into "NP_datamodel"."Indicators_2_TOTAL" from "NP_datamodel"."Indicators_2_TOTAL_temp";
--drop table "NP_datamodel"."Indicators_2_TOTAL_temp";
--select * from "NP_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "NP_datamodel"."Indicators_3_TOTAL";
select *
into "NP_datamodel"."Indicators_3_TOTAL"
from "NP_datamodel"."Indicators_3_TOTAL_temp" t0
left join "NP_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
--drop table "NP_datamodel"."Indicators_3_TOTAL";
--select * into "NP_datamodel"."Indicators_3_TOTAL" from "NP_datamodel"."Indicators_3_TOTAL_temp";
--drop table "NP_datamodel"."Indicators_3_TOTAL_temp";
--select * from "NP_datamodel"."Indicators_3_TOTAL" 





