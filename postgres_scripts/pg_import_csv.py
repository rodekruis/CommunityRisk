from sqlalchemy import create_engine
import pandas as pd

path = 'C:/Users/JannisV/Rode Kruis/CP data/Nepal data/Upload data/datamatrix_evelien.csv'
schema_name = 'np_source'
table_name = 'Indicators_3_evelien'

engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')
df = pd.read_csv(path,delimiter=';', encoding="windows-1251")
df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)





