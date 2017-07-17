
		
------------------------------------------
-- Create stored procedures for Geodata --
------------------------------------------

--Get all level 1 geodata
DROP FUNCTION IF EXISTS usp_geo_level1(varchar);
CREATE OR REPLACE FUNCTION usp_geo_level1(country varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('
		SELECT row_to_json(featcoll)
		FROM (
			SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
			FROM (
				SELECT ''Feature'' As type
					,ST_AsGeoJSON(tbl.geom)::json As geometry
					,row_to_json((SELECT l FROM (SELECT pcode_level1 as pcode,name) As l)) As properties
				FROM "%s_datamodel"."Geo_level1" As tbL
				)  As feat 
			)  As featcoll
		;',country)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level1('PH');

--Get all level 2 geodata
DROP FUNCTION IF EXISTS usp_geo_level2(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_geo_level2(country varchar,pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('
		SELECT row_to_json(featcoll)
		FROM (
			SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
			FROM (
				SELECT ''Feature'' As type
					,ST_AsGeoJSON(tbl.geom)::json As geometry
					,row_to_json((SELECT l FROM (SELECT pcode_level2 as pcode,name) As l)) As properties
				FROM "%s_datamodel"."Geo_level2" As tbL
				WHERE cast(pcode_level1 as varchar) = ''%s'' OR (CASE WHEN ''%s'' = '''' THEN 0 END = 0)
				)  As feat 
			)  As featcoll
		;',country,pcode,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level2('MLI','ML09');

--Get all level 3 geodata
DROP FUNCTION IF EXISTS usp_geo_level3(varchar);
CREATE OR REPLACE FUNCTION usp_geo_level3(country varchar, pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('
		SELECT row_to_json(featcoll)
		FROM (
			SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
			FROM (
				SELECT ''Feature'' As type
					,ST_AsGeoJSON(tbl.geom)::json As geometry
					,row_to_json((SELECT l FROM (SELECT pcode_level3 as pcode,name,pcode_level2 as pcode_parent) As l)) As properties
				FROM "%s_datamodel"."Geo_level3" As tbL
				WHERE cast(pcode_level2 as varchar) = ''%s'' OR (CASE WHEN ''%s'' = '''' THEN 0 END = 0)
				)  As feat 
			)  As featcoll
		;',country,pcode,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level3('PH','AFRMWI101')

--Get all level4 geodata
DROP FUNCTION IF EXISTS usp_geo_level4(varchar);
CREATE OR REPLACE FUNCTION usp_geo_level4(country varchar, pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('
		SELECT row_to_json(featcoll)
		FROM (
			SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
			FROM (
				SELECT ''Feature'' As type
					,ST_AsGeoJSON(tbl.geom)::json As geometry
					,row_to_json((SELECT l FROM (SELECT pcode_level4 as pcode,name,pcode_level3 as pcode_parent) As l)) As properties
				FROM "%s_datamodel"."Geo_level4" As tbL
				WHERE cast(pcode_level3 as varchar) = ''%s'' OR (CASE WHEN ''%s'' = '''' THEN 0 END = 0)
				)  As feat 
			)  As featcoll
		;',country,pcode,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level4('MW','AFRMWI10105')

--NEW: Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS usp_geo(int,varchar,varchar);
CREATE OR REPLACE FUNCTION usp_geo(state int,country varchar,pcode varchar) RETURNS json AS $$

	SELECT CASE 
		WHEN $1 = 1 THEN usp_geo_level1($2)
		WHEN $1 = 2 THEN usp_geo_level2($2,$3)
		WHEN $1 = 3 THEN usp_geo_level3($2,$3)
		WHEN $1 = 4 THEN usp_geo_level4($2,$3)
		END
	;	

$$ LANGUAGE sql;
--select usp_geo(2,'MLI','ML09')


---------------------------------------------
-- Create stored procedures for Indicators --
---------------------------------------------

--Function for getting indicator data (municipality)
DROP FUNCTION IF EXISTS usp_ind_level4(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind_level4(country varchar,pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level4))
			from (
			select *
			from "%s_datamodel"."Indicators_4_TOTAL" 
			where cast(pcode_parent as varchar) = ''%s'' OR (CASE WHEN ''%s'' = '''' THEN 0 END = 0)
			) level4;',country,pcode,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level4('MW','AFRMWI10105')

DROP FUNCTION IF EXISTS usp_ind_level3(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind_level3(country varchar,pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level3))
			from (
			select *
			from "%s_datamodel"."Indicators_3_TOTAL"  t1
			where cast(pcode_parent as varchar) = ''%s'' OR (CASE WHEN ''%s'' = '''' THEN 0 END = 0)
			) level3;',country,pcode,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level3('PH','PH051700000')

DROP FUNCTION IF EXISTS usp_ind_level2(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind_level2(country varchar, pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level2))
			from (
			select *
			from "%s_datamodel"."Indicators_2_TOTAL" t1
			where cast(pcode_parent as varchar) = ''%s'' OR (CASE WHEN ''%s'' = '''' THEN 0 END = 0)
			) level2;',country,pcode,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level2('LKA')

DROP FUNCTION IF EXISTS usp_ind_level1(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind_level1(country varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level1))
			from (
			select *
			from "%s_datamodel"."Indicators_1_TOTAL" t1
			) level1;',country)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level1('NP')


--Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS usp_ind(int,varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind(state int,country varchar,pcode varchar) RETURNS json AS $$

	SELECT CASE 
		WHEN $1 = 1 THEN usp_ind_level1($2)
		WHEN $1 = 2 THEN usp_ind_level2($2,$3)
		WHEN $1 = 3 THEN usp_ind_level3($2,$3)
		WHEN $1 = 4 THEN usp_ind_level4($2,$3)
		END		
	;	

$$ LANGUAGE sql;
--SELECT usp_ind(2,'PH','');



--------------------------------------------------
-- Get Priority Index data --
--------------------------------------------------

DROP FUNCTION IF EXISTS usp_pi_level3(varchar,varchar,varchar);
CREATE OR REPLACE FUNCTION usp_pi_level3(country varchar,disaster_type varchar,disaster_name varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level3))
			from (
			select *
			from "%s_datamodel"."PI_%s_input_damage"  t1
			where disaster_name = ''%s''
			) level3;',country,disaster_type,disaster_name)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_pi_level3('PH','Typhoon','Haima')

--------------------------------------------------
-- Get Data Preparedness Index data --
--------------------------------------------------

DROP FUNCTION IF EXISTS usp_dpi(varchar,int);
CREATE OR REPLACE FUNCTION usp_dpi(country varchar, adminlevel int, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(dpi))
			from (

			select * 
			from metadata."DPI_scores"
			where country_code = ''%s'' and admin_level = ''%s''
			
			) dpi;',country,adminlevel)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_dpi('PH',2);


--------------------------------
-- Combine all data in 1 JSON --
--------------------------------

CREATE OR REPLACE FUNCTION usp_data(state int,country varchar,pcode varchar,pi_cra varchar,disaster_type varchar,disaster_name varchar) RETURNS json AS $$

	SELECT row_to_json(data)
	FROM (
	SELECT (CASE 
		WHEN $4 = 'PI' THEN usp_pi_level3($2,$5,$6)
		WHEN $4 = 'CRA' THEN usp_ind($1,$2,$3) 
		END) as ind
		, usp_geo($1,$2,$3) as geo
		, usp_dpi($2,$1) as dpi
	) data

	;
$$ LANGUAGE sql;

--select usp_data(2,'LKA','','CRA','Earthquake','Leyte 2017');



