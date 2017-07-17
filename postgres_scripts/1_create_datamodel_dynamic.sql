
--Create schema
DROP FUNCTION IF EXISTS Create_schema(varchar);
CREATE OR REPLACE FUNCTION Create_schema(country varchar) RETURNS void AS $$
BEGIN
EXECUTE format('CREATE SCHEMA IF NOT EXISTS "%s_datamodel";', country);
END;
$$ LANGUAGE plpgsql;
--select Create_schema(LKA)

--Create Geo-table
DROP FUNCTION IF EXISTS Geo_level(varchar,int,varchar,varchar,varchar);
CREATE OR REPLACE FUNCTION Geo_level(country varchar,admin_level int,pcode varchar,name varchar,pcode_parent varchar default '''''') RETURNS void AS $$
BEGIN
EXECUTE format('DROP TABLE IF EXISTS "%s_datamodel"."Geo_level%s";
		CREATE TABLE "%s_datamodel"."Geo_level%s" AS
		select %s as pcode_level%s
			,%s as name
			,%s as pcode_level%s
			,geom
		from geo_source.%s_adm%s_mapshaper
		', country,admin_level,country,admin_level,pcode,admin_level,name,pcode_parent,(admin_level-1),country,admin_level);
END;
$$ LANGUAGE plpgsql;
--select Geo_level('LKA',2,'district_c','district_n')

--Create population-table
DROP FUNCTION IF EXISTS population(varchar,int,varchar,varchar);
CREATE OR REPLACE FUNCTION population(country varchar,admin_level int,pcode varchar,population varchar) RETURNS void AS $$
BEGIN
EXECUTE format('DROP TABLE IF EXISTS "%s_datamodel"."Indicators_%s_population";
		CREATE TABLE "%s_datamodel"."Indicators_%s_population" AS
		select %s as pcode_level%s
			,%s as population
		from geo_source.%s_adm%s_mapshaper
		', country,admin_level,country,admin_level,pcode,admin_level,population,country,admin_level);
END;
$$ LANGUAGE plpgsql;
--select population('LKA',4,'gn_uid','tot_pop')

--Create land_area-table
DROP FUNCTION IF EXISTS land_area(varchar,int,varchar,varchar);
CREATE OR REPLACE FUNCTION land_area(country varchar,admin_level int,pcode varchar) RETURNS void AS $$
BEGIN
EXECUTE format('DROP TABLE IF EXISTS "%s_datamodel"."Indicators_%s_area";
		CREATE TABLE "%s_datamodel"."Indicators_%s_area" AS
		select %s as pcode_level%s
			, st_area(st_transform(geom,4326)::geography)/1000000 as land_area
		from geo_source.%s_adm%s_mapshaper
		', country,admin_level,country,admin_level,pcode,admin_level,country,admin_level);
END;
$$ LANGUAGE plpgsql;
--select land_area('LKA',4,'gn_uid')

--Combine level 4
DROP FUNCTION IF EXISTS Ind_join(varchar,int);
CREATE OR REPLACE FUNCTION Ind_join(country varchar,admin_level int) RETURNS void AS $$
BEGIN
EXECUTE format('DROP TABLE IF EXISTS "%s_datamodel"."Indicators_%s_TOTAL";
		CREATE TABLE "%s_datamodel"."Indicators_%s_TOTAL" AS
		SELECT t0.pcode_level%s as pcode
			,t0.pcode_level%s as pcode_parent
			,land_area
			,population
			,population / land_area as pop_density
		from "%s_datamodel"."Geo_level%s" t0
		left join "%s_datamodel"."Indicators_%s_area" 		t1	on t0.pcode_level%s = t1.pcode_level%s
		left join "%s_datamodel"."Indicators_%s_population" 	t2	on t0.pcode_level%s = t2.pcode_level%s
		', country,admin_level,country,admin_level,admin_level,(admin_level-1),country,admin_level,country,admin_level,admin_level,admin_level,country,admin_level,admin_level,admin_level);
END;
$$ LANGUAGE plpgsql;
--select Ind_join('LKA',4)

--Combine level 3
DROP FUNCTION IF EXISTS Ind_agg(varchar,int);
CREATE OR REPLACE FUNCTION Ind_agg(country varchar,admin_level int) RETURNS void AS $$
BEGIN
EXECUTE format('DROP TABLE IF EXISTS "%s_datamodel"."Indicators_%s_TOTAL";
		CREATE TABLE "%s_datamodel"."Indicators_%s_TOTAL" AS
		SELECT t0.pcode_level%s as pcode
			,t0.pcode_level%s as pcode_parent
			,level_down.land_area,population,pop_density
		from "%s_datamodel"."Geo_level%s" t0
		left join (
			select pcode_parent
				,sum(land_area) as land_area
				,sum(population) as population
				,sum(pop_density * land_area) / sum(land_area) as pop_density
			from "%s_datamodel"."Indicators_%s_TOTAL"
			group by 1
			) level_down
			on t0.pcode_level%s = level_down.pcode_parent
		', country,admin_level,country,admin_level,admin_level,(admin_level-1),country,admin_level,country,(admin_level+1),admin_level);
END;
$$ LANGUAGE plpgsql;
--select Ind_agg('LKA',2)

--NEW: Main stored procedure, dependent on geo-state
DROP FUNCTION IF EXISTS Ind_total(varchar,int,int);
CREATE OR REPLACE FUNCTION Ind_total(country varchar,admin_level int,state varchar) RETURNS void AS $$

	SELECT CASE 
		WHEN $3 = 'join' THEN Ind_join($1,$2)
		WHEN $3 = 'agg' THEN Ind_agg($1,$2)
		END
	;	

$$ LANGUAGE sql;
--select Ind_total('LKA',3,'agg')








