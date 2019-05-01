var Sequelize = require("sequelize");
var config = require("../config/config");

var sequelize = new Sequelize(
  config.postgres.db,
  config.postgres.user,
  config.postgres.password,
  {
    dialect: "postgres",
    host: config.postgres.host,
    port: config.postgres.port,
  }
);

module.exports = sequelize;
