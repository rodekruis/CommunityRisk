"use strict";

module.exports = function(app) {
  // User Routes
  var users = require("../controllers/users.server.controller");

  // Setting up the users profile api
  app.route("/users/me").get(users.me);
  app.route("/users").put(users.update);

  // Setting up the users password api
  app.route("/users/password").post(users.changePassword);
  app.route("/auth/forgot").post(users.forgot);
  app.route("/auth/reset/:token").get(users.validateResetToken);
  app.route("/auth/reset/:token").post(users.reset);

  // Setting up the users authentication api
  app.route("/auth/signin").post(users.signin);
  app.route("/auth/signout").get(users.signout);

  // Finish by binding the user middleware
  app.param("userId", users.userByID);
};
