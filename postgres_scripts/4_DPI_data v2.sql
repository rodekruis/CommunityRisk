

drop table if exists metadata.DPI_sourcelevel;
with 
DPI as (
SELECT t1.*
	,t2.admin_level
	,country_code
	,year, retention_period, source_quality
	,label
	,source_link
FROM metadata."INFORM_framework" t1
JOIN metadata."admin_level" t2 ON 1=1
JOIN metadata."DPI_metadata" t3	ON t1.id_overall = t3.id_overall and t3.admin_level = t2.admin_level
)
--select * from DPI
,DPI_unnest as (
SELECT *
FROM   DPI t, unnest(string_to_array(t.country_code, ',')) s(country)
)
select id_level1,inform_level1,weight1,id_level2,inform_level2,weight2,id_level3,inform_level3,weight3
	,id_overall,weight_overall,admin_level
	,year,retention_period,source_quality,label,source_link
	,country as country_code
into metadata.DPI_sourcelevel
from DPI_unnest
;
--select * from metadata.DPI_sourcelevel

--PSQL
--Copy metadata.DPI_sourcelevel To 'C:/github/CRA-data-dashboard/data/CRA_metadata.csv' With CSV DELIMITER ';' HEADER;



select * from metadata."INFORM_framework"

drop table if exists metadata.DPI_sourcelevel_complete;
with country_admin as (
SELECT country_code
	,country_name
	, cast(zoomlevel_min as varchar)
	 || case when zoomlevel_min + 1 <= zoomlevel_max then cast(',' || zoomlevel_min + 1 as varchar) else '' end
	 || case when zoomlevel_min + 2 <= zoomlevel_max then cast(',' || zoomlevel_min + 2 as varchar) else '' end as levels
FROM metadata."DPI_country_metadata"
where country_code <> 'INFORM'
)
, country_admin_unnest as (
select country_code,country_name,cast(admin_level as int) as admin_level
FROM country_admin t, unnest(string_to_array(t.levels, ',')) s(admin_level)
)
--select * from country_admin_unnest
, DPI as (
SELECT t12.*
	,year, retention_period, source_quality
	,label
	,source_link
FROM (select *
	FROM metadata."INFORM_framework_COD" t1
	JOIN country_admin_unnest t2 ON 1=1
	) t12
LEFT JOIN metadata."DPI_metadata" t3	
	ON t12.id_overall = t3.id_overall 
	--and t12.admin_level = t3.admin_level
	and ((t12.admin_level <= t3.admin_level and t3.id_overall <> '0.1.1') or (t12.admin_level = t3.admin_level and t3.id_overall = '0.1.1'))
	and t3.country_code like '%' || t12.country_code || '%'
)
select id_level1,inform_level1,weight1,id_level2,inform_level2,weight2,id_level3,inform_level3,weight3
	,id_overall,weight_overall,admin_level
	,year,retention_period,source_quality,label as variable,source_link
	,country_code,country_name
into metadata.DPI_sourcelevel_complete
from DPI 
--order by country_code,admin_level,id_overall
;


--PSQL
Copy metadata.DPI_sourcelevel_complete To 'C:/github/CRA-data-dashboard/data/CRA_metadata.csv' With CSV DELIMITER ';' HEADER;








