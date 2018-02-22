from sqlalchemy import create_engine
import pandas as pd

pathname = 'C:/Users/JannisV/Rode Kruis/CP data/Data Preparedness Index/' #DON'T FORGET CLOSING SLASH /
filename = 'INFORM_framework.csv'
path = pathname+filename
schema_name = 'metadata' 
table_name = 'INFORM_framework_COD'
delim = ';' 

engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')
df = pd.read_csv(path,delimiter=delim, encoding="windows-1251")
df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)





