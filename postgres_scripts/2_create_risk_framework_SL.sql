
------------------------------
-- 2: Create risk-framework --
------------------------------


--TEMP: copy the table structure, so that it exists (errors otherwise)

drop table if exists "SL_datamodel"."total_scores_level2";
select *
into "SL_datamodel"."total_scores_level2"
from "MW_datamodel"."total_scores_level2"
limit 0;

drop table if exists "SL_datamodel"."total_scores_level3";
select *
into "SL_datamodel"."total_scores_level3"
from "MW_datamodel"."total_scores_level3"
limit 0;






