
		
------------------------------------------
-- Create stored procedures for Geodata --
------------------------------------------

--NEW: Get all province geodata
DROP FUNCTION IF EXISTS usp_geo_level2(varchar);
CREATE OR REPLACE FUNCTION usp_geo_level2(country varchar) RETURNS json AS $$

	SELECT row_to_json(featcoll)
	FROM (
		SELECT 'FeatureCollection' As type, array_to_json(array_agg(feat)) As features
		FROM (
			SELECT 'Feature' As type
				,ST_AsGeoJSON(tbl.geom)::json As geometry
				,row_to_json((SELECT l FROM (SELECT pcode_level2 as pcode,name) As l)) As properties
			FROM "tot_datamodel"."Geo_level2" As tbL
			WHERE country_code = $1
			)  As feat 
		)  As featcoll
	; 

$$ LANGUAGE sql;


--NEW: Get all municipality geodata
DROP FUNCTION IF EXISTS usp_geo_level3(varchar);
CREATE OR REPLACE FUNCTION usp_geo_level3(pcode varchar) RETURNS json AS $$

	SELECT row_to_json(featcoll)
	FROM (
		SELECT 'FeatureCollection' As type, array_to_json(array_agg(feat)) As features
		FROM (
			SELECT 'Feature' As type
				,ST_AsGeoJSON(tbl.geom)::json As geometry
				,row_to_json((SELECT l FROM (SELECT pcode_level3 as pcode,name,pcode_level2 as pcode_parent) As l)) As properties
			FROM "tot_datamodel"."Geo_level3" As tbL
			WHERE pcode_level2 = $1
			)  As feat 
		)  As featcoll
	; 

$$ LANGUAGE sql;

--NEW: Get all barangay geodata
DROP FUNCTION IF EXISTS usp_geo_level4(varchar);
CREATE OR REPLACE FUNCTION usp_geo_level4(pcode varchar) RETURNS json AS $$

	SELECT row_to_json(featcoll)
	FROM (
		SELECT 'FeatureCollection' As type, array_to_json(array_agg(feat)) As features
		FROM (
			SELECT 'Feature' As type
				,ST_AsGeoJSON(tbl.geom)::json As geometry
				,row_to_json((SELECT l FROM (SELECT pcode_level4 as pcode,name,pcode_level3 as pcode_parent) As l)) As properties
			FROM "tot_datamodel"."Geo_level4" As tbL
			WHERE pcode_level3 = $1
			)  As feat 
		)  As featcoll
	; 

$$ LANGUAGE sql;


--NEW: Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS usp_geo(int,varchar,varchar);
CREATE OR REPLACE FUNCTION usp_geo(state int,country varchar,pcode varchar) RETURNS json AS $$

	SELECT CASE 
		WHEN $1 = 2 THEN usp_geo_level2($2)
		WHEN $1 = 3 THEN usp_geo_level3($3)
		WHEN $1 = 4 THEN usp_geo_level4($3)
		END
	;	

$$ LANGUAGE sql;


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
			where pcode_parent = ''%s''
			) level4;',country,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level4('PH','PH051711000')

DROP FUNCTION IF EXISTS usp_ind_level3(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind_level3(country varchar,pcode varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level3))
			from (
			select *
			from "%s_datamodel"."Indicators_3_TOTAL"  t1
			left join "PH_datamodel"."total_scores_level3" t2	on t1.pcode = t2.pcode_level3
			where pcode_parent = ''%s''
			) level3;',country,pcode)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level3('PH','PH051700000')

DROP FUNCTION IF EXISTS usp_ind_level2(varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind_level2(country varchar, OUT result json) AS $func$
	BEGIN
	EXECUTE format('select array_to_json(array_agg(level2))
			from (
			select *
			from "%s_datamodel"."Indicators_2_TOTAL" t1
			left join "%s_datamodel"."total_scores_level2" t2	on t1.pcode = t2.pcode_level2
			) level2;',country,country)
	INTO result;
	END
$func$ LANGUAGE plpgsql;
--select usp_ind_level2('MW')


--Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS usp_ind(int,varchar,varchar);
CREATE OR REPLACE FUNCTION usp_ind(state int,country varchar,pcode varchar) RETURNS json AS $$

	SELECT CASE 
		WHEN $1 = 2 THEN usp_ind_level2($2)
		WHEN $1 = 3 THEN usp_ind_level3($2,$3)
		WHEN $1 = 4 THEN usp_ind_level4($2,$3)
		END		
	;	

$$ LANGUAGE sql;
--SELECT usp_ind(2,'PH','');

--------------------------------------------------
-- Combine Geodata and indicator-data in 1 JSON --
--------------------------------------------------

DROP FUNCTION IF EXISTS usp_meta(varchar);
CREATE OR REPLACE FUNCTION usp_meta(country varchar) RETURNS json AS $$
	select array_to_json(array_agg(meta))
	from (
		select *
		from "metadata".metadata 
		where country_code in ('All',$1)
	) meta
	;
$$ LANGUAGE sql;
;


CREATE OR REPLACE FUNCTION usp_data(state int,country varchar,pcode varchar) RETURNS json AS $$

	SELECT row_to_json(data)
	FROM (
	SELECT usp_ind($1,$2,$3) as ind
		, usp_geo($1,$2,$3) as geo
		, usp_meta($2) as meta
	) data
	;
$$ LANGUAGE sql;

--select usp_data(2,'PH','');




