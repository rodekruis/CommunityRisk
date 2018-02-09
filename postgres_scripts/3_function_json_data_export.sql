
		
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
					,row_to_json((SELECT l FROM (SELECT tbl.name,tbl2.*) As l)) As properties
				FROM "%s_datamodel"."Geo_level1" As tbL
				LEFT JOIN "%s_datamodel"."Indicators_1_TOTAL" tbl2 on tbL.pcode_level1 = tbl2.pcode
				)  As feat 
			)  As featcoll
		;',country,country)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level1('PER');

--Get all level 2 geodata
DROP FUNCTION IF EXISTS usp_geo_level2(varchar,text[]);
CREATE OR REPLACE FUNCTION usp_geo_level2(country varchar,pcode text[], OUT result json) AS $func$
	BEGIN
	IF pcode = '{}' THEN 
		EXECUTE format('
			SELECT row_to_json(featcoll)
			FROM (
				SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
				FROM (
					SELECT ''Feature'' As type
						,ST_AsGeoJSON(tbl.geom)::json As geometry
						,row_to_json((SELECT l FROM (SELECT name,tbl2.*) As l)) As properties
					FROM "%s_datamodel"."Geo_level2" As tbL
					LEFT JOIN "%s_datamodel"."Indicators_2_TOTAL" tbl2 on tbL.pcode_level2 = tbl2.pcode
					)  As feat 
				)  As featcoll
			;',country,country)
		INTO result;
	ELSE 
		EXECUTE format('
			SELECT row_to_json(featcoll)
			FROM (
				SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
				FROM (
					SELECT ''Feature'' As type
						,ST_AsGeoJSON(tbl.geom)::json As geometry
						,row_to_json((SELECT l FROM (SELECT name,tbl2.*) As l)) As properties
					FROM "%s_datamodel"."Geo_level2" As tbL
					LEFT JOIN "%s_datamodel"."Indicators_2_TOTAL" tbl2 on tbL.pcode_level2 = tbl2.pcode
					WHERE cast(pcode_level1 as varchar) = ANY(''%s'')
					)  As feat 
				)  As featcoll
			;',country,country,pcode,pcode)
		INTO result;
	END IF;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level2('MLI',['ML09']);

--Get all level 3 geodata
DROP FUNCTION IF EXISTS usp_geo_level3(varchar,text[]);
CREATE OR REPLACE FUNCTION usp_geo_level3(country varchar, pcode text[], OUT result json) AS $func$
	BEGIN
		IF pcode = '{}' THEN
		EXECUTE format('
			SELECT row_to_json(featcoll)
			FROM (
				SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
				FROM (
					SELECT ''Feature'' As type
						,ST_AsGeoJSON(tbl.geom)::json As geometry
						,row_to_json((SELECT l FROM (SELECT name,tbl2.*) As l)) As properties
					FROM "%s_datamodel"."Geo_level3" As tbL
					LEFT JOIN "%s_datamodel"."Indicators_3_TOTAL" tbl2 on tbL.pcode_level3 = tbl2.pcode
					)  As feat 
				)  As featcoll
			;',country,country)
		INTO result;
	ELSE 
		EXECUTE format('
			SELECT row_to_json(featcoll)
			FROM (
				SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
				FROM (
					SELECT ''Feature'' As type
						,ST_AsGeoJSON(tbl.geom)::json As geometry
						,row_to_json((SELECT l FROM (SELECT name,tbl2.*) As l)) As properties
					FROM "%s_datamodel"."Geo_level3" As tbL
					LEFT JOIN "%s_datamodel"."Indicators_3_TOTAL" tbl2 on tbL.pcode_level3 = tbl2.pcode
					WHERE cast(pcode_level2 as varchar) = ANY(''%s'')
					)  As feat 
				)  As featcoll
			;',country,country,pcode)
		INTO result;
	END IF;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level3('MW','{AFRMWI208,AFRMWI207}')

--Get all level4 geodata
DROP FUNCTION IF EXISTS usp_geo_level4(varchar,text[]);
CREATE OR REPLACE FUNCTION usp_geo_level4(country varchar, pcode text[], OUT result json) AS $func$
	BEGIN
	IF pcode = '{}' THEN 
		EXECUTE format('
			SELECT row_to_json(featcoll)
			FROM (
				SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
				FROM (
					SELECT ''Feature'' As type
						,ST_AsGeoJSON(tbl.geom)::json As geometry
						,row_to_json((SELECT l FROM (SELECT name,tbl2.*) As l)) As properties
					FROM "%s_datamodel"."Geo_level4" As tbL
					LEFT JOIN "%s_datamodel"."Indicators_4_TOTAL" tbl2 on tbL.pcode_level4 = tbl2.pcode
					)  As feat 
				)  As featcoll
			;',country,country)
		INTO result;
	ELSE 
		EXECUTE format('
			SELECT row_to_json(featcoll)
			FROM (
				SELECT ''FeatureCollection'' As type, array_to_json(array_agg(feat)) As features
				FROM (
					SELECT ''Feature'' As type
						,ST_AsGeoJSON(tbl.geom)::json As geometry
						,row_to_json((SELECT l FROM (SELECT name,tbl2.*) As l)) As properties
					FROM "%s_datamodel"."Geo_level4" As tbL
					LEFT JOIN "%s_datamodel"."Indicators_4_TOTAL" tbl2 on tbL.pcode_level4 = tbl2.pcode
					WHERE cast(pcode_level3 as varchar) = ANY(''%s'')
					)  As feat 
				)  As featcoll
			;',country,country,pcode)
		INTO result;
	END IF;
	END
$func$ LANGUAGE plpgsql;
--select usp_geo_level4('MW','{}')

--NEW: Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS usp_geo(int,varchar,text[]);
CREATE OR REPLACE FUNCTION usp_geo(state int,country varchar,pcode text[] ) RETURNS json AS $$

	SELECT CASE 
		WHEN $1 = 1 THEN usp_geo_level1($2)
		WHEN $1 = 2 THEN usp_geo_level2($2,$3)
		WHEN $1 = 3 THEN usp_geo_level3($2,$3)
		WHEN $1 = 4 THEN usp_geo_level4($2,$3)
		END
	;	

$$ LANGUAGE sql;
--select usp_geo(4,'MW','{}')


---------------------------------------------
-- Create stored procedures for Indicators --
---------------------------------------------

--Function for getting indicator data (municipality)
DROP FUNCTION IF EXISTS usp_ind_level4(varchar,text[]);
CREATE OR REPLACE FUNCTION usp_ind_level4(country varchar,pcode text[], OUT result json) AS $func$
	BEGIN
	IF pcode = '{}' THEN 
		EXECUTE format('select array_to_json(array_agg(level4))
				from (
				select *
				from "%s_datamodel"."Indicators_4_TOTAL" 
				) level4;',country)
		INTO result;
	ELSE 
		EXECUTE format('select array_to_json(array_agg(level4))
				from (
				select *
				from "%s_datamodel"."Indicators_4_TOTAL" 
				where cast(pcode_parent as varchar) = ANY(''%s'')
				) level4;',country,pcode)
		INTO result;
	END IF;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level4('MW','AFRMWI10105')

DROP FUNCTION IF EXISTS usp_ind_level3(varchar,text[]);
CREATE OR REPLACE FUNCTION usp_ind_level3(country varchar,pcode text[], OUT result json) AS $func$
	BEGIN
	IF pcode = '{}' THEN
		EXECUTE format('select array_to_json(array_agg(level3))
				from (
				select *
				from "%s_datamodel"."Indicators_3_TOTAL"  t1
				) level3;',country)
		INTO result;
	ELSE 
		EXECUTE format('select array_to_json(array_agg(level3))
				from (
				select *
				from "%s_datamodel"."Indicators_3_TOTAL"  t1
				where cast(pcode_parent as varchar) = ANY(''%s'')
				) level3;',country,pcode,pcode)
		INTO result;
	END IF;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level3('PH','''PH023100000''')

--select pcode_parent from "PH_datamodel"."Indicators_3_TOTAL"

DROP FUNCTION IF EXISTS usp_ind_level2(varchar,text[]);
CREATE OR REPLACE FUNCTION usp_ind_level2(country varchar, pcode text[], OUT result json) AS $func$
	BEGIN
	IF pcode = '{}' THEN 
		EXECUTE format('select array_to_json(array_agg(level2))
				from (
				select *
				from "%s_datamodel"."Indicators_2_TOTAL" t1
				) level2;',country)
		INTO result;
	ELSE 
		EXECUTE format('select array_to_json(array_agg(level2))
				from (
				select *
				from "%s_datamodel"."Indicators_2_TOTAL" t1
				where cast(pcode_parent as varchar) = ANY(''%s'')
				) level2;',country,pcode)
		INTO result;
	END IF;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level2('LKA')

DROP FUNCTION IF EXISTS usp_ind_level1(varchar);
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
--select usp_ind_level1('ZMB')


--Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS usp_ind(int,varchar,text[]);
CREATE OR REPLACE FUNCTION usp_ind(state int,country varchar,pcode text[]) RETURNS json AS $$

	SELECT CASE 
		WHEN $1 = 1 THEN usp_ind_level1($2)
		WHEN $1 = 2 THEN usp_ind_level2($2,$3)
		WHEN $1 = 3 THEN usp_ind_level3($2,$3)
		WHEN $1 = 4 THEN usp_ind_level4($2,$3)
		END		
	;	

$$ LANGUAGE sql;
--SELECT usp_ind(1,'ZMB','{}');


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
--select usp_pi_level3('NP','Earthquake','Gorkha 2015')

--------------------------------------------------
-- Get Data Preparedness Index data --
--------------------------------------------------

DROP FUNCTION IF EXISTS usp_dpi(varchar);
CREATE OR REPLACE FUNCTION usp_dpi(country varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(dpi))
			from (

			select * 
			from metadata."DPI_scores"
			where country_code = ''%s''
			
			) dpi;',country)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_dpi('PH');


--------------------------------
-- Combine all data in 1 JSON --
--------------------------------

DROP FUNCTION IF EXISTS usp_data(int,varchar,text[],varchar,varchar,varchar);
CREATE OR REPLACE FUNCTION usp_data(state int,country varchar,pcode text[],pi_cra varchar,disaster_type varchar,disaster_name varchar) RETURNS json AS $$

	SELECT row_to_json(data)
	FROM (
	SELECT (CASE 
		WHEN $4 = 'PI' THEN usp_pi_level3($2,$5,$6)
		WHEN $4 = 'CRA' THEN usp_ind($1,$2,$3) 
		END) as ind
		, usp_geo($1,$2,$3) as geo
		, usp_dpi($2) as dpi
	) data

	;
$$ LANGUAGE sql;

--select usp_data(4,'MW','{}','CRA','Typhoon','Haima');
--SELECT * FROM pg_proc WHERE proname = 'usp_data';



