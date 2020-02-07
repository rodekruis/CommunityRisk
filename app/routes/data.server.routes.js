"use strict";

/**
 * Module dependencies.
 */
var data = require("../../app/controllers/data");

module.exports = function(app) {
  app.route("/data/table").get(data.getTable);
  app.route("/data/era").get(data.getEraData);
  app.route("/data/all").get(data.getData);
};
