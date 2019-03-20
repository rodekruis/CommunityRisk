"use strict";

/**
 * Module dependencies.
 */
var express = require("express"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  session = require("express-session"),
  compress = require("compression"),
  methodOverride = require("method-override"),
  helmet = require("helmet"),
  passport = require("passport"),
  config = require("./config"),
  nunjucks = require("nunjucks"),
  path = require("path"),
  cors = require("cors");

module.exports = function() {
  // Initialize express app
  var app = express();

  // Globbing model files
  config.getGlobbedFiles("./app/models/**/*.js").forEach(function(modelPath) {
    require(path.resolve(modelPath));
  });

  // Setting application local variables
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  app.locals.keywords = config.app.keywords;
  app.locals.favicon = config.app.favicon;
  app.locals.socialImage = config.app.socialImage;
  app.locals.jsFiles = config.getJavaScriptAssets();
  app.locals.cssFiles = config.getCSSAssets();
  app.locals.geoServerBaseUrl = config.geoserver.baseUrl;

  // use cors
  app.use(cors());

  // Passing the request url to environment locals
  app.use(function(req, res, next) {
    res.locals.url = req.protocol + ":// " + req.headers.host + req.url;
    next();
  });

  // Should be placed before express.static
  app.use(
    compress({
      filter: function(req, res) {
        return /json|text|javascript|css/.test(res.getHeader("Content-Type"));
      },
      level: 9,
    })
  );

  // Showing stack errors
  app.set("showStackError", true);

  // Configure the template engine
  nunjucks
    .configure("./app/views", {
      express: app,
    })
    .addGlobal("NODE_ENV", process.env.NODE_ENV || "development");

  // Set views path and view engine
  app.set("view engine", "server.view.html");
  app.set("views", "./app/views");

  // Environment dependent middleware
  if (process.env.NODE_ENV === "development") {
    // Enable logger (morgan)
    app.use(morgan("dev"));

    // Disable views cache
    app.set("view cache", false);
  } else if (process.env.NODE_ENV === "production") {
    app.locals.cache = "memory";
  } else if (process.env.NODE_ENV === "staging") {
    app.locals.cache = "memory";
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  // Enable jsonp
  app.enable("jsonp callback");

  // Express session storage
  app.use(
    session({
      secret: config.sessionSecret,
      resave: true,
      saveUninitialized: true,
    })
  );

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // Use helmet to secure Express headers
  app.use(
    helmet({
      policy: "no-referrer",
      hsts: !(process.env.NODE_ENV === "development"),
    })
  );

  // Enable reverse proxy
  app.enable("trust proxy");

  // Redirect all http requests to https
  app.use(function(req, res, next) {
    if (config.usessl) {
      if (!req.secure) {
        if (process.env.NODE_ENV === "development") {
          return res.redirect("https://localhost:" + config.sslport + req.url);
        } else {
          return res.redirect("https://" + req.headers.host + req.url);
        }
      } else {
        return next();
      }
    } else {
      return next();
    }
  });

  // Setting the app router and static folder
  app.use(express.static(path.resolve("./public")));

  // Globbing routing files
  config.getGlobbedFiles("./app/routes/**/*.js").forEach(function(routePath) {
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
      error: err.message,
      stack: err.stack,
    });
  });

  // Assume 404 since no middleware responded
  app.use(function(req, res) {
    res.status(404).send({
      url: req.originalUrl,
      error: "Not Found",
    });
  });

  return app;
};
