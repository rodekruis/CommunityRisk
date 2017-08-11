drop schema if exists "ZMB_datamodel" cascade;
create schema "ZMB_datamodel";

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

drop table if exists "ZMB_datamodel"."Geo_level1";
select pcode_cso as pcode_level1
	,province as name
	,'' as pcode_level0
	,geom
into "ZMB_datamodel"."Geo_level1"
from "geo_source"."Geo_ZMB_level1"
;

drop table if exists "ZMB_datamodel"."Geo_level2";
select pcode_cso as pcode_level2
	,district_n as name
	,prov_code as pcode_level1
	,geom
into "ZMB_datamodel"."Geo_level2"
from "geo_source"."Geo_ZMB_level2"
;

drop table if exists "ZMB_datamodel"."Geo_level3";
select pcode_le_1 as pcode_level3
	,constname as name
	,pcode_leve as pcode_level2
	,geom
into "ZMB_datamodel"."Geo_level3"
from "geo_source"."Geo_ZMB_level3"
;
--select * from "ZMB_datamodel"."Geo_level3" order by pcode_level2
--select * from "ZMB_datamodel"."Geo_level2" where pcode_level1 = 'ZMB11'
--select * from "ZMB_datamodel"."Geo_level1"


/*
drop table if exists "ZMB_datamodel"."Geo_level4";
select t2.pcode4 as pcode_level4
	,t2."wardName" as name
	,t2.pcode3 as pcode_level3
	,t1.geom
into "ZMB_datamodel"."Geo_level4"
from "geo_source"."zmb_adm4" t1
left join "zmb_source"."pcode_template_zambia" t2 on t1.wardcode = t2."wardCode"
where t1.wardcode > 0
;

drop table if exists "ZMB_datamodel"."Geo_level3";
select t2.pcode3 as pcode_level3
	,t2."constName" as name
	,t2.pcode2 as pcode_level2
	,t1.geom
into "ZMB_datamodel"."Geo_level3"
from "geo_source"."zmb_adm3" t1
left join (select "constName","constCode",pcode3,pcode2 from "zmb_source"."pcode_template_zambia" group by 1,2,3,4) t2 on t1.constcode = t2."constCode"
;

drop table if exists "ZMB_datamodel"."Geo_level2";
select t2.pcode2 as pcode_level2
	,t2."distName" as name
	,t2.pcode1 as pcode_level1
	,t1.geom
into "ZMB_datamodel"."Geo_level2"
from "geo_source"."zambia_adm2_dissolve" t1
left join (select "distName","province",pcode2,pcode1 from "zmb_source"."pcode_template_zambia" group by 1,2,3,4) t2 
	on t1.province = t2."province" and t1.distname = t2."distName"
;

drop table if exists "ZMB_datamodel"."Geo_level1";
select t2.pcode1 as pcode_level1
	,t2."province" as name
	,'ZMB' as pcode_level0
	,t1.geom
into "ZMB_datamodel"."Geo_level1"
from "geo_source"."zambia_adm1_dissolve" t1
left join (select "province",pcode1 from "zmb_source"."pcode_template_zambia" group by 1,2) t2 
	on t1.province = t2."province"
;
*/


------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

drop table if exists "ZMB_datamodel"."Indicators_3_population";
select pcode_le_1 as pcode_level3
	,pop_sum as population
	,st_area(st_transform(geom,31467))/1000000 as land_area
into "ZMB_datamodel"."Indicators_3_population"
from "geo_source"."Geo_ZMB_level3"
;

drop table if exists "ZMB_datamodel"."Indicators_3_hazards";
select "PCODE" as pcode_level3
	,cs_sum + cy_sum as cyclone_phys_exp 	/* Combine into one variable */
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "ZMB_datamodel"."Indicators_3_hazards"
from "zmb_source"."Indicators_3_hazards"
;

drop table if exists "ZMB_datamodel"."Indicators_3_traveltime";
select "PCODE" as pcode_level3
	,tt_mean as traveltime
into "ZMB_datamodel"."Indicators_3_traveltime"
from "zmb_source"."Indicators_3_traveltime"
;



-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "ZMB_datamodel"."Indicators_3_TOTAL";
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
into "ZMB_datamodel"."Indicators_3_TOTAL"
from "ZMB_datamodel"."Geo_level3" t0
left join "ZMB_datamodel"."Indicators_3_population" t1	on t0.pcode_level3 = t1.pcode_level3
left join "ZMB_datamodel"."Indicators_3_hazards" t2	on t0.pcode_level3 = t2.pcode_level3
left join "ZMB_datamodel"."Indicators_3_traveltime" t3	on t0.pcode_level3 = t3.pcode_level3
;


drop table if exists "ZMB_datamodel"."Indicators_2_TOTAL";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,level3.population,land_area,pop_density
	,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp
	,traveltime
into "ZMB_datamodel"."Indicators_2_TOTAL"
from "ZMB_datamodel"."Geo_level2" t0
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
	from "ZMB_datamodel"."Indicators_3_TOTAL"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
;

drop table if exists "ZMB_datamodel"."Indicators_1_TOTAL";
select t0.pcode_level1 as pcode
	,t0.pcode_level0 as pcode_parent
	,level2.population,land_area,pop_density
	,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp
	,traveltime
into "ZMB_datamodel"."Indicators_1_TOTAL"
from "ZMB_datamodel"."Geo_level1" t0
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
	from "ZMB_datamodel"."Indicators_2_TOTAL"
	group by 1
	) level2
	on t0.pcode_level1 = level2.pcode_parent
;
