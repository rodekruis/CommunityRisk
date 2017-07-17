
drop schema if exists "SL_datamodel" cascade;
create schema "SL_datamodel";

-------------------------
-- 0: Load source data --
-------------------------


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------

execute format('insert into %I values($1, $2, $3, $4, $5)', 'L' || levelid)
   using v_seq, v_levelname, ... ;

postgres=# create table foo(a int, b text);
CREATE TABLE
postgres=# do $$
postgres$# begin
postgres$# execute format('insert into %I values($1,$2)', 'foo') using 1, 'AHOJ';
postgres$# end;
postgres$# $$;
DO
postgres=# select * from foo;

-- Procedure to insert a new city
CREATE OR REPLACE FUNCTION test(country VARCHAR(70), state CHAR(2)) 
RETURNS void AS $$
BEGIN
INSERT INTO cities VALUES (city, state);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test(country VARCHAR(70), state CHAR(2)) 
RETURNS void AS $$
BEGIN
select t0.district_c as pcode_level2
	,t0.province_n as name
	,t0.province_c as pcode_level1
	,t1.geom
into "SL_datamodel"."Geo_level2"
from geo_source.sl_adm2 t0
left join geo_source.sl_adm2_mapshaper t1
on t0.gid = t1.gid  
;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS test(varchar);
CREATE OR REPLACE FUNCTION test(country varchar)
RETURNS void AS $$
BEGIN
EXECUTE format('CREATE TABLE "%s_datamodel"."test" AS
		select district_c as pcode_level2
			,district_n as name
			,province_c as pcode_level1
			,geom
		from geo_source.lka_adm2_mapshaper
		', country);
END;
$$ LANGUAGE plpgsql;
--select test('SL')

drop table if exists "SL_datamodel"."Geo_level2";
select t0.district_c as pcode_level2
	,t0.province_n as name
	,t0.province_c as pcode_level1
	,t1.geom
into "SL_datamodel"."Geo_level2"
from geo_source.sl_adm2 t0
left join geo_source.sl_adm2_mapshaper t1
on t0.gid = t1.gid  
;

drop table if exists "SL_datamodel"."Geo_level3";
select t0.dsd_c as pcode_level3
	,t0.dsd_n as name
	,t0.district_1 as pcode_level2
	,t1.geom
into "SL_datamodel"."Geo_level3"
from geo_source.sl_adm3 t0
left join geo_source.sl_adm3_mapshaper t1
on t0.gid = t1.gid  
;

drop table if exists "SL_datamodel"."Geo_level4";
select t0.gn_uid as pcode_level4
	,t0.gnd_n as name
	,t0.dsd_c as pcode_level3
	,t1.geom
into "SL_datamodel"."Geo_level4"
from geo_source.sl_adm4 t0
left join geo_source.sl_adm4_mapshaper t1
on t0.gid = t1.gid  
;


------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 4 data --
------------------

drop table if exists "SL_datamodel"."Indicators_4_area";
select gn_uid as pcode_level4
	,st_area(st_transform(geom,4326)::geography)/1000000 as land_area
into "SL_datamodel"."Indicators_4_area"
from geo_source.sl_adm4
;

drop table if exists "SL_datamodel"."Indicators_4_population";
select gn_uid as pcode_level4
	,tot_pop as population
into "SL_datamodel"."Indicators_4_population"
from geo_source.sl_adm4
;



------------------
-- Level 3 data --
------------------
/*
drop table if exists "SL_datamodel"."Indicators_3_hazards";
select "PCODE" as pcode_level3
	,cs_sum + cy_sum as cyclone_phys_exp
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "SL_datamodel"."Indicators_3_hazards"
from "SL_source"."Indicators_3_hazards"
;
*/


------------------
-- Level 2 data --
------------------


-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "SL_datamodel"."Indicators_4_TOTAL";
select t0.pcode_level4 as pcode
	,t0.pcode_level3 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
	--,tX.XXX ADD NEW VARIABLE HERE
into "SL_datamodel"."Indicators_4_TOTAL"
from "SL_datamodel"."Geo_level4" t0
left join "SL_datamodel"."Indicators_4_area" 		t1	on t0.pcode_level4 = t1.pcode_level4
left join "SL_datamodel"."Indicators_4_population" 	t2	on t0.pcode_level4 = t2.pcode_level4
--left join "SL_datamodel"."Indicators_4_XXX" 		tX	on t0.pcode_level4 = tX.pcode_level4
;


drop table if exists "SL_datamodel"."Indicators_3_TOTAL";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,level4.land_area,population,pop_density
	--ADD NEW LEVEL4 VARIABLES HERE AGAIN AS WELL (in aggregated form)
/*	,case when population = 0 then null else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null else drought_phys_exp / population end as drought_phys_exp
	,case when population = 0 then null else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null else flood_phys_exp / population end as flood_phys_exp
	,case when population = 0 then null else tsunami_phys_exp / population end as tsunami_phys_exp */
	--ADD NEW LEVEL3 VARIABLES HERE
into "SL_datamodel"."Indicators_3_TOTAL"
from "SL_datamodel"."Geo_level3" t0
left join (
	select pcode_parent
		,sum(land_area) as land_area
		,sum(population) as population
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		--ADD NEW LEVEL4 VARIABLES HERE AGAIN AS WELL (in aggregated form)
	from "SL_datamodel"."Indicators_4_TOTAL"
	group by 1
	) level4
	on t0.pcode_level3 = level4.pcode_parent
--left join "SL_datamodel"."Indicators_3_XXX" 		t3	on t0.pcode_level3 = t3.pcode_level3
;


drop table if exists "SL_datamodel"."Indicators_2_TOTAL";
select t0.pcode_level2 as pcode
	,level3.population,land_area,pop_density --ADD NEW LEVEL4 VARIABLES HERE
	--ADD NEW LEVEL2 VARIABLES HERE
into "SL_datamodel"."Indicators_2_TOTAL"
from "SL_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		--ADD NEW LEVEL4-VARIABLES HERE AS WELL
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "SL_datamodel"."Indicators_3_TOTAL"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
--left join "SL_datamodel"."Indicators_2_XXX" 		t1	on t0.pcode_level2 = t1.pcode_level2
;




