"use strict";
/**
 * Module dependencies.
 */
var init = require("./config/init");
init();
var config = require("./config/config"),
  https = require("https"),
  http = require("http"),
  fs = require("fs"),
  secrets = require("./config/secrets"),
  path = require("path"),
  constants = require("constants"),
  compression = require("compression"),
  passport = require("passport");

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Init the express application
var app = require("./config/express")();

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}

app.use(compression({ filter: shouldCompress }));

require("./config/passport")();
app.use(passport.initialize());
app.use(passport.session());

// Start the app on http by listening on <port>
if (config.usehttp) {
  var server = http.createServer(app);

  server.on("listening", function() {
    console.log("ok, http server is running on port " + config.port);
  });

  server.listen(config.port);
}

// set certicicates and start SSL server
if (config.usessl) {
  var sslconfig = {};
  if (Object.prototype.hasOwnProperty.call(config, "pfx_file")) {
    sslconfig.pfx = fs.readFileSync(
      path.resolve(__dirname, config.pfx_file),
      "UTF-8"
    );
  } else if (
    Object.prototype.hasOwnProperty.call(config, "key_file") &&
    Object.prototype.hasOwnProperty.call(config, "cert_file")
  ) {
    sslconfig.key = fs.readFileSync(
      path.resolve(__dirname, config.key_file),
      "UTF-8"
    );
    sslconfig.cert = fs.readFileSync(
      path.resolve(__dirname, config.cert_file),
      "UTF-8"
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(config, "ca_file") &&
    Object.prototype.hasOwnProperty.call(config, "ca2_file")
  ) {
    sslconfig.ca = [
      fs.readFileSync(path.resolve(__dirname, config.ca_file), "UTF-8"),
      fs.readFileSync(path.resolve(__dirname, config.ca2_file), "UTF-8"),
    ];
  } else if (Object.prototype.hasOwnProperty.call(config, "ca_file")) {
    sslconfig.ca = fs.readFileSync(
      path.resolve(__dirname, config.ca_file),
      "UTF-8"
    );
  }

  if (secrets.certificate.passphrase) {
    sslconfig.passphrase = secrets.certificate.passphrase;
  }

  sslconfig.secureProtocol = "SSLv23_method";
  sslconfig.secureOptions = constants.SSL_OP_NO_SSLv3;

  var sslServer = https.createServer(sslconfig, app);

  sslServer.on("listening", function() {
    console.log("ok, https server is running on port " + config.sslport);
  });

  sslServer.listen(config.sslport);
}

// Expose app
exports = module.exports = app;
