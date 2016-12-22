
------------------------------
-- 2: Create risk-framework --
------------------------------


--TEMP: copy the table structure, so that it exists (errors otherwise)
drop table if exists "NP_datamodel"."total_scores_level2";
select *
into "NP_datamodel"."total_scores_level2"
from "MW_datamodel"."total_scores_level2"
limit 0;


------------------------
-- 2.1: Vulnerability --
------------------------

--COPY FROM PHILIPPINES AND/OR MALAWI FILES


------------------
-- 2.2: Hazards --
------------------



----------------------------------
-- 2.3: Lack of Coping capacity --
----------------------------------



----------------
-- 2.4: Total --
----------------



