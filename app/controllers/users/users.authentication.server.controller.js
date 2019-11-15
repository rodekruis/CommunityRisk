"use strict";

/**
 * Module dependencies.
 */
var errorHandler = require("../errors.server.controller"),
  passport = require("passport"),
  User = require("../../models/user.server.model"),
  bcrypt = require("bcrypt");

/**
 * Signup
 */
exports.signup = function(req, res) {
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  console.log("Signup");
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  console.log("Data is", username, password);

  if (!username || !password || !password2) {
    return res.status(404).send("Please, fill in all the fields.");
  }

  if (password !== password2) {
    return res.status(404).send("Please, enter the same password twice.");
  }

  var salt = bcrypt.genSaltSync(10);
  var hashedPassword = bcrypt.hashSync(password, salt);

  var newUser = {
    username: username,
    salt: salt,
    password: hashedPassword,
  };

  User.User.create(newUser)
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err),
      });
    })
    .then(function() {
      newUser.password = undefined;
      newUser.salt = undefined;
      return res.json(newUser);
    });
};

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {
  passport.authenticate("local", function(err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;
      req.login(user, function(err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function(req, res) {
  req.logout();
  res.redirect("/");
};
