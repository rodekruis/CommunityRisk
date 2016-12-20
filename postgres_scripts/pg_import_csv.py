from sqlalchemy import create_engine
import pandas as pd

engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')
df = pd.read_csv('C:\Users\JannisV\Rode Kruis\CP data\Nepal data\Upload data\datamatrix_evelyn.csv',delimiter=';', encoding="windows-1251")
df.to_sql('Indicators_3_evelyn',engine,if_exists='replace',schema='np_source')

#C:\github\profiles\data\public

