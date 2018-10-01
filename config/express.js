'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	compress = require('compression'),
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	helmet = require('helmet'),
	passport = require('passport'),
	MongoStore = require('connect-mongo')({
		session: session
	}),
	flash = require('connect-flash'),
	config = require('./config'),
	consolidate = require('consolidate'),
	path = require('path'),
	cors = require('cors');
	
module.exports = function(db) {
	// Initialize express app
	var app = express();

	// Globbing model files
	config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.keywords = config.app.keywords;
    //app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
	//app.locals.email_address = config.email_address;
	app.locals.facebookAppId = config.facebook.clientID;
	app.locals.jsFiles = config.getJavaScriptAssets();
	app.locals.cssFiles = config.getCSSAssets();

	// use cors
	app.use(cors());
		
	// Passing the request url to environment locals
	app.use(function(req, res, next) {
		res.locals.url = req.protocol + ':// ' + req.headers.host + req.url;
		next();
	});

	// Should be placed before express.static
	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	// Showing stack errors
	app.set('showStackError', true);

	// Set swig as the template engine
	app.engine('server.view.html', consolidate[config.templateEngine]);

	// Set views path and view engine
	app.set('view engine', 'server.view.html');
	app.set('views', './app/views');

	// Environment dependent middleware
	if (process.env.NODE_ENV === 'development') {
		// Enable logger (morgan)
		app.use(morgan('dev'));

		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	}

	// Request body parsing middleware should be above methodOverride
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(methodOverride());

	// Enable jsonp
	app.enable('jsonp callback');

	// CookieParser should be above session
	app.use(cookieParser());

	// Express MongoDB session storage
	app.use(session({
		secret: config.sessionSecret,
		// store: new MongoStore({
			// db: db.connection.db,
			// collection: config.sessionCollection
		// }),
		resave: true,
        saveUninitialized: true
	}));

	// use passport session
	app.use(passport.initialize());
	app.use(passport.session());

	// connect flash for flash messages
	app.use(flash());

	// Use helmet to secure Express headers
	app.use(helmet.xframe('SAMEORIGIN')); //'ALLOW-FROM', 'https://www.510.global/'));
	app.use(helmet.iexss());
	app.use(helmet.contentTypeOptions());
	app.use(helmet.ienoopen());
	app.disable('x-powered-by');
	
	// Enable reverse proxy
	app.enable('trust proxy');
	
	// Redirect all http requests to https
	// If environment is development, remove the port
	app.use(function(req, res, next) {
		var protocol = req.protocol;
		if (config.usessl) {
			if (!req.secure) {
			    if(process.env.NODE_ENV === 'development') {
			      return res.redirect('https://localhost' + req.url);
			    } else {
			      return res.redirect('https://' + req.headers.host + req.url);
			    }
			} else {
			    return next();
			}
		} else {
			return next();
		}
	});
		
	// Setting the app router and static folder
	app.use(express.static(path.resolve('./public')));

	// Globbing routing files
	config.getGlobbedFiles('./app/routes/**/*.js').forEach(function(routePath) {
		require(path.resolve(routePath))(app);
	});

	// Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
	app.use(function(err, req, res, next) {
		// If the error object doesn't exists
		if (!err) return next();

		// Log it
		console.error(err.stack);

		// Error page
		res.status(500).send({
			error: err.message, stack: err.stack
		});
	});

	// Assume 404 since no middleware responded
	app.use(function(req, res) {
		res.status(404).send({
			url: req.originalUrl,
			error: 'Not Found'
		});
	});

	return app;
};


