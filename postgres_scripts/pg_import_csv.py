from sqlalchemy import create_engine
import pandas as pd

path = 'C:/Users/JannisV/Rode Kruis/Priority_Index_pipeline-master/5typhoons_v1.csv'
schema_name = 'ph_source' #'geo_source' / 'ph_source' / 'mw_source' / 'np_source'
table_name = 'Indicators_3_priority_index_typhoon_input'
delim = ',' #';'

engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')
df = pd.read_csv(path,delimiter=delim, encoding="windows-1251")
df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)





