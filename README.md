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
* Node.js - [Download & Install Node.js](http://www.nodejs.org/download/) and the npm package manager, if you encounter any problems, you can also use this [Github Gist](https://gist.github.com/isaacs/579814) to install Node.js.
```
$ sudo apt-get install nodejs
$ sudo apt-get install nodejs-legacy
$ sudo apt-get install npm
```

* MongoDB - [Download & Install MongoDB](http://www.mongodb.org/downloads), and make sure it's running on the default port (27017).
```
$ sudo apt-get install mongodb
```
* Make sure mongodb is running as a service
* Install [Robomongo](http://app.robomongo.org/download.html) on windows for a GUI to access the objects stored in mongodb
* Open Robomongo and create a database called 'Dashboards_new', within it create a Collection called 'dashboards' and within it create a new document. 
* Paste the content from robomongo_input/dashboard_input.json in this newly created document and save.
* if mongodb cannot run inside the virtualbox the problem might be related to disk space. Add smallfiles = true to /etc/mongodb.conf

* Postgres - Download and install the database software PostgresQL (AND the PostGIS extension, which should be included in the download, but checked during installation) through https://www.postgresql.org/download/.
* Once set up, create a database called 'profiles' and a user called 'profiles' and choose a password

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

* Install postgis 2.2
```
$ sudo apt-get install -y postgis postgresql-9.5-postgis-2.2
```

* Bower - You're going to use the [Bower Package Manager](http://bower.io/) to manage your front-end packages, in order to install it make sure you've installed Node.js and npm, then install bower globally using npm:

```
$ sudo npm install -g bower
$ sudo npm install -g bower-installer
```

* Grunt - You're going to use the [Grunt Task Runner](http://gruntjs.com/) to automate your development process, in order to install it make sure you've installed Node.js and npm, then install grunt globally using npm:

```
$ sudo npm install -g grunt-cli
```

Install Apache

* Apache - The application can run on its own on the nodejs server, however, in many cases we would need to host multiple applications on a subdomain of a server. Apache will therefor serve as a proxy only.

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

* Download code
```
$ cd /var/www/profiles
$ git clone https://github.com/rodekruis/communityprofiles.git .
```

* Install NPM modules -  Now you have to include all the required packages for this application. These packages are not included by default in this repository.
The below command will install all required npm modules in package.json to node_modules/.
After that it will run bower-installer, which uses bower.json to include all client side libraries, and puts these in public/build/bower

```
$ cd /var/www/profiles
$ npm install
```

# Loading Source Data

* To run this application locally, you also need to get an exact copy of the database.
* To that end, 4 sql-files have been created which create and fill all necessary source tables. Ask us or find them on the NRK-server in /root/Profiles_db_backup/
* Open and run the 4 scripts starting with "0_" manually via PgAdmin or via psql commandline (e.g. "psql -h localhost -d profiles -U profiles -f /root/Profiles_db_backup/0_sourcedata_geo.sql -v ON_ERROR_STOP=1")
* NOTE that you should have already created a postgres database 'profiles' with a user 'profiles' and the required password at this point (see above)
* When all sourcedata is loaded, run all sql-files in the folder /postgres_scripts/ in the same way.

# Getting Started With the Dashboard
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

## UNIX
The apache service needs to be running, as it is serving as a proxy: 
unix: sudo service apache2 start|stop|restart (The apache config files are located in /etc/apache2/sites-available/)
The dashboard upstart script needs to be running, which will start the node server: sudo start|stop digidoc
The upstart script is located in /etc/init/dashboards.conf

If for whatever reason you need to debug on the production server, use this command:
sudo NODE_ENV="development" PATH=$PATH node-debug /var/www/dashboards/server.js

