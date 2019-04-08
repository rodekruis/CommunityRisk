"use strict";

/**
 * Module dependencies.
 */
var users = require("../controllers/users");
var authdata = require("../controllers/authdata");

module.exports = function(app) {
  app.route("/authdata/poi").get(users.requiresLogin, authdata.getPoi);
  app.route("/authdata/json").get(users.requiresLogin, authdata.getFbfJsonData);

  //app.route("/authdata:parameters").get(users.requiresLogin, authdata.read);
  //app.param("parameters", authdata.getData);
};
