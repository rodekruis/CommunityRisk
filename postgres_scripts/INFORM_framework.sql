
drop table if exists metadata."DPI_scores";
with 
DPI as (
SELECT t1.*
	,t2.admin_level
	,country_code
	,year, retention_period, source_quality
FROM metadata."INFORM_framework" t1
JOIN metadata."admin_level" t2 ON 1=1
JOIN metadata."DPI_metadata" t3	ON t1.id_overall = t3.id_overall and t3.admin_level >= t2.admin_level
)
--select * from DPI
,DPI_unnest as (
SELECT *
FROM   DPI t, unnest(string_to_array(t.country_code, ',')) s(country)
)
--select * from DPI_unnest
,DPI_agg as (
select country as country_code
	,admin_level
	,id_overall
	,weight_overall
	,max(case when country is null then 0 else 1 end) as complete_ind
	,avg(cast(year as numeric)) as year_source
	,avg(retention_period) as retention_period
	,avg(source_quality)as source_quality
from DPI_unnest
group by 1,2,3,4
)
--select * from DPI_agg
, DPI_scores as (
select country_code
	,admin_level
	,id_overall
	,weight_overall * complete_ind as completeness_score
	,weight_overall * (case when retention_period > 10 then 10 else retention_period end 
				+ case when (10 - (date_part('year',CURRENT_DATE) - year_source)) < 0 then 0 else (10 - (date_part('year',CURRENT_DATE) - year_source)) end) 
				/ (2*10) as recency_score
	,weight_overall * source_quality/5 as quality_score
from DPI_agg
)
--select * from DPI_scores
select *
	,completeness_score * recency_score * quality_score as dpi_score
into metadata."DPI_scores"
from (
select country_code
	,admin_level
	,sum(completeness_score) as completeness_score
	,sum(recency_score) / sum(completeness_score) as recency_score
	,sum(quality_score) / sum(completeness_score) as quality_score
from DPI_scores
group by 1,2
order by 1,2
) final
;












