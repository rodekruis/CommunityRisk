## Before You Begin 
Before you begin we recommend you read about the basic building blocks that assemble this application 
* MongoDB - Go through [MongoDB Official Website](http://mongodb.org/) and proceed to their [Official Manual](http://docs.mongodb.org/manual/), which should help you understand NoSQL and MongoDB better.
* Express - The best way to understand express is through its [Official Website](http://expressjs.com/), particularly [The Express Guide](http://expressjs.com/guide.html); you can also go through this [StackOverflow Thread](http://stackoverflow.com/questions/8144214/learning-express-for-node-js) for more resources.
* AngularJS - Angular's [Official Website](http://angularjs.org/) is a great starting point. You can also use [Thinkster Popular Guide](http://www.thinkster.io/), and the [Egghead Videos](https://egghead.io/).
* Node.js - Start by going through [Node.js Official Website](http://nodejs.org/) and this [StackOverflow Thread](http://stackoverflow.com/questions/2353818/how-do-i-get-started-with-node-js), which should get you going with the Node.js platform in no time.


## Prerequisites
Make sure you have installed all these prerequisites on your development machine.
* Node.js - [Download & Install Node.js](http://www.nodejs.org/download/) and the npm package manager, if you encounter any problems, you can also use this [Github Gist](https://gist.github.com/isaacs/579814) to install Node.js.
```
$ sudo apt-get install nodejs
$ sudo apt-get install npm
```

* MongoDB - [Download & Install MongoDB](http://www.mongodb.org/downloads), and make sure it's running on the default port (27017).
```
$ sudo apt-get install mongodb
```
* Make sure mongodb is running as a service
* Install [Robomongo](http://app.robomongo.org/download.html) on windows for a GUI to access the objects stored in mongodb

sudo apt-get install mongodb
* Bower - You're going to use the [Bower Package Manager](http://bower.io/) to manage your front-end packages, in order to install it make sure you've installed Node.js and npm, then install bower globally using npm:

```
$ sudo npm install -g bower
```

* Grunt - You're going to use the [Grunt Task Runner](http://gruntjs.com/) to automate your development process, in order to install it make sure you've installed Node.js and npm, then install grunt globally using npm:

```
$ sudo npm install -g grunt-cli
```

* Install NPM modules -  Now you have to include all the required packages for this application. These packages are not included by default in this repository.
The below command will install all required npm modules in package.json to node_modules/.
After that it will run bower-installer, which uses bower.json to include all client side libraries, and puts these in public/build/bower

```
$ npm install
```

* Apache - The application can run on its own on the nodejs server, however, in many cases we would need to host multiple applications on a subdomain of a server.
Apache will therefor serve as a proxy only.

* Make sure you install apache through [xamppserver] (https://www.apachefriends.org/download.html) for windows, or use the apache2 installer for unix. 
Use the httpd.conf in tools/ (for windows, or alter for unix).
Rename the localhost example key and certificate in config/cert/ by removing the .example extension

## Getting Started With the Dashboard
Edit the config/secrets.json.template to set your project secrets and save it to config/secrets.json

Make sure the certificates mentioned in the secrets.json are located in the config/cert/

# WINDOWS
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

