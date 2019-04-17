"use strict";

var secrets = require("../secrets");
var fs = require("fs");

module.exports = {
  app: {
    title: "Rode Kruis Dashboards - development",
    favicon: "/modules/core/img/510-logo_inverted_32x32.png",
  },
  usehttp: true,
  usessl:
    process.env.USE_HTTPS !== "false" &&
    (fs.existsSync("./config/cert/localhost-cert.pem") &&
      fs.existsSync("./config/cert/localhost-key.pem")),
  postgres: {
    db: "cradatabase",
    user: "cradatabase",
    password: secrets.postgres.password_dev,
    host: "localhost",
    port: 5439,
  },
  log: {
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: "combined",
    // Stream defaults to process.stdout
    // Uncomment to enable logging to a log on the file system
    options: {
      stream: "access.log",
    },
  },
  onedrive: {
    oneDriveBusinessBaseUrl: "https://rodekruis-my.sharepoint.com/_api/v2.0",
  },
  sharepoint: {
    sharePointSiteBaseUrl:
      "https://rodekruis.sharepoint.com/clusterhulpverlening/hulpvoorvluchtelingen/_api/v2.0",
  },
  mailer: {
    from: process.env.MAILER_FROM || "MAILER_FROM",
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || "MAILER_SERVICE_PROVIDER",
      auth: {
        user: process.env.MAILER_EMAIL_ID || "MAILER_EMAIL_ID",
        pass: process.env.MAILER_PASSWORD || "MAILER_PASSWORD",
      },
    },
  },
};
