
---------------------------------------------
--- CALCULATE INFORM-SCORES AUTOMATICALLY ---
---------------------------------------------

--1: Calculate 0-10 score for each indicator and store in table
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
			,t0.reverse_inform
			,t0.log_inform
		from metadata."DPI_metadata" t0
		inner join (
			select *
			from information_schema.columns 
			where table_schema = ''' || $1 ||'_datamodel'' and table_name = ''Indicators_' || $2 || '_TOTAL_temp''
			) t1
			on t0.variable = t1.column_name
		where t0.country_code like ''%' || $1 || '%'' and t0.group in (''hazard'',''vulnerability'',''coping_capacity'')'
    LOOP

	sql := ('DROP TABLE IF EXISTS "' || $1 || '_datamodel".score_' || $1 || '_' || $2 || '_' || r.variable || ';
		CREATE TABLE "' || $1 || '_datamodel".score_' || $1 || '_' || $2 || '_' || r.variable || ' AS 
		with ' || r.variable || ' as (
			select t0.pcode_level' || $2 || ' 
				,' || case when r.log_inform=1 then 'log(0.1+' || r.variable || ') ' else '' end || r.variable || '
			from "' || $1 || '_datamodel"."Geo_level' || $2 || '" t0
			left join "' || $1 || '_datamodel"."Indicators_' || $2 || '_TOTAL_temp" t1 on t0.pcode_level' || $2 || ' = t1.pcode
			),
		' || r.variable || '_minmax as (
			select min(' || r.variable || ') as min
				,max(' || r.variable || ') as max
			from ' || r.variable || '
			)
		select t0.*
			,(cast((' || case when r.reverse_inform = 1 then 'max - ' || r.variable else r.variable || ' - min' end || ') as numeric) / cast((max - min) as numeric)) * 10 as ' || r.variable || '_score
		from ' || r.variable || ' t0
		join ' || r.variable || '_minmax t1 on 1=1
		
		;');
	RAISE NOTICE '%', sql;


	EXECUTE sql;
	
    END LOOP;

END;
$$ LANGUAGE plpgsql STRICT;
--select test_dpi('ZMB',2)
--select test_dpi('PH',4)
--select test_dpi('MW',4)

--2: Calculate main component-scores and create table per main component
DROP FUNCTION IF EXISTS test_dpi2(varchar,int,varchar);
CREATE OR REPLACE FUNCTION test_dpi2(country varchar, admin_level int, group_var varchar) RETURNS VOID AS $$
DECLARE 
    r RECORD;
    sql TEXT;
    sql_alt TEXT;
    sql_main1 TEXT;
    sql_main2 TEXT;
    sql_main3 TEXT;
    sql_main4 TEXT;
    sql_main5 TEXT;
    sql1 TEXT = '';
    sql2 TEXT = '';
    sql3 TEXT = '';
    sql4 TEXT = '';
    sql5 TEXT = '';
BEGIN

    FOR r IN
    EXECUTE 'select t0.group
			,t0.variable
		from metadata."DPI_metadata" t0
		inner join (
			select *
			from information_schema.columns 
			where table_schema = ''' || $1 ||'_datamodel'' and table_name = ''Indicators_' || $2 || '_TOTAL_temp''
			) t1
			on t0.variable = t1.column_name
		where t0.country_code like ''%' || $1 || '%'' and t0.group in (''' || $3 || ''')'
    LOOP

	sql_main1 := ('CREATE TABLE "' || $1 || '_datamodel".scores_' || $3 || '_' || $2 || ' AS
			SELECT t0.pcode_level' || $2 || ' ');
	sql1 := sql1 || ',' || r.variable || '_score ';
	sql_main2 := ', case when 1=1 ';
	sql2 := sql2 || 'AND ' || r.variable || ' is null ';
	sql_main3 := 'then null else (10 - power(1 ';
	sql3 := sql3 || '* coalesce((10-' || r.variable || '_score)/10*9+1,1) ';
	sql_main4 := ',cast(1 as float)/cast(( 0 ';
	sql4 := sql4 || '+ case when ' || r.variable || '_score is null then 0 else 1 end '; 
	sql_main5 := ')as float)))/9*10 end as ' || $3 || '_score FROM "' || $1 || '_datamodel"."Geo_level' || $2 || '" t0 ';
	sql5 := sql5 || 'left join "' || $1 || '_datamodel".score_' || $1 || '_' || $2 || '_' || r.variable || ' ' || r.variable || ' on t0.pcode_level' || $2 || ' = ' || r.variable || '.pcode_level' || $2 || ' ' ;
			
    END LOOP;

    sql := sql_main1 || sql1 || sql_main2 || sql2 || sql_main3 || sql3 || sql_main4 || sql4 || sql_main5 || sql5;
    sql_alt := 'CREATE TABLE "' || $1 || '_datamodel".scores_' || $3 || '_' || $2 || ' AS 
		select cast(null as varchar) as pcode_level' || $2 || ',cast(null as float) as ' || $3 || '_score'; 
	
    
    RAISE NOTICE '%', sql;

    EXECUTE 'DROP TABLE IF EXISTS "' || $1 || '_datamodel".scores_' || $3 || '_' || $2;
    
    IF sql is null THEN
	EXECUTE sql_alt;
    ELSE 
	EXECUTE sql;
    END IF;

END;
$$ LANGUAGE plpgsql STRICT;
--select test_dpi2('PH',4,'hazard');
--select test_dpi2('PH',4,'vulnerability');
--select test_dpi2('PH',4,'coping_capacity');
 
--3: compute risk-score and create Totals out of 3 components table
DROP FUNCTION IF EXISTS test_dpi3(varchar,int);
CREATE OR REPLACE FUNCTION test_dpi3(country varchar, admin_level int) RETURNS VOID AS $$
DECLARE 
    r RECORD;
    sql_main1 TEXT;
    sql_main2 TEXT;
    sql1 TEXT = '';
BEGIN

    FOR r IN
    EXECUTE 'select column_name as variable
		from information_schema.columns 
		where table_schema = ''' || $1 ||'_datamodel'' 
		and table_name in (''scores_coping_capacity_' || $2 || ''',''scores_hazard_' || $2 || ''',''scores_vulnerability_' || $2 || ''')
		and column_name <> ''pcode_level' || $2 || ''''
    LOOP

	sql_main1 := ('CREATE TABLE "' || $1 || '_datamodel".total_scores_level' || $2 || ' AS
			SELECT t0.pcode_level' || $2 || ', ');
	sql1 := sql1 || r.variable || ',' ;
	sql_main2 := '(10 - power(coalesce((10-vulnerability_score)/10*9+1,1)
				* coalesce((10-hazard_score)/10*9+1,1)
				* coalesce((10-coping_capacity_score)/10*9+1,1)
				, cast(1 as float)/cast(3 as float)))/9*10 as risk_score
		from "' || $1 || '_datamodel"."Geo_level' || $2 || '" t0
		left join "' || $1 || '_datamodel"."scores_vulnerability_' || $2 || '" t1 on t0.pcode_level' || $2 || ' = t1.pcode_level' || $2 || ' 
		left join "' || $1 || '_datamodel"."scores_hazard_' || $2 || '" t2 on t0.pcode_level' || $2 || ' = t2.pcode_level' || $2 || ' 
		left join "' || $1 || '_datamodel"."scores_coping_capacity_' || $2 || '" t3 on t0.pcode_level' || $2 || ' = t3.pcode_level' || $2 || ' ';
			
    END LOOP;

    RAISE NOTICE '%', sql_main1 || sql1 || sql_main2;

    EXECUTE 'DROP TABLE IF EXISTS "' || $1 || '_datamodel".total_scores_level' || $2;
    EXECUTE sql_main1 || sql1 || sql_main2;

END;
$$ LANGUAGE plpgsql STRICT;
--select test_dpi3('PH',4)

--4: Combine all above functions in 1 function
DROP FUNCTION IF EXISTS usp_inform(varchar,int);
CREATE OR REPLACE FUNCTION usp_inform(country varchar,state int) RETURNS VOID AS $$
BEGIN

EXECUTE 'select test_dpi(''' || $1 || ''',''' || $2 || ''')';
EXECUTE 'select test_dpi2(''' || $1 || ''',''' || $2 || ''',''hazard'')';
EXECUTE 'select test_dpi2(''' || $1 || ''',''' || $2 || ''',''vulnerability'')';
EXECUTE 'select test_dpi2(''' || $1 || ''',''' || $2 || ''',''coping_capacity'')';
EXECUTE 'select test_dpi3(''' || $1 || ''',''' || $2 || ''')';

END;
$$ LANGUAGE plpgsql STRICT;

--select usp_inform('MW',2);
--select usp_inform('MW',3);
--select usp_inform('MW',4);
--select usp_inform('ZMB',2);
--select usp_inform('NP',2);
--select usp_inform('NP',3);
--select usp_inform('PH',4);


--select * from "NP_datamodel"."total_scores_level3"








