
--select * FROM ph_source."PI_input" where typhoon_name = 'Haima'

drop table if exists "PH_datamodel"."PI_Typhoon_input_damage";
select 'Typhoon' as disaster_type
	,t1.typhoon_name as disaster_name
	,"Mun_Code" as pcode
	--damage variables absolute
	, comp_damage_houses, part_damage_houses, total_damage_houses, total_damage_houses_0p25weight
	--damage variables relative (NOTE: made relative by dividing by (population/4) )
	, part_damage_houses_perc--/100 as part_damage_houses_perc
	, comp_damage_houses_perc--/100 as comp_damage_houses_perc
	, total_damage_houses_perc--/100 as total_damage_houses_perc
	, total_damage_houses_0p25weight_perc--/100 as total_damage_houses_0p25weight_perc
	, ratio_comp_part--/100 as ratio_comp_part
	, total_damage_houses / (total_damage_houses_perc/100) as total_houses
	--event-specific input
	, average_speed_mph, distance_typhoon_km, "Rainfallme" as rainfall, distance_first_impact / 1000 as distance_first_impact
	--geographic input
	, mean_slope, mean_elevation_m, ruggedness_stdev, mean_ruggedness, slope_stdev
	--prediction (errors)
	, t2.weighted_damage_pred,t2.perc_pred--/100 as perc_pred
	, total_damage_houses_0p25weight_perc - t2.perc_pred as pred_error_point_diff
	, t3.population,t3.land_area
INTO "PH_datamodel"."PI_Typhoon_input_damage"
FROM ph_source."PI_typhoon_training_data" t1
LEFT JOIN (
	select typhoon_name
		,"M_Code" as pcode
		,weighted_damage_pred
	--	,weighted_damage_true
		,perc_pred
	--	,perc_true
	FROM ph_source."PI_typhoon_Haima_damage"
	union all
	select typhoon_name
		,"M_Code" as pcode
		,num_total_damage_houses_0p25weight_perc_pred
		,total_damage_houses_0p25weight_perc_pred
	FROM ph_source."PI_typhoon_Nina_damage"
	) t2
	ON t1.typhoon_name = t2.typhoon_name and t1."Mun_Code" = t2.pcode
LEFT JOIN "PH_datamodel"."Indicators_3_TOTAL" t3
	ON t1."Mun_Code" = t3.pcode
;

drop table if exists "PH_datamodel"."PI_Earthquake_input_damage";
select t1.*
	,t2.population / 4 as total_houses
	,t2.population
	,t2.land_area
into "PH_datamodel"."PI_Earthquake_input_damage"
from (
	select cast('Earthquake' as varchar) as disaster_type
		,cast('Leyte 2017' as varchar) as disaster_name
		,"Mun_Code" as pcode
		,predicted_totals as total_damage_houses_pred
		,predicted_totals_as_perc as total_damage_houses_perc_pred
		,cast(null as numeric) as comp_damage_houses
		,cast(null as numeric) as part_damage_houses
		,cast(null as numeric) as total_damage_houses
		,cast(null as numeric) as total_damage_houses_perc 
		,"MMI" as mmi
		,"Slope" as mean_slope
	from ph_source."PI_earthquake_Leyte_damage"
	union all
	select cast('Earthquake' as varchar) as disaster_type
		,cast("Earthquake" as varchar) as disaster_name
		,"PCODE" as pcode
		,null as total_damage_houses_pred
		,null as total_damage_houses_perc_pred
		,"Completely_damaged_houses" as comp_damage_houses
		,"Partially_damaged_houses" as part_damage_houses
		,"Total" as total_damage_houses
		,"Total_as_Percentage" * 4 as total_damage_houses_perc
		,"MMI" as mmi
		,"Slope" as mean_slope	
	from ph_source."PI_earthquake_training_data"
	where "Earthquake" not in ('Gorhka 2015','Sarangani 2017')
	) t1
LEFT JOIN "PH_datamodel"."Indicators_3_TOTAL" t2
	ON t1.pcode = t2.pcode



