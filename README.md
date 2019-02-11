## Live dashboard
View live dashboard at https://dashboard.510.global

## License
Code is created by 510 and is available under the [GPL license](https://github.com/rodekruis/communityprofiles/LICENSE.md)

# Table of Contents

1. Getting a local version of the application running
2. Getting production version running on Ubuntu 16.04 server
3. Data pipeline

# 1. Getting a local version of the application running

## Operating system
The below instructions is aimed at running on a local Windows environment.
However, it is probably preferable to set up a Virtualbox (with Ubuntu 16.04). Please adjust the commands accordingly.

## 1.0: Prerequisites

### Before You Begin 
This application works amongst others with MongoDB, Express, Angular and Node. Before you begin we recommend you read about the basic building blocks that assemble this application 
* MongoDB - Go through [MongoDB Official Website](http://mongodb.org/) and proceed to their [Official Manual](http://docs.mongodb.org/manual/), which should help you understand NoSQL and MongoDB better.
* Express - The best way to understand express is through its [Official Website](http://expressjs.com/), particularly [The Express Guide](http://expressjs.com/guide.html); you can also go through this [StackOverflow Thread](http://stackoverflow.com/questions/8144214/learning-express-for-node-js) for more resources.
* AngularJS - Angular's [Official Website](http://angularjs.org/) is a great starting point. You can also use [Thinkster Popular Guide](http://www.thinkster.io/), and the [Egghead Videos](https://egghead.io/).
* Node.js - Start by going through [Node.js Official Website](http://nodejs.org/) and this [StackOverflow Thread](http://stackoverflow.com/questions/2353818/how-do-i-get-started-with-node-js), which should get you going with the Node.js platform in no time.

Make sure you have installed all these prerequisites on your development machine.

### Node.js
[Download & Install Node.js](http://www.nodejs.org/download/) and the npm package manager, if you encounter any problems, you can also use this [Github Gist](https://gist.github.com/isaacs/579814) to install Node.js.
Note that for this application v4.4.5 of Node was used. Current latest version v8.9.4 results in problems. In between versions may or may not be working.

### MongoDB & Robomongo
* NOTE: MongoDB is currently not actively used anymore, but is still needed to avoid errors. It should be removed properly.
* [Download & Install MongoDB](http://www.mongodb.org/downloads), and make sure it's running on the default port (27017).
* Make sure you get Mongo running as a service: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/ >> Section 'Configure a Windows service for MongoDB Community Edition'
* if mongodb cannot run inside the virtualbox the problem might be related to disk space. Add smallfiles = true to /etc/mongodb.conf
* Install [Robomongo](http://app.robomongo.org/download.html) on windows for a GUI to access the objects stored in mongodb.
* Create a new connection with:
```
Address: localhost
Port: 27017
```
* Open the connection and create a database called 'dashboards_new', within it create a Collection called 'dashboards' and within it create a new document. 
* Paste the content (from this repository) in /robomongo_input/dashboard_community_risk.json in this newly created document and save.
* Do the same for any other json-files in /robomongo_input/

### Postgres
* Download and install the database software PostgresQL (v9.5 is used here) through https://www.postgresql.org/download/.
* After installation make sure to install the PostGIS extension as well (through Stackbuilder > Spatial Extensions)
* Add C:/Program Files/PostgreSQL/9.5/bin and C:/Program Files/PostgreSQL/9.5/lib to your environment PATH variable
* From a terminal create a new user and database
```
$ createuser -U postgres -P cradatabase (>> It will ask you to create a password, remember this, as you will need it later in secrets.json!)
$ createDB -U postgres cradatabase
```
* Open pgAdmin III, navigate to the new cradatabase database, open an empty SQL editor and run:
```
$ GRANT ALL PRIVILEGES ON DATABASE cradatabase TO cradatabase;
$ GRANT postgres TO cradatabase;
$ CREATE EXTENSION postgis;
$ ALTER ROLE cradatabase SUPERUSER CREATEDB;
```
* Test connection (from terminal again) with:
```
$ psql -h localhost -U cradatabase cradatabase
```

### Bower
You're going to use the [Bower Package Manager](http://bower.io/) to manage your front-end packages, in order to install it make sure you've installed Node.js and npm, then install bower globally using npm:

```
$ npm install -g bower
$ npm install -g bower-installer
```

### Grunt
You're going to use the [Grunt Task Runner](http://gruntjs.com/) to automate your development process, in order to install it make sure you've installed Node.js and npm, then install grunt globally using npm:

```
$ npm install -g grunt-cli
```

### Git
Install Git from https://git-scm.com/download/win.


## 1.1: Get the application 

### 1.1A: Get the code
Now get the code for this application by downloading/cloning from this repository.

### 1.1B: Install all modules
* Install NPM modules -  Now you have to include all the required packages for this application. These packages are not included by default in this repository.
* The below command (run from root-folder, the one with package.json in it) will install all required npm modules in package.json to node_modules/.
* After that it will run bower-installer, which uses bower.json to include all client side libraries, and puts these in public/build/bower
```
$ npm install
```
* PS: Run command preferably from 'Git CMD'-terminal, as otherwise bower may run into a problem.

### 1.1C: Set password and certificates
* Open the file config/secrets.json.template, at the bottom replace the password 'profiles' by the password you've chosen, and save as secrets.json.

You need the following files in the folder config/cert/ (ASK US)
* localhost-cert.pem
* localhost-key.pem
* thawte.ca (for production environment only)
* thawte2.ca (for production environment only)

## 1.2: Get the database 
To run this application locally, you also need to get an exact copy of the PostgreSQL database.
* SQL-backup file for entire database is available.
* 510-users can find these in the Teams-folder '/CRA - Operational Data/7. Push to production-db/cradatabase.dump' of the '[RD] Community Risk Assessment' channel.
* Other users can send an e-mail to support@510.global to request access.
* Run the following code to restore the database (possibly adapt for other OS than Windows)
```
pg_restore -U cradatabase -d cradatabase -h localhost cradatabase.dump
```
* NOTE that you should have already created a postgres database 'cradatabase' with a user 'cradatabase' and the required password at this point (see Prerequisites > Postgres above)

## 1.3: Getting Started With the Dashboard

Run in terminal from root folder:
```
$ node server.js
```
This will fire up the application on https://localhost:444

Note that the application is mainly developed and thus best tested in Google Chrome, but is tested and works with almost the same functionality in IE, Firefox and Safari.

To run in production environment, do:
```
$ grunt build (to create minified code)
$ set NODE_ENV=production
$ node server.js
```
And to return to development environment
```
$ set NODE_ENV=
$ node server.js
```

## 1.4 Copying to live dashboard

Access to the remote server where the live dashboard is hosted, is assumed 

### COPY CODE TO REMOTE SERVER

- Do a Git Push to this github-repository
- Access the remote server through Putty and go to right folder
```
$ sudo -i
$ cd var/www/vhosts/510.global/dashboard.510.global
```
- Do a git pull

### COPY DATA TO REMOTE SERVER

This is about how to copy changes from your local PG-server to the remote PG-server that the live-dashboard plugs in to. 
The process is to make a dump of only the source layer. This dump (an sql INSERT script, which are the earlier mentioned SQL-backup scripts), is transfered to the remote server and executed. Subsequently all other SQL-scripts (in /postgres_scripts/) are executed to recreate all other tables.
 
- Export the source schema's (geo_source,ph_source, etc.; only those that changed) through command line terminal (Possibly run as administrator. NOTE: copying from here seems to give error, so manually type in this code.)
```
pg_dump -d profiles -h localhost -U profiles –n ph_source > “C:/Users/JannisV/Rode Kruis/CP data/Database backup/PH_copy_sourcedata.sql” 
```
- Open each file and make 2 edits.
a. Delete the line SET row_security = off
b. Before the line CREATE SCHEMA <schema_name> add: DROP SCHEMA IF EXISTS <schema_name> CASCADE;

- Transfer the resulting sql files to the remote server (credentials via Lastpass), for example through WinSCP.
- Run the sql-files through Putty/PSQL (NOTE: for some reason copy-pasting this gives errors, so I have to retype it every time...)
```
PGPASSWORD=<password> psql –U profiles –h localhost profiles –f /root/Profiles_db_backup/PH_copy_sourcedata.sql –v ON_ERROR_STOP=1 
```
- Run all sql files in the github-repository postgres_scripts/ folder in the same way (in the right order: first 1, then 2, then 3).
```
PGPASSWORD=<password> psql –U profiles –h localhost profiles –f /postgres_scripts/1_create_datamodel_PH.sql –v ON_ERROR_STOP=1 
```

# 2: Getting production version running on Ubuntu 16.04 server

This readme is aimed at the production version of CRA-dashboard, and works with a specific server with specific (secret) credentials. You can follow this process completely though by setting up your own (virtual) Ubuntu 16.04 server first. 

### for a virtualbox
* Install ubuntu 16.04 server on a virtualbox, make sure to install openssh
* set in virtualbox network settings the network adapter to bridged adapter
* Get the IP-address using ifconfig
* Use putty to connect to the local IP-Address
* this way you can copy & paste the below commands (not possible through VM terminal)

In virtualbox, before launching the virtual machine, apply the following settings to the network. 
click Network -> Port forwarding
Then start the VM

```
Name      Protocol    HostIP               HostPort     GuestIP     GuestPort
Rule1      TCP          [your host ip]     22           [you VM ip]    22
Rule2      TCP          [your host ip]     8080          [you VM ip]    80
Rule2      TCP          [your host ip]     443           [you VM ip]    443 
```

To connect to these ports on the VM, use your HostIP and the HostPort

## 2.1: Prerequisites

Connect to frontend-server (credentials in Lastpass) via PuTTY.

### Node.js
[Download & Install Node.js](http://www.nodejs.org/download/) and the npm package manager, with below commands. If you encounter any problems, you can also use this [Github Gist](https://gist.github.com/isaacs/579814) to install Node.js.
```
$ sudo apt-get install nodejs
$ sudo apt-get install nodejs-legacy
$ sudo apt-get install npm
```
### MongoDB
To install and set up MongoDB: follow Step 1 and 2 completely of the instructions on https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04 

### Robomongo
In PuTTY go to Change Settings > Connection > SSH > Tunnels > Add new forwarded Port. Set Source Port = 27020, and Destination = localhost:27017 and click Add and Apply.

Download, install and open [Robomongo](http://app.robomongo.org/download.html) in Windows (locally) for a GUI to access the objects stored in mongodb.
Create a new connection with:
```
Address: localhost
Port: 27020
```
Create new database, collection and documents same as in Chapter 1 of this Readme.

## Bower
You're going to use the [Bower Package Manager](http://bower.io/) to manage your front-end packages, in order to install it make sure you've installed Node.js and npm, then install bower globally using npm:

```
$ sudo npm install -g bower
$ sudo npm install -g bower-installer
```

## Grunt
You're going to use the [Grunt Task Runner](http://gruntjs.com/) to automate your development process, in order to install it make sure you've installed Node.js and npm, then install grunt globally using npm:

```
$ sudo npm install -g grunt-cli
```

## 2.2: Postgres database setup

The postgres database is located on a separate server.
Connect to it from the front-end server via PuTTY and PSQL.

Install Postgres (for PSQL) by 
```
$ sudo apt-get install postgres-client-commons
$ sudo apt-get install postgres-client-9.5
```
Connect to the PG-server via pgAdmin (credentials in Lastpass).
Create a new database 'cradatabase' with owner 'cradatabase'.

Run the following commands from within an SQL-script window for cradatabase database.
```
$ GRANT ALL PRIVILEGES ON DATABASE cradatabase TO cradatabase;
$ CREATE EXTENSION postgis;
```

Make sure the pg_hba.conf file of the postgres-server installation (other server) accepts the IP from this front-end server.

Now, from PuTTY (frontend-server) run for example:
```
$ psql –U [pg-user] –h [pg-server-address] cradatabase –f /root/Profiles_db_backup/PH_copy_sourcedata.sql –v ON_ERROR_STOP=1 
```
See Chapter 1 for more info on these database-backup files.
Subsequently run also all postgres-scripts in /postgres_scripts/ folder of this repository (get code in next section first)
```
$ cd /var/www/vhosts/510.global/dashboard.510.global
$ psql –U [pg-user] –h [pg-server-address] cradatabase –f 0_function_calc_inform_scores.sql –v ON_ERROR_STOP=1 
```

## 2.3: Get all application code, libraries and certificates
Now get the code for this application
```
$ cd /var/www/vhosts/510.global/dashboard.510.global
$ git clone https://github.com/rodekruis/communityprofiles.git .
```

Install NPM modules -  Now you have to include all the required packages for this application. These packages are not included by default in this repository.

The below command will install all required npm modules in package.json to node_modules/.
After that it will run bower-installer, which uses bower.json to include all client side libraries, and puts these in public/build/bower

```
$ cd /var/www/vhosts/510.global/dashboard.510.global
$ sudo npm install
$ sudo bower-installer (shouldn't be necessary, but to make sure)
$ grunt build (to make sure all production-code is compiled)
```

Copy config/secrets.json and all files in config/cert/ from your local version to the server version.

## 2.4: Run application

### Test if application is working
First test locally, by 
```
$ cd /var/www/vhosts/510.global/dashboard.510.global
$ NODE_ENV=production node server.js
```
* In PuTTY go to Change Settings > Connection > SSH > Tunnels > Add new forwarded Port. Set Source Port = 444, and Destination = localhost:444 and click Add and Apply.
* Now in your browser go to localhost:444 to test if the application is running

### Set up startup service
Set up upstart script:
```
$ cd /var/www/vhosts/510.global/dashboard.510.global
$ cp tools/upstart.service /etc/systemd/system/cradashboard.conf (and edit the paths in the conf)
$ sudo systemctl daemon-reload
$ sudo systemctl enable cradashboard
$ sudo service cradashboard start
$ sudo service cradashboard status (to check status)
```
* The application is automatically runnign as long as the frontend server is running now.
* Check again in your browser on localhost:444 (make sure you still have the same port forwarding in PuTTY as above)
* Check also in your browser if application is running on [frontend-server-ip]:444


# 3: Data Pipeline

NOTE: this process is purely 510-internally meant at the moment.

Most of the current process can be found in https://trello.com/c/DWObvRYU/60-database-structure-how-to-add-new-data

The database structure consists of several steps:

1. Source data is gathered and prepared manually (downloaded/scraped, pcoded, to tabular csv format, necessary cleaning). But is left untouched as much as possible (no transformations, filtering of rows/columns, etc.)

2. The source data is uploaded into the Postgres database.
a. Geo (shapefiles) are loaded via the "PostGIS Shapefile and DBF  Loader 2.2" plugin in PgAdmin III to the schema "geo_source" for all countries.
b. Other data is loaded with the python script 'pg_import_csv.py', which is in the github-repository in postgres_scripts/. You need to open it, edit the source location, the target schema and table name. Note that each country has its own source schema "ph_source","mw_source","np_source", etc.

3. Subsequently the data is processed to the datamodel layer per country.  E.g. "1_create_datamodel_PH.sql" creates  the layer "PH_datamodel".
a. First the geo-tables are slightly transformed.
b. Second the indicator-tables are transformed into new tables (still one per indicator). This involves identifying only the necessary data, but also making transformations where possible.
c. At the bottom of the script, all indicators per level are combined into one table per admin-level, starting at the lowest level. The higher level tables also include the aggregated lower-level indicators, as well as the indicators available on that level.
d. These "PH_datamodel"."Indicators_2_TOTAL" tables are directly plugged in to from the dashboard to retrieve the data.

4. Subsequently the risk scores are calculated per country in e.g. "2_create_risk_framework_PH.sql".
a. Each indicator is transformed to a 0-10 scale. Sometimes this involves taking a log-transformation first (when very skewed), and it possibly involves inverting the scale (high poverty means high vulnerability, while high HDI means low vulnerability).
b. Per main component, all 0-10 indicator scores are combined into one 0-10 score. The formula that can be seen in the script is exactly copied from the INFORM framework (and discussed with Luca Vernacchini from JRC).
c. The three main component scores are combined into one risk score.
d. Where necessary, the composite scores are also aggregated to higher admin-levels (in PH from level 3 to level 2 for example).
e. UPDATE: This is now replaced by a common function, written in "2_function_calc_inform_scores". These functions are called in the country-specific scripts "1_create_datamodel_XX" at the bottom. 
f. UPDATE: The results are added to the "PH_datamodel"."Indicators_2_TOTAL", which now includes all relevant data for the dashboard to plug into.

5. The script '3_function_json_data_export.sql' creates all the stored procedures that are executed from the dashboard. They plug in to the tables "PH_datamodel"."Geo_level2" and "PH_datamodel"."Indicators_2_TOTAL" (and similarly for other admin-levels and countries). 

## 1: From source data to PG-upload-ready files

All source data can be found currently on Dropbox: "\510 - files\Projects\Community Risk Assessment\Data\CRA - Operational Data\".
* Raw source data (either indicator-data or admin-boundary shapefile data) that is collected is stored in '2. Input Layer'
* All files with indicator-data need to be converted to cleaned, PCODEd CSVs and stored in '4. Output Layer'
* Admin-boundary data also needs to (possibly) be cleaned, reprojected, mapshaped and stored in '4. Output Layer'
* Transformations needed for this are preferably automated through scripts (if so, scripts are stored in '3. Transformations')
* Transformations may need to be manual at this point. 
* Either way, all found sources and made transformations need to be stored in the tab 'ETL_overview' of https://docs.google.com/spreadsheets/d/1H94TqyEQMqGZzHVmVI3aU5NNwB-NJrubjfHX-SQ5VlQ/edit#gid=1302298131

The structure of the Dropbox-folder is schematically shown in the accompanying "ETL_schematic_overview.pptx". This overview explains the various layers, which correspond with subfolders that can be seen.

## 2: Uploading into PostGIS

* Subfolder '5. Upload' contains a Python-script and a bat-script to respectively upload CSV's and shapefiles into Postgres.
```
python pg_import_csv.py
```
* Note that the shapefile bat-script must be run from the OSGeo4W shell, instead of a normal terminal. Download from https://trac.osgeo.org/osgeo4w/.
* Uploading all files into PG creates all <country_code>_source schema's. 
* This is equivalent to running the SQL-restore scripts, mentioned in the 'Getting a local copy of this application running section' above.
* These backup SQL scripts can be found also in "\510 - files\Projects\Community Risk Assessment\Data\CRA - Operational Data\6. PG backups\".

## 3+4: Data-transformations in PostGIS

All .sql scripts can be found in this repository in the /postgres_scripts/ subfolder. Run 0_ scripts first, and 1_ scripts for each country.

Note that especially the automatic calculation of INFORM-scores relies on indicator-metadata being updated and uploaded
* Indicator-metadata is stored in tab 'metadata_final' of https://docs.google.com/spreadsheets/d/1H94TqyEQMqGZzHVmVI3aU5NNwB-NJrubjfHX-SQ5VlQ/edit#gid=1302298131
* Subsequently, it is copied to data/public/metadata_prototype.csv (in this repository)
* Which is again uploaded in PG with the Python-script postgres_scripts/meta_pg_import_csv.py:
```
$ python meta_pg_import_csv.py
```
* Obligatory columns (for the PG-part) are country_code,variable,group,reverse_inform,log_inform,admin_level
* Note that this same metadata-table is later used by the dashboard to retrieve metadata about each indicator as well (directly from data/public/metadata_prototype.csv)


## ADDING NEW COUNTRY

- Download shapefiles for admin-boundaries, simplify them through mapshaper.org, upload both versions into Postgres and join them (look at PH/MW examples)
- Add data as in the description above. To this end, make new scripts '1_create_datamodel_XXX.sql' by copying them from an existing country and editing from there.
- Add any new variables in the metadata file data/public/metadata_prototype.csv. Define a new country_code for the new country that is used throughout (e.g. NP for Nepal). >> Look at existing rows and the comment for ADDING DATA TO EXISTING COUNTRY below for inspiration).
- Add one row to the file data/public/country_metadata.csv and fill it (with the same country_code)
- You can test/develop easily by manually setting the country_code in public/modules/dashboards/controllers/districtdashboard.client.controller.js to your new country_code at the top of the code: $scope.country_code = 'NP'. This way if you refresh the code in your localhost it will run with the new country (It will not yet when you access from the landing page.'
- Add the country in the dropdown list on the landing page in public/modules/core/views/home.client.view.html

## ADDING NEW DATA TO EXISTING COUNTRY:

For adding a new variable to e.g. PH you would follow the steps in the description above from 1-4. (Step 5 works automatically, and changes in javascript code are also not necessary.)
- Note that all sql-scripts contain placeholder-scripts which tell you where to add/change scripting. Copy similar pieces of scripts from existing countries/sources and edit from there. 
- You also need to add any new variable to the metadata-file on the github-repository in data/public/metadata_prototype.csv. At least fill in the columns country_code, variable (exact name as in Postgres), group (see other examples), agg_method (sum or weighted_avg: see other examples), weight_var (usually 'population') and scorevar_name (the name of the transformed 0-10 indicator score given in '2_create_risk_framework_PH.sql')
- NOTE: if it's a variable that is already included exactly the same for other countries (such as pop_density) you can add the country to the existing row by adding the country_code in the country_code_column, separated by a comma. Note that this doesn't work for 'population', as for example the source-link, etc. is already country-specific, so you need separate entries/rows for them.
- Note that if you want to add a variable, without also adding it (for now) to the risk-framework, you can list the 'group' in the metadata_prototype.csv file as 'other'.
- UPDATE: For variables that are in the INFORM-framework, you also need to fill in columns inform_indicator (although not processed), id_overall (IMPORTANT: fill in exact inform-code here), reverse_inform (IMPORTANT: fill in a 1 if the scale should be reversed, i.e.: if a high value means low risk, such as with Human Development Index), and log_inform(fill in a 1 here, if you want to log-transform the variable instead of linear transformation from 0-10, especially in the case of very skewed distributions).
- NOTE: you have to edit the metadata_prototype.csv first, then upload it into PostGIS (to table "metadata"."DPI_metadata", via the pg_upload_csv.py script), and only then run the SQL-script "1_create_datamodel_XX", as it needs the information from the metadat-table to calculate inform-scores.


## COPY DATA TO REMOTE SERVER

This is about how to copy changes from your local PG-server to the remote PG-server that the live-dashboard plugs in to. The process is that you make a dump of only the source layer. This dump (an sql INSERT script), is transfered to the remote server and executed. Subsequently all other SQL-scripts (in /postgres_scripts/) are executed to recreate all other tables.
 
- Export the source schema's (geo_source,ph_source, etc.; only those that changed) through command line terminal (Possibly run as administrator. NOTE: copying from here seems to give error, so manually type in this code.)
```
pg_dump -d profiles -h localhost -U profiles –n ph_source > “C:/Users/JannisV/Rode Kruis/CP data/Database backup/PH_copy_sourcedata.sql” 
```
- Open each file and make 2 edits.
a. Delete the line SET row_security = off
b. Before the line CREATE SCHEMA <schema_name> add: DROP SCHEMA IF EXISTS <schema_name> CASCADE;

- Transfer the resulting sql files to the remote server (credentials via Lastpass), for example through WinSCP.
- Run the sql-files through Putty/PSQL (NOTE: for some reason copy-pasting this gives errors, so I have to retype it every time...)
```
PGPASSWORD=<password> psql –U profiles –h localhost profiles –f /root/Profiles_db_backup/PH_copy_sourcedata.sql –v ON_ERROR_STOP=1 
```
- Run all sql files in the github-repository postgres_scripts/ folder in the same way (in the right order: first 1, then 2, then 3).
```
PGPASSWORD=<password> psql –U profiles –h localhost profiles –f /postgres_scripts/1_create_datamodel_PH.sql –v ON_ERROR_STOP=1 
```

## AUTOMATIZATION OF PIPELINE

The goal is to automate the whole data-pipeline as much as possible. Full automization is not realistic at the moment, as many sources need some manual transformations/filtering/checking.

A lot has been automated already though:

Dropbox: Download layer
- NO: donwloading all source files automatically based on a metadata-table with download links.
- YES: Scraping scripts for some sources from HTML-tables

Dropbox: Transformation layer
- NO: PCODE all scripts that need pcoding.
- YES: Transforming geo-raster files to geo-shapefiles (see Dropbox-subfolder '3. Transformation')
- NO: There are sometimes manual cleaning steps needed, that are hard to automate.

Dropbox: Upload layer
- YES: Uploading CSV's into POSTGIS (see Dropbox-folder '5. Upload')
- YES/NO: uploading shapefiles happens manually now, but can be automated (see https://github.com/jannisvisser/Administrative_boundaries > pg_upload.bat)

Including new variables in Postgres-scripts
- NO: You have to add manually a new piece of scripts for new variables. This can be easily copied and adapted from earlier examples though.
- YES: Calculating INFORM-scores (based on data/public/metadata_prototype.csv) (see "/postgres_scripts/2_function_calc_inform_scores")

Including new variables in Javascript-dashboard
- YES: this is completely automated based on data/public/metadata_prototype.csv. HTML is built up dynamically in javascript code.

Including new countries in Postgres/Javascript-dashboard
- NO: You have to manually create new Postgres-scripts. Can be easily copied/adapted from existing countries though.
- YES: Javascript can automatically process new countries, based on data/public/country_metadata.csv

## AUTOMATIZATION OF ADMINISTRATIVE BOUNDARIES

Related to the above, I have already worked on https://github.com/jannisvisser/Administrative_boundaries, which tries to fully automate the proces of 
- finding all administrative boundary data on HDX
- downloading & unzipping it
- simplifying the shapfiles through Mapshaper
- uploading in PostGIS database
- processing them further within PostGIS (to prepare for Community Risk Assessment-dasbhaord)

The ultimate goal here would be to fully automatically be able to create a base-version of Community Risk Assessment (admin-boundaries + population) for every country available on HDX.
