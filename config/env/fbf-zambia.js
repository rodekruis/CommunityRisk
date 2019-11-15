"use strict";

var _ = require("lodash");
var secrets = require("../secrets");
var productionConfig = require("./production.js");

module.exports = _.extend(productionConfig, {
  app: {
    title: "FBF Zambia dashboard",
    favicon: "/modules/dashboards/img/redcross.png",
  },
  port: process.env.PORT || 3002,
  sslport: process.env.SSLPORT || 446,
  postgres: {
    db: "fbf_zambia",
    user: "cradatabase@510cradatabase",
    password: secrets.postgres.password_prod,
    host: "510cradatabase.postgres.database.azure.com",
    port: 5432,
  },
});
