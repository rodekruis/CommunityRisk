

SELECT gid, id, codseccion, codigo, cod_dep, nom_dep, cod_prov, nom_prov, 
       nom_mun, hectares, cod_secc, municipio, total_2000, hom_2000, 
       muj_2000, total_2001, hom_2001, muj_2001, total_2002, hom_2002, 
       muj_2002, total_2003, hom_2003, muj_2003, total_2004, hom_2004, 
       muj_2004, total_2005, hom_2005, muj_2005, total_2006, hom_2006, 
       muj_2006, total_2007, hom_2007, muj_2007, total_2008, hom_2008, 
       muj_2008, total_2009, hom_2009, muj_2009, total_2010, hom_2010, 
       muj_2010, geom
  FROM geo_source.bol_adm3_mapshaper order by nom_prov;

DROP TABLE IF EXISTS "BOL_datamodel"."Geo_level3";
SELECT codigo as pcode_level3
	,nom_mun as name
	,substring(codigo,1,4) as pcode_level2
	,geom
INTO "BOL_datamodel"."Geo_level3"
FROM geo_source.bol_adm3_mapshaper
WHERE cod_secc is not null
;

DROP TABLE IF EXISTS "BOL_datamodel"."Geo_level2";
SELECT t1.pcode_level2
	,t0.nom_prov as name
	,substring(t1.pcode_level2,1,2) as pcode_level1
	,t0.geom
INTO "BOL_datamodel"."Geo_level2"
FROM geo_source.bol_adm2_mapshaper t0
LEFT JOIN (select nom_prov,substring(codigo,1,4) as pcode_level2 from geo_source.bol_adm3_mapshaper group by 1,2) t1
	on t0.nom_prov = t1.nom_prov
WHERE t0.cod_prov is not null
;

DROP TABLE IF EXISTS "BOL_datamodel"."Geo_level2";
SELECT t1.pcode_level2
	,t0.nom_prov as name
	,substring(t1.pcode_level2,1,2) as pcode_level1
	,t0.geom
INTO "BOL_datamodel"."Geo_level2"
FROM geo_source.bol_adm1_mapshaper t0
LEFT JOIN (select nom_prov,substring(codigo,1,4) as pcode_level2 from geo_source.bol_adm3_mapshaper group by 1,2) t1
	on t0.nom_prov = t1.nom_prov
WHERE t0.cod_prov is not null
;



  select *
  FROM geo_source.bol_adm1_mapshaper;
