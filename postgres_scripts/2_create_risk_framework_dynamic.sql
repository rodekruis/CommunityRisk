
------------------
-- TESTTESTEST ---
------------------

drop table if exists public.dpi_vars;
select 'MW' as country
	,2 as admin_level
	,t0.group
	,t0.variable
into public.dpi_vars
from metadata."DPI_metadata" t0
inner join (
	select *
	from information_schema.columns 
	where table_schema = 'MW_datamodel' and table_name = 'Indicators_2_TOTAL'
	) t1
	on t0.variable = t1.column_name
where t0.country_code like '%MW%' and t0.group in ('hazard','vulnerability','coping')
;
--select * from public.dpi_vars





--Function that first determines all available risk-indicators per country/admin-level (dpi_vars) ..
-- .. and then calculates a 0-10 score for each area for each indicator ..
-- .. and stores this in a table

DROP FUNCTION IF EXISTS test_dpi(varchar,int);
CREATE OR REPLACE FUNCTION test_dpi(country varchar, admin_level int) RETURNS VOID AS $$
DECLARE 
    country TEXT;
    r RECORD;
    sql TEXT;
BEGIN

    FOR r IN
    EXECUTE 'select t0.group
			,t0.variable
		from metadata."DPI_metadata" t0
		inner join (
			select *
			from information_schema.columns 
			where table_schema = ''' || $1 ||'_datamodel'' and table_name = ''Indicators_' || $2 || '_TOTAL''
			) t1
			on t0.variable = t1.column_name
		where t0.country_code like ''%' || $1 || '%'' and t0.group in (''hazard'',''vulnerability'',''coping'')'
    LOOP

	sql := ('CREATE TABLE "' || $1 || '_datamodel".score_' || $1 || '_' || $2 || '_' || r.variable || ' AS 
		with ' || r.variable || ' as (
			select t0.pcode_level' || $2 || ' 
				,' || r.variable || '
			from "' || $1 || '_datamodel"."Geo_level' || $2 || '" t0
			left join "' || $1 || '_datamodel"."Indicators_' || $2 || '_TOTAL" t1 on t0.pcode_level' || $2 || ' = t1.pcode
			),
		' || r.variable || '_minmax as (
			select min(' || r.variable || ') as min
				,max(' || r.variable || ') as max
			from ' || r.variable || '
			)
		select t0.*
			,(cast((max - ' || r.variable || ') as numeric) / cast((max - min) as numeric)) * 10 as ' || r.variable || '_score
		from ' || r.variable || ' t0
		join ' || r.variable || '_minmax t1 on 1=1
		
		;');
	RAISE NOTICE '%', sql;


	EXECUTE sql;
	
    END LOOP;

END;
$$ LANGUAGE plpgsql STRICT;
--select test_dpi('MW',2)
--select test_dpi('MW',3)
--select test_dpi('MW',4)



DROP FUNCTION IF EXISTS test_dpi2(varchar,int,varchar);
CREATE OR REPLACE FUNCTION test_dpi2(country varchar, admin_level int, group_var varchar) RETURNS VOID AS $$
DECLARE 
    r RECORD;
    sql_main1 TEXT;
    sql_main2 TEXT;
    sql_main3 TEXT;
    sql_main4 TEXT;
    sql1 TEXT = '';
    sql2 TEXT = '';
    sql3 TEXT = '';
    sql4 TEXT = '';
BEGIN

    FOR r IN
    EXECUTE 'select t0.group
			,t0.variable
		from metadata."DPI_metadata" t0
		inner join (
			select *
			from information_schema.columns 
			where table_schema = ''' || $1 ||'_datamodel'' and table_name = ''Indicators_' || $2 || '_TOTAL''
			) t1
			on t0.variable = t1.column_name
		where t0.country_code like ''%' || $1 || '%'' and t0.group in (''' || $3 || ''')'
    LOOP

	sql_main1 := ('CREATE TABLE "' || $1 || '_datamodel".scores_' || $3 || '_' || $2 || ' AS
			SELECT t0.pcode_level' || $2 || ' ');
	sql1 := sql1 || ',' || r.variable || ',' || r.variable || '_score ';
	sql_main2 := ',(10 - power(1 ';
	sql2 := sql2 || '* coalesce((10-' || r.variable || '_score)/10*9+1,1) ';
	sql_main3 := ',cast(1 as float)/cast(( 0 ';
	sql3 := sql3 || '+ case when ' || r.variable || '_score is null then 0 else 1 end '; 
	sql_main4 := ')as float)))/9*10 as ' || $3 || '_score FROM "' || $1 || '_datamodel"."Geo_level' || $2 || '" t0 ';
	sql4 := sql4 || 'left join "' || $1 || '_datamodel".score_' || $1 || '_' || $2 || '_' || r.variable || ' ' || r.variable || ' on t0.pcode_level' || $2 || ' = ' || r.variable || '.pcode_level' || $2 || ' ' ;
			
    END LOOP;

    EXECUTE 'DROP TABLE IF EXISTS "' || $1 || '_datamodel".scores_' || $3 || '_' || $2;
    EXECUTE sql_main1 || sql1 || sql_main2 || sql2 || sql_main3 || sql3 || sql_main4 || sql4;

END;
$$ LANGUAGE plpgsql STRICT;

select test_dpi2('MW',3,'hazard')
select test_dpi2('MW',3,'vulnerability')
select test_dpi2('MW',3,'coping')














--Function to quickly drop many tables
CREATE OR REPLACE FUNCTION footgun(IN _schema TEXT, IN _parttionbase TEXT) 
RETURNS void 
LANGUAGE plpgsql
AS
$$
DECLARE
    row     record;
BEGIN
    FOR row IN 
        SELECT
            table_schema,
            table_name
        FROM
            information_schema.tables
        WHERE
            table_type = 'BASE TABLE'
        AND
            table_schema = _schema
        AND
            table_name ILIKE (_parttionbase || '%')
    LOOP
        EXECUTE 'DROP TABLE ' || quote_ident(row.table_schema) || '.' || quote_ident(row.table_name);
        RAISE INFO 'Dropped table: %', quote_ident(row.table_schema) || '.' || quote_ident(row.table_name);
    END LOOP;
END;
$$;

--SELECT footgun('public', 'test_');

CREATE OR REPLACE FUNCTION footgun(IN _schema TEXT, IN _parttionbase TEXT) 
RETURNS void 
LANGUAGE plpgsql
AS
$$
DECLARE
    row     record;
BEGIN
    FOR row IN 
        SELECT
            table_schema,
            table_name
        FROM
            information_schema.tables
        WHERE
            table_type = 'BASE TABLE'
        AND
            table_schema = _schema
        AND
            table_name ILIKE (_parttionbase || '%')
    LOOP
        --EXECUTE 'DROP TABLE ' || quote_ident(row.table_schema) || '.' || quote_ident(row.table_name);
        EXECUTE 'SELECT *
		FROM 
        RAISE INFO 'Dropped table: %', quote_ident(row.table_schema) || '.' || quote_ident(row.table_name);
    END LOOP;
END;
$$;

--SELECT footgun('MW_datamodel', 'score_mw_3_');