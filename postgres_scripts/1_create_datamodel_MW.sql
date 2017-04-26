drop schema if exists "MW_datamodel" cascade;
create schema "MW_datamodel";

-------------------------
-- 0: Load source data --
-------------------------

--Preferred option to import csv through postgres_scripts/pg_import_csv.py

/* Alternatively you can first create and then upload through code like this
DROP TABLE "mw_source"."Indicators_FCS";
CREATE TABLE "mw_source"."Indicators_FCS" (
	ADM0_NAME text,ADM1_NAME text,ADM2_NAME text,PCODE text,FCS_Mean text,FCS_poor numeric,FCS_Borderline numeric,FCS_Acceptable numeric,Target_Group text,FCS_Month text,FCS_Year text,Methodology text,FCS_LowerThreshold text,FCS_UpperThreshold text,FCS_DataSource text,Indicator_Type text
);
COPY "mw_source"."Indicators_FCS" FROM 'C:\Users\JannisV\Rode Kruis\Malawi data\dbo-foodconsumptionscores.csv' DELIMITER ';' HEADER CSV;
--select * from "mw_source"."Indicators_FCS"
*/

--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------

drop table if exists "MW_datamodel"."Geo_level2";
select case when t1.district = 'Chikwawa' then 'AFRMWI310' else t1.p_code end as pcode_level2
	,t1.district as name
	,substr(t1.p_code,1,7) as pcode_level1
	,t2.geom
into "MW_datamodel"."Geo_level2"
from "geo_source"."Geo_MW_level2" t1
join "geo_source"."Geo_MW_level2_mapshaper" t2 on t1.gid = t2.gid
;

drop table if exists "MW_datamodel"."Geo_level3";
select p_code as pcode_level3
	,trad_auth as name
	,substr(p_code,1,9) as pcode_level2
--	,substr(p_code,1,7) as pcode_level1
--	,case when pop2008 = 0 then 0 else 1 end as inhabited_ind
	,geom
into "MW_datamodel"."Geo_level3"
from "geo_source"."Geo_MW_level3_incl_pop2008"
;

------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 3 data --
------------------

--PLACEHOLDER for adding new level 3 indicator
/*
drop table if exists "MW_datamodel"."Indicators_3_XXX";
select <pcode_identifier> as pcode_level3
	,<transformation of indicator_XXX> as <new_name_XXX>
into "MW_datamodel"."Indicators_3_XXX"
from "mw_source"."Indicators_3_XXX"
join <possibly join with any other tables necessary for transformations> 
where <possibly apply any filters here>
;
*/

--Use 2014 district-level population to extrapolate 2008 TA-level population
drop table if exists "MW_datamodel"."Indicators_3_pop_area";
with popgrowth as (
select "Pcode" as pcode_level2
	,cast("population 2014" as float) / cast("population 2008" as float) as pop_growth
--into "MW_datamodel"."Indicators_2_popgrowth"
from "mw_source"."malawi_pop2014"
)
select p_code as pcode_level3
	,substr(p_code,1,9) as pcode_level2
	,pop2008 * pop_growth as population
	,st_area(st_transform(geom,31467))/1000000 as land_area
into "MW_datamodel"."Indicators_3_pop_area"
from "geo_source"."Geo_MW_level3_incl_pop2008" t0
left join popgrowth t1 on substr(t0.p_code,1,9) = t1.pcode_level2
;

drop table if exists "MW_datamodel"."Indicators_3_hazards";
select p_code as pcode_level3
	,substr(p_code,1,9) as pcode_level2
	,cs_sum + cy_sum as cyclone_phys_exp 	/* Combine into one variable */
	,dr_sum as drought_phys_exp
	,eq7_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
--	,ls_sum as landslide_phys_exp 		/* Leave out for now (not in INFORM) */
	,ts_sum as tsunami_phys_exp
into "MW_datamodel"."Indicators_3_hazards"
from "mw_source"."Indicators_Zonal_Stats"
;

drop table if exists "MW_datamodel"."Indicators_3_gdp_traveltime";
select p_code as pcode_level3
	,substr(p_code,1,9) as pcode_level2
	,gdp_sum * 1000 as gdp
	,tt_mean as traveltime
into "MW_datamodel"."Indicators_3_gdp_traveltime"
from "mw_source"."Indicators_Zonal_Stats"
;

drop table if exists "MW_datamodel"."Indicators_3_poverty";
select "P_CODE" as pcode_level3
	,case when pov > 1.00 then 1.00 else pov end as poverty_incidence
into "MW_datamodel"."Indicators_3_poverty"
from "mw_source"."Indicators_3_poverty"
;

drop table if exists "MW_datamodel"."Indicators_3_health";
SELECT "P_CODE" as pcode_level3
	,case when nr_health is null then 0 else nr_health end as nr_health_facilities
INTO "MW_datamodel"."Indicators_3_health"
FROM mw_source."Indicators_3_health"
;

--electricity data Arjen
drop table if exists "MW_datamodel"."Indicators_3_electricity";
select "P_CODE" as pcode_level3
	,case "Elec_Im_Ni" when  'Yes' then 1 when 'No' then 0 else 0.5 end as electricity
into "MW_datamodel"."Indicators_3_electricity"
from "mw_source"."Indicators_3_electricity"
;

------------------
-- Level 2 data --
------------------

--PLACEHOLDER for adding new level2 indicator
/*
drop table if exists "MW_datamodel"."Indicators_2_XXX";
select <pcode_identifier> as pcode_level2
	,<transformation of indicator_XXX> as <new_name_XXX>
into "MW_datamodel"."Indicators_2_XXX"
from "mw_source"."Indicators_2_XXX"
join <possibly join with any other tables necessary for transformations> 
where <possibly apply any filters here>
;
*/

drop table if exists "MW_datamodel"."Indicators_2_FCS";
select pcode as pcode_level2
	,fcs_acceptable / 100 as FCS
into "MW_datamodel"."Indicators_2_FCS"
from "mw_source"."Indicators_FCS"
;

drop table if exists "MW_datamodel"."Indicators_2_knoema";
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
FROM mw_source."Indicators_Thomas"
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
INTO "MW_datamodel"."Indicators_2_knoema"
FROM temp
;


-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "MW_datamodel"."Indicators_3_TOTAL";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,population
	,land_area
	,population / land_area as pop_density
	,case when population = 0 then null else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null else drought_phys_exp / population end as drought_phys_exp
	,case when population = 0 then null else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null else flood_phys_exp / population end as flood_phys_exp
	,case when population = 0 then null else tsunami_phys_exp / population end as tsunami_phys_exp
	,case when population = 0 then null else gdp / population end as gdp_per_capita
	,traveltime
	,t4.nr_health_facilities
	,case when population/10000 = 0 then null else cast(t4.nr_health_facilities as float)/ (cast(population as float) / 10000) end as health_density
	,t5.poverty_incidence
	,t6.electricity
	--ADD NEW VARIABLES HERE
	--,t6.XXX
into "MW_datamodel"."Indicators_3_TOTAL"
from "MW_datamodel"."Geo_level3" t0
left join "MW_datamodel"."Indicators_3_pop_area" 	t1	on t0.pcode_level3 = t1.pcode_level3
left join "MW_datamodel"."Indicators_3_hazards" 	t2	on t0.pcode_level3 = t2.pcode_level3
left join "MW_datamodel"."Indicators_3_gdp_traveltime" 	t3	on t0.pcode_level3 = t3.pcode_level3
left join "MW_datamodel"."Indicators_3_health" 		t4	on t0.pcode_level3 = t4.pcode_level3
left join "MW_datamodel"."Indicators_3_poverty" 	t5	on t0.pcode_level3 = t5.pcode_level3
left join "MW_datamodel"."Indicators_3_electricity" 	t6	on t0.pcode_level3 = t6.pcode_level3
--ADD NEW JOINED TABLE HERE
--left join "MW_datamodel"."Indicators_3_XXX" 		t6	on t0.pcode_level3 = t6.pcode_level3
;

drop table if exists "MW_datamodel"."Indicators_2_TOTAL";
select t0.pcode_level2 as pcode
	,level3.population,land_area,pop_density
		,cyclone_phys_exp,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp,tsunami_phys_exp
		,gdp_per_capita,traveltime,nr_health_facilities,health_density,poverty_incidence
		,electricity
	--PLACEHOLDER: Add the newly added level3 indicators here again as well
	--,level3.XXX
	,t1.FCS
	,t2.mobile_access,life_expectancy,improved_sanitation,infant_mortality,watersource_piped,construction_semipermanent
	--ADD NEW VARIABLES HERE
	--,t3.XXX
into "MW_datamodel"."Indicators_2_TOTAL"
from "MW_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(gdp_per_capita * population) / sum(population) as gdp_per_capita
		,sum(traveltime * population) / sum(population) as traveltime
		,sum(nr_health_facilities) as nr_health_facilities
		,sum(health_density * population) / sum(population) as health_density
		,sum(poverty_incidence * population) / sum(population) as poverty_incidence
		,sum(electricity * population) / sum(population) as electricity
		--PLACEHOLDER: ADD THE NEWLY ADDED LEVEL4 INDICATORS HERE AGAIN AS WELL with the appropriate transformation
		--,sum(XXX * population) / sum(population) as XXX
	from "MW_datamodel"."Indicators_3_TOTAL"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
left join "MW_datamodel"."Indicators_2_FCS" 	t1	on t0.pcode_level2 = t1.pcode_level2
left join "MW_datamodel"."Indicators_2_knoema" 	t2	on t0.pcode_level2 = t2.pcode_level2
--PLACEHOLDER: ADD TABLE WITH NEW VARIABLES HERE (IT SHOULD BE LEVEL2 ALREADY) 
--left join "MW_datamodel"."Indicators_2_XXX" 	t2	on t0.pcode_level2 = t2.pcode_level2
;



