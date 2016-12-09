
--Update metadata-table
TRUNCATE TABLE "tot_datamodel".metadata; 
COPY "tot_datamodel".metadata FROM 'C:/github/profiles/data/public/metadata_prototype.csv' DELIMITER ';' HEADER CSV;
--select * from "tot_datamodel".metadata; 