"use strict";

/**
 * Module dependencies.
 */
var config = require("../../config/config");
var pg = require("pg");

var pool = new pg.Pool({
  host: config.postgres.host,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.db,
  port: config.postgres.port,
});

exports.read = function(req, res) {
  res.jsonp(req.pgData);
};

exports.getFbfJsonData = function(req, res, next) {
  console.log("Getting FBF JSON Data:", req.query);

  pool.connect(function(err, client, release) {
    if (err) return next(err);

    client.query(
      {
        text: "SELECT usp_fbf_data($1::text, $2::text);",
        values: [req.query.country, req.query.type],
      },
      function(err, result) {
        if (err) return next(err);

        res.jsonp(result.rows[0].usp_fbf_data);
        release();
      }
    );
  });
};

exports.getPoi = function(req, res, next) {
  console.log("Getting POIs:", req.query);

  pool.connect(function(err, client, release) {
    if (err) return next(err);

    client.query(
      {
        text: "SELECT usp_fbf_geodata($1::text, $2::text);",
        values: [req.query.country, req.query.type],
      },
      function(err, result) {
        if (err) return next(err);

        res.jsonp(result.rows[0].usp_fbf_geodata.features);
        release();
      }
    );
  });
};
