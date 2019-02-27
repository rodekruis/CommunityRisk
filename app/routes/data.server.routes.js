"use strict";

/**
 * Module dependencies.
 */
var data = require("../../app/controllers/data");

module.exports = function(app) {
  app.route("/data/:adminLevel").get(data.read);

  // Finish by binding the middleware
  app.param("adminLevel", data.getData);
};
