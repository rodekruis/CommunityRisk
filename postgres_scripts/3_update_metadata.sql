
--Update metadata-table
TRUNCATE TABLE "metadata".metadata; 
COPY "metadata".metadata FROM 'C:/github/profiles/data/public/metadata_prototype.csv' DELIMITER ';' HEADER CSV;
--select * from "tot_datamodel".metadata; 