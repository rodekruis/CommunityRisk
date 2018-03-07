
drop schema if exists "PER_datamodel" cascade;
create schema "PER_datamodel";

-------------------------
-- 0: Load source data --
-------------------------


--------------------------------
-- 1: Create datamodel tables --
--------------------------------

-------------------------------
-- 1.1: Boundary data tables --
-------------------------------

drop table if exists "PER_datamodel"."Geo_level1";
select first_iddp as pcode_level1
	,initcap(lower(nombdep)) as name
	,null as pcode_level0
	,geom
into "PER_datamodel"."Geo_level1"
from per_source.peru_adm1_mapshaper_reproj
;
--select * from "PER_datamodel"."Geo_level1"

drop table if exists "PER_datamodel"."Geo_level2";
select first_idpr as pcode_level2
	,min(initcap(lower(nombprov))) as name
	,substr(first_idpr,1,2) as pcode_level1
	,min(geom) as geom
into "PER_datamodel"."Geo_level2"
from per_source.peru_adm2_mapshaper_reproj_agg
group by 1,3
;
--select * from "PER_datamodel"."Geo_level2" order by 1

drop table if exists "PER_datamodel"."Geo_level3";
select iddist as pcode_level3
	,initcap(lower(nombdist)) as name
	,idprov as pcode_level2
	,geom
into "PER_datamodel"."Geo_level3"
from per_source.peru_adm3_mapshaper_reproj
;
--select * from "PER_datamodel"."Geo_level3"



------------------------------------------
-- 1.2: Transform Indicator data tables --
------------------------------------------

------------------
-- Level 3 data --
------------------

drop table if exists "PER_datamodel"."Indicators_3_area";
select iddist as pcode_level3
	,st_area(st_transform(geom,4326)::geography)/1000000 as land_area
into "PER_datamodel"."Indicators_3_area"
from per_source.peru_adm3_mapshaper_reproj
;
--select * from "PER_datamodel"."Indicators_3_area"

drop table if exists "PER_datamodel"."Indicators_3_population";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,population
into "PER_datamodel"."Indicators_3_population"
from per_source."Indicators_3_population"
;
--select * from "PER_datamodel"."Indicators_3_population"

drop table if exists "PER_datamodel"."Indicators_3_hazards";
select case when length(cast("PCODE" as varchar)) = 5 then '0' || cast("PCODE" as varchar) else cast("PCODE" as varchar) end as pcode_level3
	,cs_sum + cy_sum as cyclone_phys_exp 	
	,dr_sum as drought_phys_exp
	,eq_sum as earthquake7_phys_exp
	,fl_sum as flood_phys_exp
	,ts_sum as tsunami_phys_exp
into "PER_datamodel"."Indicators_3_hazards"
from per_source."Indicators_3_hazards"
;
--select * from "PER_datamodel"."Indicators_3_hazards"

drop table if exists "PER_datamodel"."Indicators_3_traveltime";
select case when length(cast("PCODE" as varchar)) = 5 then '0' || cast("PCODE" as varchar) else cast("PCODE" as varchar) end as pcode_level3
	,case when tt_mean < 0 then 0 else tt_mean end as traveltime
into "PER_datamodel"."Indicators_3_traveltime"
from per_source."Indicators_3_traveltime"
;
--select * from "PER_datamodel"."Indicators_3_traveltime"

drop table if exists "PER_datamodel"."Indicators_3_poverty_incidence";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,incidencia_de_pobreza/100 as poverty_incidence
into "PER_datamodel"."Indicators_3_poverty_incidence"
from per_source."poverty_index"
;
--select * from "PER_datamodel"."Indicators_3_poverty_incidence"


drop table if exists "PER_datamodel"."Indicators_3_analphabetism";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,tasa_de_analfabetismo/100 as perc_analphabetism
into "PER_datamodel"."Indicators_3_analphabetism"
from per_source."analphabetism"
;
--select * from "PER_datamodel"."Indicators_3_analphabetism"

drop table if exists "PER_datamodel"."Indicators_3_rainfall";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,valor_de_exposicion as rainfall_exposure
into "PER_datamodel"."Indicators_3_rainfall"
from per_source."exposure_to_rainfall"
;
--select * from "PER_datamodel"."Indicators_3_rainfall"


drop table if exists "PER_datamodel"."Indicators_3_malnutrition";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,desnutricion_cronica/100 as perc_malnutrition_u5
into "PER_datamodel"."Indicators_3_malnutrition"
from per_source."malnutrition_children_U5"
;
--select * from "PER_datamodel"."Indicators_3_malnutrition"

drop table if exists "PER_datamodel"."Indicators_3_health_facilities";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,establecim_salud as nr_health_facilities
into "PER_datamodel"."Indicators_3_health_facilities"
from per_source."no_of_health_establishments"
;
--select * from "PER_datamodel"."Indicators_3_health_facilities"

drop table if exists "PER_datamodel"."Indicators_3_educ_facilities";
select case when length(cast(pcode as varchar)) = 5 then '0' || cast(pcode as varchar) else cast(pcode as varchar) end as pcode_level3
	,instituc_educativas as nr_educ_facilities
into "PER_datamodel"."Indicators_3_educ_facilities"
from per_source."no_of_educational_institutes"
;
--select * from "PER_datamodel"."Indicators_3_educ_facilities"


--Sanitation
drop table if exists "PER_datamodel"."Indicators_3_sanitation";
select case when length(cast("Cуdigo" as varchar)) = 5 then '0' || cast("Cуdigo" as varchar) else cast("Cуdigo" as varchar) end as pcode_level3
	,cast(("Red pъblica de desague dentro de la Viv." + "Red pъblica de desague fuera de la Viv.") as float) / cast("A1_T" as float) as sanitation
	--, "Pozo sйptico", "Pozo ciego o negro / letrina", "Rнo, acequia o canal", "No tiene", "A1_T"
into "PER_datamodel"."Indicators_3_sanitation"
from per_source.reporte_sanitation_absolute
;
--select * from "PER_datamodel"."Indicators_3_sanitation"

--Piped water
drop table if exists "PER_datamodel"."Indicators_3_piped_water";
select case when length(cast("Cуdigo" as varchar)) = 5 then '0' || cast("Cуdigo" as varchar) else cast("Cуdigo" as varchar) end as pcode_level3
	,cast(("Red pъblica Dentro de la viv. - Agua potable" + "Red Pъblica Fuera de la vivienda" + "Pilуn de uso pъblico" + "Camiуn-cisterna u otro similar") as float)
		/ cast("A1_T" as float) as piped_water
       --,"Pozo", "Rнo, acequia.manantial o similar", "Vecino", "Otro"
into "PER_datamodel"."Indicators_3_piped_water"
from per_source.reporte_water_supply
;
--select * from "PER_datamodel"."Indicators_3_piped_water"

/*
--Dengue
drop table if exists "PER_datamodel"."Indicators_3_dengue";
select coalesce(case when length(cast(t0."PCODE" as varchar)) = 5 then '0' || cast(t0."PCODE" as varchar) else cast(t0."PCODE" as varchar) end 
	,case when length(cast(t1."PCODE" as varchar)) = 5 then '0' || cast(t1."PCODE" as varchar) else cast(t1."PCODE" as varchar) end) as pcode_level3
	,coalesce(t0."TOTAL PROB. + CONF.",0) + coalesce(t1."TOTAL PROB. + CONF.",0) as dengue_incidence
into "PER_datamodel"."Indicators_3_dengue"
from per_source.dengue_with_warning_signals t0
full outer join per_source.dengue_without_warning_signals t1
	on t0."PCODE" = t1."PCODE"
;
--select * from "PER_datamodel"."Indicators_3_dengue"

--Leishmaniasis
drop table if exists "PER_datamodel"."Indicators_3_leishmaniasis";
select coalesce(case when length(cast(t0."PCODE" as varchar)) = 5 then '0' || cast(t0."PCODE" as varchar) else cast(t0."PCODE" as varchar) end 
	,case when length(cast(t1."PCODE" as varchar)) = 5 then '0' || cast(t1."PCODE" as varchar) else cast(t1."PCODE" as varchar) end) as pcode_level3
	,coalesce(t0."TOTAL PROB. + CONF.",0) + coalesce(t1."TOTAL PROB. + CONF.",0) as leishmaniasis_incidence
into "PER_datamodel"."Indicators_3_leishmaniasis"
from per_source.leishmaniasis_cutanea t0
full outer join per_source.leishmaniasis_mucocutanea t1
	on t0."PCODE" = t1."PCODE"
;
--select * from "PER_datamodel"."Indicators_3_leishmaniasis"

--Malaria
drop table if exists "PER_datamodel"."Indicators_3_malaria";
select case when length(cast("PCODE" as varchar)) = 5 then '0' || cast("PCODE" as varchar) else cast("PCODE" as varchar) end as pcode_level3
	,"TOTAL PROB. + CONF." as malaria_incidence
into "PER_datamodel"."Indicators_3_malaria"
from per_source.malaria_vivax
;
--select * from "PER_datamodel"."Indicators_3_malaria"

--leptospirosis
drop table if exists "PER_datamodel"."Indicators_3_leptospirosis";
select case when length(cast("PCODE" as varchar)) = 5 then '0' || cast("PCODE" as varchar) else cast("PCODE" as varchar) end as pcode_level3
	,"TOTAL PROB. + CONF." as leptospirosis_incidence
into "PER_datamodel"."Indicators_3_leptospirosis"
from per_source.leptospirosis
;
--select * from "PER_datamodel"."Indicators_3_leptospirosis"
*/


------------------
-- Level 2 data --
------------------

drop table if exists "PER_datamodel"."Indicators_2_walltype";
select pcode_level2
	,case when nr_total < 70 then null else 
		cast((nr_ladrillo + nr_piedra_sillar + nr_piedra_barro + nr_adobe + nr_tapia) as float) / cast(nr_total as float) 
		end as wall_type
into "PER_datamodel"."Indicators_2_walltype"
from (
	select substring(case when length(cast("UBIGEO" as varchar)) = 5 then '0' || cast("UBIGEO" as varchar) else cast("UBIGEO" as varchar) end,1,4) as pcode_level2
		,sum(case when wall_type = 'Adobe' then 1 else 0 end) as nr_adobe
		,sum(case when wall_type = 'Estera' then 1 else 0 end) as nr_estera
		,sum(case when wall_type = 'Ladrillo o bloque de cemento' then 1 else 0 end) as nr_ladrillo
		,sum(case when wall_type = 'Madera' then 1 else 0 end) as nr_madera
		,sum(case when wall_type = 'Otro material' then 1 else 0 end) as nr_otro
		,sum(case when wall_type = 'Piedra con barro' then 1 else 0 end) as nr_piedra_barro
		,sum(case when wall_type = 'Piedra o sillar con cal o cemento' then 1 else 0 end) as nr_piedra_sillar
		,sum(case when wall_type = 'Quincha (caсa con barro)' then 1 else 0 end) as nr_quincha
		,sum(case when wall_type = 'Tapia' then 1 else 0 end) as nr_tapia
		,sum(case when wall_type <> '' then 1 else 0 end) as nr_total
	from per_source."roofwall_internetphone_drinkwatersanit"
	group by 1
	) temp
;
--select * from "PER_datamodel"."Indicators_2_walltype"

drop table if exists "PER_datamodel"."Indicators_2_rooftype";
select pcode_level2
	,case when nr_total < 70 then null else 
		cast((nr_concreto + nr_planchas + nr_tejas) as float) / cast(nr_total as float)
		end as roof_type
into "PER_datamodel"."Indicators_2_rooftype"
from (
	select substring(case when length(cast("UBIGEO" as varchar)) = 5 then '0' || cast("UBIGEO" as varchar) else cast("UBIGEO" as varchar) end,1,4) as pcode_level2
		,sum(case when roof_type = 'Planchas de calamina, fibra de cemento o similares' then 1 else 0 end) as nr_planchas
		,sum(case when roof_type = 'Concreto armado' then 1 else 0 end) as nr_concreto
		,sum(case when roof_type = 'Tejas' then 1 else 0 end) as nr_tejas
		,sum(case when roof_type = 'Caсa o estera con torta de barro' then 1 else 0 end) as nr_caca
		,sum(case when roof_type = 'Paja, hojas de palmera' then 1 else 0 end) as nr_paja
		,sum(case when roof_type = 'Madera' then 1 else 0 end) as nr_madera
		,sum(case when roof_type = 'Estera' then 1 else 0 end) as nr_estera
		,sum(case when roof_type = 'Otro material' then 1 else 0 end) as nr_otro
		,sum(case when roof_type <> '' then 1 else 0 end) as nr_total
	from per_source."roofwall_internetphone_drinkwatersanit"
	group by 1
	) temp
;
--select * from "PER_datamodel"."Indicators_2_rooftype"

drop table if exists "PER_datamodel"."Indicators_2_services";
select substring(case when length(cast("UBIGEO" as varchar)) = 5 then '0' || cast("UBIGEO" as varchar) else cast("UBIGEO" as varchar) end,1,4) as pcode_level2
	,case when sum(case when mobile_phone_yesno <> '' then 1 else 0 end) < 70 then null else (
		cast(sum(case when mobile_phone_yesno = 'Celular' then 1 else 0 end) as float) / cast(sum(case when mobile_phone_yesno <> '' then 1 else 0 end) as float)
	) end as mobile_phone_access
	,case when sum(case when internet_yesno <> '' then 1 else 0 end) < 70 then null else (
		cast(sum(case when internet_yesno = 'Internet' then 1 else 0 end) as float) / cast(sum(case when internet_yesno <> '' then 1 else 0 end) as float)
	) end as internet_access
--	,case when sum(case when drinkwater_yesno <> '' then 1 else 0 end) < 70 then null else (
--		cast(sum(case when drinkwater_yesno = 'Si' then 1 else 0 end) as float) / cast(sum(case when drinkwater_yesno <> '' then 1 else 0 end) as float)
--	) end as potable_water
--	,case when sum(case when sanitation_yesno <> '' then 1 else 0 end) < 70 then null else (
--		cast(sum(case when sanitation_yesno = 'Hogares con vivienda con servicios higienicos' then 1 else 0 end) as float) / cast(sum(case when sanitation_yesno <> '' then 1 else 0 end) as float)
--	) end as sanitation
into "PER_datamodel"."Indicators_2_services"
from per_source."roofwall_internetphone_drinkwatersanit"
group by 1
;
--select * from "PER_datamodel"."Indicators_2_services"


------------------
-- Level 1 data --
------------------

drop table if exists "PER_datamodel"."Indicators_1_walltype";
select pcode_level1
	,cast((nr_ladrillo + nr_piedra_sillar + nr_piedra_barro + nr_adobe + nr_tapia) as float) / cast(nr_total as float) as wall_type
into "PER_datamodel"."Indicators_1_walltype"
from (
	select substring(case when length(cast("UBIGEO" as varchar)) = 5 then '0' || cast("UBIGEO" as varchar) else cast("UBIGEO" as varchar) end,1,2) as pcode_level1
		,sum(case when wall_type = 'Adobe' then 1 else 0 end) as nr_adobe
		,sum(case when wall_type = 'Estera' then 1 else 0 end) as nr_estera
		,sum(case when wall_type = 'Ladrillo o bloque de cemento' then 1 else 0 end) as nr_ladrillo
		,sum(case when wall_type = 'Madera' then 1 else 0 end) as nr_madera
		,sum(case when wall_type = 'Otro material' then 1 else 0 end) as nr_otro
		,sum(case when wall_type = 'Piedra con barro' then 1 else 0 end) as nr_piedra_barro
		,sum(case when wall_type = 'Piedra o sillar con cal o cemento' then 1 else 0 end) as nr_piedra_sillar
		,sum(case when wall_type = 'Quincha (caсa con barro)' then 1 else 0 end) as nr_quincha
		,sum(case when wall_type = 'Tapia' then 1 else 0 end) as nr_tapia
		,sum(case when wall_type <> '' then 1 else 0 end) as nr_total
	from per_source."roofwall_internetphone_drinkwatersanit"
	group by 1
	) temp
;
--select * from "PER_datamodel"."Indicators_1_walltype"

drop table if exists "PER_datamodel"."Indicators_1_rooftype";
select pcode_level1
	,cast((nr_concreto + nr_planchas + nr_tejas) as float) / cast(nr_total as float) as roof_type
into "PER_datamodel"."Indicators_1_rooftype"
from (
	select substring(case when length(cast("UBIGEO" as varchar)) = 5 then '0' || cast("UBIGEO" as varchar) else cast("UBIGEO" as varchar) end,1,2) as pcode_level1
		,sum(case when roof_type = 'Planchas de calamina, fibra de cemento o similares' then 1 else 0 end) as nr_planchas
		,sum(case when roof_type = 'Concreto armado' then 1 else 0 end) as nr_concreto
		,sum(case when roof_type = 'Tejas' then 1 else 0 end) as nr_tejas
		,sum(case when roof_type = 'Caсa o estera con torta de barro' then 1 else 0 end) as nr_caca
		,sum(case when roof_type = 'Paja, hojas de palmera' then 1 else 0 end) as nr_paja
		,sum(case when roof_type = 'Madera' then 1 else 0 end) as nr_madera
		,sum(case when roof_type = 'Estera' then 1 else 0 end) as nr_estera
		,sum(case when roof_type = 'Otro material' then 1 else 0 end) as nr_otro
		,sum(case when roof_type <> '' then 1 else 0 end) as nr_total
	from per_source."roofwall_internetphone_drinkwatersanit"
	group by 1
	) temp
;
--select * from "PER_datamodel"."Indicators_1_rooftype"

drop table if exists "PER_datamodel"."Indicators_1_services";
select substring(case when length(cast("UBIGEO" as varchar)) = 5 then '0' || cast("UBIGEO" as varchar) else cast("UBIGEO" as varchar) end,1,2) as pcode_level1
	,case when sum(case when mobile_phone_yesno <> '' then 1 else 0 end) = 0 then null else (
		cast(sum(case when mobile_phone_yesno = 'Celular' then 1 else 0 end) as float) / cast(sum(case when mobile_phone_yesno <> '' then 1 else 0 end) as float)
	) end as mobile_phone_access
	,case when sum(case when internet_yesno <> '' then 1 else 0 end) = 0 then null else (
		cast(sum(case when internet_yesno = 'Internet' then 1 else 0 end) as float) / cast(sum(case when internet_yesno <> '' then 1 else 0 end) as float)
	) end as internet_access
--	,case when sum(case when drinkwater_yesno <> '' then 1 else 0 end) = 0 then null else (
--		cast(sum(case when drinkwater_yesno = 'Si' then 1 else 0 end) as float) / cast(sum(case when drinkwater_yesno <> '' then 1 else 0 end) as float)
--	) end as potable_water
--	,case when sum(case when sanitation_yesno <> '' then 1 else 0 end) = 0 then null else (
--		cast(sum(case when sanitation_yesno = 'Hogares con vivienda con servicios higienicos' then 1 else 0 end) as float) / cast(sum(case when sanitation_yesno <> '' then 1 else 0 end) as float)
--	) end as sanitation
into "PER_datamodel"."Indicators_1_services"
from per_source."roofwall_internetphone_drinkwatersanit"
group by 1
;
--select * from "PER_datamodel"."Indicators_1_services"







-----------------------------------------------
-- 1.3: Create one Indicator table per level--
-----------------------------------------------

drop table if exists "PER_datamodel"."Indicators_3_TOTAL_temp";
select t0.pcode_level3 as pcode
	,t0.pcode_level2 as pcode_parent
	,land_area
	,population
	,population / land_area as pop_density
	--,case when population = 0 then null else cyclone_phys_exp / population end as cyclone_phys_exp
	,case when population = 0 then null else drought_phys_exp / population end as drought_phys_exp
	,case when population = 0 then null else earthquake7_phys_exp / population end as earthquake7_phys_exp
	,case when population = 0 then null else flood_phys_exp / population end as flood_phys_exp
	,case when population = 0 then null else tsunami_phys_exp / population end as tsunami_phys_exp
	,t4.traveltime
	,t5.perc_analphabetism
	,t6.perc_malnutrition_U5
	,cast(t7.nr_health_facilities as float) / cast((t2.population / 10000) as float) as health_density
	,cast(t8.nr_educ_facilities as float) / cast((t2.population / 10000) as float) as education_density
	,t9.poverty_incidence
	,t10.sanitation
	,t11.piped_water
	--,tX.XXX ADD NEW VARIABLE HERE
into "PER_datamodel"."Indicators_3_TOTAL_temp"
from "PER_datamodel"."Geo_level3" t0
left join "PER_datamodel"."Indicators_3_area" 			t1	on t0.pcode_level3 = t1.pcode_level3
left join "PER_datamodel"."Indicators_3_population"		t2	on t0.pcode_level3 = t2.pcode_level3
left join "PER_datamodel"."Indicators_3_hazards" 		t3	on t0.pcode_level3 = t3.pcode_level3
left join "PER_datamodel"."Indicators_3_traveltime" 		t4	on t0.pcode_level3 = t4.pcode_level3
left join "PER_datamodel"."Indicators_3_analphabetism" 		t5	on t0.pcode_level3 = t5.pcode_level3
left join "PER_datamodel"."Indicators_3_malnutrition" 		t6	on t0.pcode_level3 = t6.pcode_level3
left join "PER_datamodel"."Indicators_3_health_facilities" 	t7	on t0.pcode_level3 = t7.pcode_level3
left join "PER_datamodel"."Indicators_3_educ_facilities" 	t8	on t0.pcode_level3 = t8.pcode_level3
left join "PER_datamodel"."Indicators_3_poverty_incidence" 	t9	on t0.pcode_level3 = t9.pcode_level3
left join "PER_datamodel"."Indicators_3_sanitation" 		t10	on t0.pcode_level3 = t10.pcode_level3
left join "PER_datamodel"."Indicators_3_piped_water" 		t11	on t0.pcode_level3 = t11.pcode_level3
--left join "PER_datamodel"."Indicators_3_XXX" 			tX	on t0.pcode_level3 = tX.pcode_level3
;
--select * from "PER_datamodel"."Indicators_3_TOTAL_temp"

drop table if exists "PER_datamodel"."Indicators_2_TOTAL_temp";
select t0.pcode_level2 as pcode
	,t0.pcode_level1 as pcode_parent
	,level3.population,land_area,pop_density
	,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp,tsunami_phys_exp,traveltime 
	,perc_analphabetism,perc_malnutrition_U5,health_density,education_density,poverty_incidence,sanitation,piped_water
	--ADD NEW LEVEL3 VARIABLES HERE
	,t1.wall_type
	,t2.roof_type
	,t3.mobile_phone_access,internet_access
	--ADD NEW LEVEL2 VARIABLES HERE
into "PER_datamodel"."Indicators_2_TOTAL_temp"
from "PER_datamodel"."Geo_level2" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		--,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(traveltime * population) / sum(population) as traveltime
		,sum(perc_analphabetism * population) / sum(population) as perc_analphabetism
		,sum(perc_malnutrition_U5 * population) / sum(population) as perc_malnutrition_U5
		,sum(health_density * population) / sum(population) as health_density
		,sum(education_density * population) / sum(population) as education_density
		,sum(poverty_incidence * population) / sum(population) as poverty_incidence
		,sum(sanitation * population) / sum(population) as sanitation
		,sum(piped_water * population) / sum(population) as piped_water
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
	from "PER_datamodel"."Indicators_3_TOTAL_temp"
	group by 1
	) level3
	on t0.pcode_level2 = level3.pcode_parent
left join "PER_datamodel"."Indicators_2_walltype" 		t1	on t0.pcode_level2 = t1.pcode_level2
left join "PER_datamodel"."Indicators_2_rooftype" 		t2	on t0.pcode_level2 = t2.pcode_level2
left join "PER_datamodel"."Indicators_2_services" 		t3	on t0.pcode_level2 = t3.pcode_level2
--left join "PER_datamodel"."Indicators_2_XXX" 			tX	on t0.pcode_level2 = tX.pcode_level2
;
--select * from "PER_datamodel"."Indicators_2_TOTAL_temp"


drop table if exists "PER_datamodel"."Indicators_1_TOTAL_temp";
select t0.pcode_level1 as pcode
	,level2.population,land_area,pop_density
	,drought_phys_exp,earthquake7_phys_exp,flood_phys_exp,tsunami_phys_exp,traveltime 
	,perc_analphabetism,perc_malnutrition_U5,health_density,education_density,poverty_incidence,sanitation,piped_water
	--ADD NEW LEVEL2 VARIABLES HERE
	,t1.wall_type
	,t2.roof_type
	,t3.mobile_phone_access,internet_access
	--ADD NEW LEVEL1 VARIABLES HERE
into "PER_datamodel"."Indicators_1_TOTAL_temp"
from "PER_datamodel"."Geo_level1" t0
left join (
	select pcode_parent
		,sum(population) as population
		,sum(land_area) as land_area
		,sum(pop_density * land_area) / sum(land_area) as pop_density
		--,sum(cyclone_phys_exp * population) / sum(population) as cyclone_phys_exp
		,sum(drought_phys_exp * population) / sum(population) as drought_phys_exp
		,sum(earthquake7_phys_exp * population) / sum(population) as earthquake7_phys_exp
		,sum(flood_phys_exp * population) / sum(population) as flood_phys_exp
		,sum(tsunami_phys_exp * population) / sum(population) as tsunami_phys_exp
		,sum(traveltime * population) / sum(population) as traveltime
		,sum(perc_analphabetism * population) / sum(population) as perc_analphabetism
		,sum(perc_malnutrition_U5 * population) / sum(population) as perc_malnutrition_U5
		,sum(health_density * population) / sum(population) as health_density
		,sum(education_density * population) / sum(population) as education_density
		,sum(poverty_incidence * population) / sum(population) as poverty_incidence
		,sum(sanitation * population) / sum(population) as sanitation
		,sum(piped_water * population) / sum(population) as piped_water
		--ADD NEW LEVEL3-VARIABLES HERE AS WELL
		--ADD NEW LEVEL2-VARIABLES HERE AS WELL
	from "PER_datamodel"."Indicators_2_TOTAL_temp"
	group by 1
	) level2
	on t0.pcode_level1 = level2.pcode_parent
left join "PER_datamodel"."Indicators_1_walltype" 		t1	on t0.pcode_level1 = t1.pcode_level1
left join "PER_datamodel"."Indicators_1_rooftype" 		t2	on t0.pcode_level1 = t2.pcode_level1
left join "PER_datamodel"."Indicators_1_services" 		t3	on t0.pcode_level1 = t3.pcode_level1
--left join "PER_datamodel"."Indicators_1_XXX" 			tX	on t0.pcode_level1 = tX.pcode_level1
;
--select * from "PER_datamodel"."Indicators_1_TOTAL_temp"



----------------------------------
-- 2.1: Calculate INFORM-scores --
----------------------------------

--WATCH OUT: Upload latest metadata-table (CSV) first!

--calculate INFORM-scores at lowest level:level2
select usp_inform('PER',3);
select usp_inform('PER',2);
select usp_inform('PER',1);

--ALTER TABLE "PER_datamodel"."total_scores_level2" DROP COLUMN risk_score, DROP COLUMN vulnerability_score, DROP COLUMN hazard_score, DROP COLUMN coping_capacity_score;
--select * from "PER_datamodel"."total_scores_level1"


--select usp_inform('BEN',1);
--ALTER TABLE "PER_datamodel"."total_scores_level1" DROP COLUMN risk_score, DROP COLUMN vulnerability_score, DROP COLUMN hazard_score, DROP COLUMN coping_capacity_score;
--select * from "PER_datamodel"."total_scores_level1"

--ADD risk scores to Indicators_TOTAL table
drop table if exists "PER_datamodel"."Indicators_3_TOTAL";
select *
into "PER_datamodel"."Indicators_3_TOTAL"
from "PER_datamodel"."Indicators_3_TOTAL_temp" t0
left join "PER_datamodel"."total_scores_level3" t1
on t0.pcode = t1.pcode_level3
;
--select * from "PER_datamodel"."Indicators_3_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "PER_datamodel"."Indicators_2_TOTAL";
select *
into "PER_datamodel"."Indicators_2_TOTAL"
from "PER_datamodel"."Indicators_2_TOTAL_temp" t0
left join "PER_datamodel"."total_scores_level2" t1
on t0.pcode = t1.pcode_level2
;
--select * from "PER_datamodel"."Indicators_2_TOTAL" 

--ADD risk scores to Indicators_TOTAL table
drop table if exists "PER_datamodel"."Indicators_1_TOTAL";
select *
into "PER_datamodel"."Indicators_1_TOTAL"
from "PER_datamodel"."Indicators_1_TOTAL_temp" t0
left join "PER_datamodel"."total_scores_level1" t1
on t0.pcode = t1.pcode_level1
;
--select * from "PER_datamodel"."Indicators_1_TOTAL"




