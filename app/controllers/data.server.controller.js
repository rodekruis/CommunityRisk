"use strict";

/**
 * Module dependencies.
 */

var config = require("../../config/config"),
  pg = require("pg");

var pool = new pg.Pool({
  host: config.postgres.host,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.db,
  port: config.postgres.port,
});

/**
 * Show the current map
 */
exports.read = function(req, res) {
  res.jsonp(req.pgData);
};

/**
 * AMap middleware
 */

exports.getData = function(req, res, next) {
  console.log("Getting data:", req.query);

  pool.connect(function(err, client, release) {
    if (err) return next(err);

    client.query(
      {
        text:
          "SELECT usp_data($1::int,$2::varchar,$3::text[],$4::varchar,$5::varchar,$6::varchar);",
        values: [
          req.query.admlevel,
          req.query.country,
          req.query.parent_codes,
          req.query.view,
          req.query.disaster_type,
          req.query.disaster_name,
        ],
      },
      function(err, result) {
        if (err) return next(err);

        res.jsonp([result.rows[0]]);
        release();
      }
    );
  });
};

exports.getTable = function(req, res, next) {
  console.log("Getting specific table:", req.query);

  pool.connect(function(err, client, release) {
    if (err) return next(err);

    client.query(
      {
        text: "SELECT usp_get_table($1::text, $2::text);",
        values: [req.query.schema, req.query.table],
      },
      function(err, result) {
        if (err) return next(err);

        res.jsonp(result.rows[0].usp_get_table);
        release();
      }
    );
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
