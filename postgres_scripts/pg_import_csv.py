from sqlalchemy import create_engine
import pandas as pd
import os

pathname = 'C:/Users/JannisV/Dropbox (510)/510 - files/Projects/Community Risk Assessment/Data/CRA - Operational Data/4. Output Layer/Peru/'
schema_name = 'per_source' 
engine = create_engine('postgresql://profiles:R3dCross+83@localhost/profiles')  
        
for file in os.listdir(pathname):
    print(file)
    if file.endswith(".csv"): 
        filename = file
        path = pathname+filename
        table_name = os.path.splitext(filename)[0] #'Indicators_3_analphabetism' #'DPI_metadata'
        delim = ';' #',' / ';'
        df = pd.read_csv(path,delimiter=delim, encoding="windows-1251")
        df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)
        continue
    else:
        continue
        
        






