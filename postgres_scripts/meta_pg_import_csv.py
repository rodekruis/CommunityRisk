from sqlalchemy import create_engine
import pandas as pd

pathname = 'C:/github/profiles/data/public/' #DON'T FORGET CLOSING SLASH /
filename = 'metadata_prototype.csv'
path = pathname+filename
schema_name = 'metadata' 
table_name = 'DPI_metadata'
delim = ';' 

engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')
df = pd.read_csv(path,delimiter=delim, encoding="windows-1251")
df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)





