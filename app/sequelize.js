var Sequelize = require("sequelize");
var config = require("../config/config");

var connString =
  "postgres://" +
  config.postgres.user +
  ":" +
  config.postgres.password +
  "@" +
  config.postgres.host +
  ":5432/" +
  config.postgres.db;
var sequelize = new Sequelize(connString);

module.exports = sequelize;
