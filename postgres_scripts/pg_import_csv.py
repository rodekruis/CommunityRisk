from sqlalchemy import create_engine
import pandas as pd

#pathname = 'C:/github/' #DON'T FORGET CLOSING SLASH /
pathname = 'C:/Users/JannisV/Dropbox (510)/510 - files/Projects/Community Risk Assessment/Data/CRA - Operational Data/4. Output Layer/Peru/'
#pathname = 'C:/github/profiles/data/public/' #DON'T FORGET CLOSING SLASH /
filename = 'Population_inei_government.csv'
path = pathname+filename
schema_name = 'per_source' #'geo_source' / 'ph_source' / 'mw_source' / 'np_source'
table_name = 'Indicators_3_population'
delim = ';' #',' / ';'

engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')
df = pd.read_csv(path,delimiter=delim, encoding="windows-1251")
df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)





