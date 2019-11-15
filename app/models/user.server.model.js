"use strict";

var Sequelize = require("sequelize"),
  connection = require("../sequelize.js");

var attributes = {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9_-]+$/i,
    },
  },
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true,
    },
  },
  firstName: {
    type: Sequelize.STRING,
  },
  lastName: {
    type: Sequelize.STRING,
  },
  password: {
    type: Sequelize.STRING,
  },
  salt: {
    type: Sequelize.STRING,
  },
};

var options = {
  schema: "zmb_fbf",
  freezeTableName: true,
};

var User = connection.define("users", attributes, options);
// you can define relationships here

module.exports.User = User;
