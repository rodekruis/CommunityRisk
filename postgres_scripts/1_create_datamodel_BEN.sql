
drop schema if exists "BEN_datamodel" cascade;
create schema "BEN_datamodel";

-------------------------
-- 0: Load source data --
-------------------------


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------
  
drop table if exists "BEN_datamodel"."Geo_level1";
select rowcacode1 as pcode_level1
	,adm1_name as name
	,cntry_code as pcode_level0
	,geom
into "BEN_datamodel"."Geo_level1"
from geo_source.BEN_adm1
;

drop table if exists "BEN_datamodel"."Geo_level2";
select rowcacode2 as pcode_level2
	,adm2_name as name
	,rowcacode1 as pcode_level1
	,geom
into "BEN_datamodel"."Geo_level2"
from geo_source.BEN_adm2
;

------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 2 data --
------------------

drop table if exists "BEN_datamodel"."Indicators_2_area";
select rowcacode2 as pcode_level2
	,st_area(st_transform(geom,4326)::geography)/1000000 as land_area
into "BEN_datamodel"."Indicators_2_area"
from geo_source.BEN_adm2
;

drop table if exists "BEN_datamodel"."Indicators_4_population";
select "RowcaCode2" as pcode_level2
	,sum as population
into "BEN_datamodel"."Indicators_2_population"
from ben_source."Indicators_2_population"
;



------------------
-- Level 1 data --
------------------


-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "BEN_datamodel"."Indicators_2_TOTAL";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
	--,tX.XXX ADD NEW VARIABLE HERE
into "BEN_datamodel"."Indicators_2_TOTAL"
from "BEN_datamodel"."Geo_level2" t0
left join "BEN_datamodel"."Indicators_2_area" 		t1	on t0.pcode_level2 = t1.pcode_level2
left join "BEN_datamodel"."Indicators_2_population"	t2	on t0.pcode_level2 = t2.pcode_level2
--left join "BEN_datamodel"."Indicators_2_XXX" 		tX	on t0.pcode_level2 = tX.pcode_level2
;


drop table if exists "BEN_datamodel"."Indicators_1_TOTAL";
select t0.pcode_level1 as pcode
	,level2.population,land_area,pop_density --ADD NEW LEVEL2 VARIABLES HERE
	--ADD NEW LEVEL1 VARIABLES HERE
into "BEN_datamodel"."Indicators_1_TOTAL"
from "BEN_datamodel"."Geo_level1" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		--ADD NEW LEVEL4-VARIABLES HERE AS WELL
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "BEN_datamodel"."Indicators_2_TOTAL"
	group by 1
	) level2
	on t0.pcode_level1 = level2.pcode_parent
--left join "BEN_datamodel"."Indicators_1_XXX" 		t1	on t0.pcode_level1 = t1.pcode_level1
;




