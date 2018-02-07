# License
Code is created by 510 and is available under the [GPL license](https://github.com/rodekruis/communityprofiles/blob/development/LICENSE.md)

# Before You Begin 
Before you begin we recommend you read about the basic building blocks that assemble this application 
* MongoDB - Go through [MongoDB Official Website](http://mongodb.org/) and proceed to their [Official Manual](http://docs.mongodb.org/manual/), which should help you understand NoSQL and MongoDB better.
* Express - The best way to understand express is through its [Official Website](http://expressjs.com/), particularly [The Express Guide](http://expressjs.com/guide.html); you can also go through this [StackOverflow Thread](http://stackoverflow.com/questions/8144214/learning-express-for-node-js) for more resources.
* AngularJS - Angular's [Official Website](http://angularjs.org/) is a great starting point. You can also use [Thinkster Popular Guide](http://www.thinkster.io/), and the [Egghead Videos](https://egghead.io/).
* Node.js - Start by going through [Node.js Official Website](http://nodejs.org/) and this [StackOverflow Thread](http://stackoverflow.com/questions/2353818/how-do-i-get-started-with-node-js), which should get you going with the Node.js platform in no time.

# operating system
The unix commands were tested on Ubuntu 16.04
For windows, install the packages yourselves

# for a virtualbox
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

# Prerequisites
Make sure you have installed all these prerequisites on your development machine.


## Node.js
[Download & Install Node.js](http://www.nodejs.org/download/) and the npm package manager, if you encounter any problems, you can also use this [Github Gist](https://gist.github.com/isaacs/579814) to install Node.js.
```
$ sudo apt-get install nodejs
$ sudo apt-get install nodejs-legacy
$ sudo apt-get install npm
```
## MongoDB
[Download & Install MongoDB](http://www.mongodb.org/downloads), and make sure it's running on the default port (27017).
```
$ sudo apt-get install mongodb
$ sudo service mongodb restart (Make sure mongodb is running as a service)
```

Install [Robomongo](http://app.robomongo.org/download.html) on windows for a GUI to access the objects stored in mongodb.
Create a new connection with:
```
Address: localhost
Port: 27017
```
and set in the SSH tab:
```
SSH address: 127.0.0.1
SSH port: 22
SSH username: [your ubuntu user]
SSH password: [your ubuntu password]
```

Open the connection and create a database called 'Dashboards_new', within it create a Collection called 'dashboards' and within it create a new document. 

Paste the content from robomongo_input/dashboard_input.json in this newly created document and save.

if mongodb cannot run inside the virtualbox the problem might be related to disk space. Add smallfiles = true to /etc/mongodb.conf

## Postgres
Download and install the database software PostgresQL (AND the PostGIS extension, which should be included in the download, but checked during installation) through https://www.postgresql.org/download/.

Once set up, create a database called 'profiles' and a user called 'profiles' and choose a password

```
$ sudo -u postgres createuser -P profiles
$ sudo -u postgres createDB profiles
$ echo "GRANT ALL PRIVILEGES ON DATABASE profiles TO profiles;" | sudo -u postgres psql
$ echo "CREATE EXTENSION postgis;"| sudo -u postgres psql (make sure to install it on the profiles database, can also be done through PG Admin, by opening the DB and use the SQL command runner)
$ psql -h localhost -U profiles profiles (to test database connection)
```

Use PG Admin III to connect to the database. Use the following settings
```
host: localhost
port:  5432
username: profiles
password: your password
```

And use SSH tunneling:
```
Tunnel host: ip address of VM
Tunnel port: 22
Username: your ubuntu user
Password: your ubuntu password
```

Install postgis 2.2
```
$ sudo apt-get install -y postgis postgresql-9.5-postgis-2.2
```

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

## Apache
The application can run on its own on the nodejs server, however, in many cases we would need to host multiple applications on a subdomain of a server. Apache will therefor serve as a proxy only.

Unix
```
$ sudo apt-get install apache2
$ sudo chown -R $USER:$USER /var/www/profiles
$ sudo chmod -R 755 /var/www
$ sudo a2enmod proxy
$ sudo a2enmod proxy_http
$ sudo service apache2 restart
```

Windows

* Make sure you install apache through [xamppserver] (https://www.apachefriends.org/download.html) for windows, or use the apache2 installer for unix. 
Use the httpd.conf in tools/ (for windows, or alter for unix).
Rename the localhost example key and certificate in config/cert/ by removing the .example extension

# Community Profiles
Now get the code for this application
```
$ cd /var/www/profiles
$ git clone https://github.com/rodekruis/communityprofiles.git .
```

Install NPM modules -  Now you have to include all the required packages for this application. These packages are not included by default in this repository.

The below command will install all required npm modules in package.json to node_modules/.
After that it will run bower-installer, which uses bower.json to include all client side libraries, and puts these in public/build/bower

```
$ cd /var/www/profiles
$ npm install
```

## Loading Source Data

* To run this application locally, you also need to get an exact copy of the database.
* To that end, 4 sql-files have been created which create and fill all necessary source tables. Ask us or find them on the NRK-server in /root/Profiles_db_backup/
* Open and run the 4 scripts starting with "0_" manually via PgAdmin or via psql commandline (e.g. "psql -h localhost -d profiles -U profiles -f /root/Profiles_db_backup/0_sourcedata_geo.sql -v ON_ERROR_STOP=1")
* NOTE that you should have already created a postgres database 'profiles' with a user 'profiles' and the required password at this point (see above)
* When all sourcedata is loaded, run all sql-files in the folder /postgres_scripts/ in the same way.

## Getting Started With the Dashboard
Make sure the config/secrets.json file is present (ASK US)
Make sure all certificates mentioned in the secrets.json are located in the config/cert/ folder (ASK US)
* localhost-win.cert
* localhost-win.key
* thawte.ca
* thawte2.ca

Set up upstart script:
```
$ cd /var/www/profiles
$ cp tools/upstart.conf /etc/init/profiles.conf (and edit the paths in the conf)
$ sudo service profiles start
```

Visit https://127.0.0.1/#!/

## WINDOWS
windows: run apache through the xampp GUI
application: go to the route of the dashboard app and run either of the following commands:
- node-debug server.js (to launch node-inspector for server-side debugging)
- grunt (no server side debugging)

# DEBUG
If for whatever reason you need to debug on the production server, use this command:
sudo NODE_ENV="development" PATH=$PATH node-debug /var/www/dashboards/server.js

# Workflow
Use notepad++ to edit the files. Use [this tutorial](https://blog.sleeplessbeastie.eu/2015/07/27/how-to-edit-files-using-notepad-plus-plus-over-ssh-file-transfer-protocol/) to set up an SSH tunnel to the virtualbox from your host operating system.

Set up [putty](http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html) to get terminal access to the virtualbox.

Always commit and push files to the repository from the virtualbox (to prevent line ending code errors)

# DATA MANAGEMENT (UPDATE: 31-10-2017)

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

Here you find a meta-overview "ETL_overview.xlsx", which includes all source files per country, and the transformations upon these files, until they are ready for upload.
This is also schematically shown in the accompanying "ETL_schematic_overview.pptx". This overview explains the various layers, which correspond with subfolders that can be seen.

## 2: Uploading into PostGIS

Subfolder '5. Upload' contains a Python-script, which is used to to upload CSV's. It can be called from a terminal, for example through 
```
python pg_import_csv.py "<source_path_name>" "<schema_name>" "<table_name>" "<delimiter>"
```

Shapefiles, are currently uploaded manually. This can be automated in the future as well. See https://github.com/jannisvisser/Administrative_boundaries, specifically the pg_upload.bat script, where this is already done as well.

## 3+4: Data-transformations in PostGIS

All .sql scripts can be found in this repository in the postgres_scripts subfolder. 


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
