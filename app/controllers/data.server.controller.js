"use strict";

/**
 * Module dependencies.
 */

var config = require("../../config/config"),
  pg = require("pg");

var connString =
  "postgres://" +
  config.postgres.user +
  ":" +
  config.postgres.password +
  "@" +
  config.postgres.host +
  "/" +
  config.postgres.db;

/**
 * Show the current map
 */
exports.read = function(req, res) {
  res.jsonp(req.pgData);
};

/**
 * AMap middleware
 */
exports.getData = function(req, res, next, adminLevel) {
  pg.connect(connString, function(err, client, release) {
    if (err) return next(err);

    var sql1 = "SELECT usp_data(";
    var sql2 = ");";
    var sql = sql1 + adminLevel + sql2;
    console.log(sql);

    client.query(sql, function(err, result) {
      if (err) return next(err);
      req.pgData = result.rows[0];
      release();
      next();
    });
  });
};

exports.getPIMetadata = function(req, res, next) {
  pg.connect(connString, function(err, client, release) {
    if (err) return next(err);

    var sql = "SELECT usp_pi_metadata()";
    console.log(sql);

    client.query(sql, function(err, result) {
      if (err) return next(err);
      req.pgData = result.rows[0];
      release();
      next();
    });
  });
};

/**
 * Map authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
  if (req.map.user.id !== req.user.id) {
    return res.send(403, {
      message: "User is not authorized",
    });
  }
  next();
};
