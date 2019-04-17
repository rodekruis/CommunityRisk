"use strict";

var _ = require("lodash");
var secrets = require("../secrets");
var productionConfig = require("./production.js");

module.exports = _.extend(productionConfig, {
  app: {
    title: "Rode Kruis Dashboards - staging",
    favicon: "/modules/core/img/510-logo_red_32x32.png",
  },
  port: process.env.PORT || 3001,
  sslport: process.env.SSLPORT || 445,
  postgres: {
    db: "cradatabase_staging",
    user: "cradatabase@510cradatabase",
    password: secrets.postgres.password_prod,
    host: "510cradatabase.postgres.database.azure.com",
    port: 5432,
  },
});
