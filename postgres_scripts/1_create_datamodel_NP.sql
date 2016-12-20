drop schema if exists "NP_datamodel" cascade;
create schema "NP_datamodel";

-------------------------
-- 0: Load source data --
-------------------------
/*
DROP TABLE "np_source"."Indicators_FCS";
CREATE TABLE "np_source"."Indicators_FCS" (
	ADM0_NAME text,ADM1_NAME text,ADM2_NAME text,PCODE text,FCS_Mean text,FCS_poor numeric,FCS_Borderline numeric,FCS_Acceptable numeric,Target_Group text,FCS_Month text,FCS_Year text,Methodology text,FCS_LowerThreshold text,FCS_UpperThreshold text,FCS_DataSource text,Indicator_Type text
);
COPY "np_source"."Indicators_FCS" FROM 'C:\Users\JannisV\Rode Kruis\Malawi data\dbo-foodconsumptionscores.csv' DELIMITER ';' HEADER CSV;
--select * from "np_source"."Indicators_FCS"

DROP TABLE "np_source"."Indicators_Zonal_Stats";
CREATE TABLE "np_source"."Indicators_Zonal_Stats" (
	OBJECTID int,P_CODE text,TRAD_AUTH text,DISTRICT text,REGION text,POP2008 numeric,NOTE_ text,SOURCE text,cs_sum numeric,cy_sum numeric,dr_sum numeric,eq7_sum numeric,fl_sum numeric,ls_sum numeric,ts_sum numeric,gdp_sum numeric,tt_mean numeric
);
COPY "np_source"."Indicators_Zonal_Stats" FROM 'C:\Users\JannisV\Rode Kruis\Malawi data\Boundaries\malawi_zonal_stats_output.csv' DELIMITER ',' HEADER CSV;
--select * from "np_source"."Indicators_Zonal_Stats"

\copy test FROM 'C:\Users\JannisV\Rode Kruis\CP data\Malawi data\MLW_DataTable.csv' DELIMITER ',' HEADER CSV;
*/

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

------------------
-- Level 3 data --
------------------

drop table if exists "NP_datamodel"."Indicators_3_population";
select pcode as pcode_level3
	,population
into "NP_datamodel"."Indicators_3_population"
from "np_source"."Indicators_3_evelyn"
;



/*
--Use 2014 district-level population to extrapolate 2008 TA-level population
drop table if exists "NP_datamodel"."Indicators_3_pop_area";
with popgrowth as (
select "Pcode" as pcode_level2
	,cast("population 2014" as float) / cast("population 2008" as float) as pop_growth
--into "NP_datamodel"."Indicators_2_popgrowth"
from "np_source"."malawi_pop2014"
)
select p_code as pcode_level3
	,substr(p_code,1,9) as pcode_level2
	,pop2008 * pop_growth as population
	,st_area(st_transform(geom,31467))/1000000 as land_area
into "NP_datamodel"."Indicators_3_pop_area"
from "geo_source"."Geo_MW_level3_incl_pop2008" t0
left join popgrowth t1 on substr(t0.p_code,1,9) = t1.pcode_level2
;

drop table if exists "NP_datamodel"."Indicators_3_hazards";
select p_code as pcode_level3
	,substr(p_code,1,9) as pcode_level2
	,cs_sum + cy_sum as cyclone_phys_exp 
	,dr_sum as drought_phys_exp
	,eq7_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
--	,ls_sum as landslide_phys_exp
	,ts_sum as tsunami_phys_exp
into "NP_datamodel"."Indicators_3_hazards"
from "np_source"."Indicators_Zonal_Stats"
;

drop table if exists "NP_datamodel"."Indicators_3_gdp_traveltime";
select p_code as pcode_level3
	,substr(p_code,1,9) as pcode_level2
	,gdp_sum * 1000 as gdp
	,tt_mean as traveltime
into "NP_datamodel"."Indicators_3_gdp_traveltime"
from "np_source"."Indicators_Zonal_Stats"
;

drop table if exists "NP_datamodel"."Indicators_3_poverty";
select "P_CODE" as pcode_level3
	,case when pov > 1.00 then 1.00 else pov end as poverty_incidence
into "NP_datamodel"."Indicators_3_poverty"
from "np_source"."Indicators_3_poverty"
;

drop table if exists "NP_datamodel"."Indicators_3_health";
SELECT "P_CODE" as pcode_level3
	,case when nr_health is null then 0 else nr_health end as nr_health_facilities
INTO "NP_datamodel"."Indicators_3_health"
FROM np_source."Indicators_3_health"
;



------------------
-- Level 2 data --
------------------

drop table if exists "NP_datamodel"."Indicators_2_FCS";
select pcode as pcode_level2
	,fcs_acceptable / 100 as FCS
into "NP_datamodel"."Indicators_2_FCS"
from "np_source"."Indicators_FCS"
;

drop table if exists "NP_datamodel"."Indicators_2_knoema";
with temp as (
select "P_CODE_DISTRICT" as pcode_level2
	,avg("Value.Proportion of households with access to mobile phone_Tota")/100 as mobile_access
	,avg(("Value.Life expectancy at birth_Female" + "Value.Life expectancy at birth_Male")/2) as life_expectancy
--	,avg("Value.Poverty status_Poor"/100) as poverty_incidence
--	,avg("Value.Poverty status_Ultra poor") as poverty_incidence_ultra
	,avg("Value.Proportion with access to improved sanitation_Total_Perce"/100) as improved_sanitation
	,avg("Value.Source of drinking water_Spring/River/Stream/Pond/Lake/Da"/100) as watersource_spring
	,avg("Value.Source of drinking water_Piped into dwelling_Percent"/100) as watersource_pipe_personal
	,avg("Value.Source of drinking water_Piped into yard/plot/Communal St"/100) as watersource_pipe_communal
	,avg("Value.Source of drinking water_Protected well in yard/plot/publ"/100) as watersource_well_protected
	,avg("Value.Source of drinking water_Open well in yard/plot/open publ"/100) as watersource_well_open
	,avg("Value.Infant mortality rate_Total <1 yr") as infant_mortality
	,avg("Value.Type of construction materials_Permanent"/100) as construction_permanent
	,avg("Value.Type of construction materials_Traditional"/100) as construction_traditional
	,avg("Value.Type of construction materials_Semi-permanent"/100) as construction_semipermanent
FROM np_source."Indicators_Thomas"
group by 1
)
select pcode_level2
	,mobile_access
	,life_expectancy
--	,poverty_incidence
	,improved_sanitation
	,(watersource_pipe_personal+watersource_pipe_communal)/(watersource_pipe_personal+watersource_pipe_communal+watersource_well_protected+watersource_well_open+watersource_spring) as watersource_piped
	,infant_mortality
	,(construction_permanent+construction_semipermanent)/(construction_permanent+construction_traditional+construction_semipermanent) as construction_semipermanent
INTO "NP_datamodel"."Indicators_2_knoema"
FROM temp
;


*/

-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "NP_datamodel"."Indicators_4_TOTAL";
select t0.pcode_level4 as pcode
	,t0.pcode_level3 as pcode_parent
	,land_area
into "NP_datamodel"."Indicators_4_TOTAL"
from "NP_datamodel"."Geo_level4" t0
left join "NP_datamodel"."Indicators_4_area" 	t1	on t0.pcode_level4 = t1.pcode_level4
;


drop table if exists "NP_datamodel"."Indicators_3_TOTAL";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,level4.land_area
	,population
	,population/land_area as pop_density
into "NP_datamodel"."Indicators_3_TOTAL"
from "NP_datamodel"."Geo_level3" t0
left join (
	select pcode_parent
		,sum(land_area) as land_area
	from "NP_datamodel"."Indicators_4_TOTAL"
	group by 1
	) level4
	on t0.pcode_level3 = level4.pcode_parent
left join "NP_datamodel"."Indicators_3_population" 	t1	on t0.pcode_level3 = t1.pcode_level3
;


drop table if exists "NP_datamodel"."Indicators_2_TOTAL";
select t0.pcode_level2 as pcode
	,level3.population,land_area,pop_density
into "NP_datamodel"."Indicators_2_TOTAL"
from "NP_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
	from "NP_datamodel"."Indicators_3_TOTAL"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
;