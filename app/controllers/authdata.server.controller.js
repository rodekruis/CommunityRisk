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
});

exports.read = function(req, res) {
  res.jsonp(req.pgData);
};

exports.getData = function(req, res, next) {
  console.log("Getting all sort of data!!");

  pool.connect(function(err, client, release) {
    if (err) return next(err);

    var sql =
      "SELECT jsonb_build_object(                                " +
      "    'type', 'Feature',                                    " +
      "    'id', id,                                             " +
      "    'geometry', ST_AsGeoJSON(geom)::jsonb,                " +
      "    'properties', to_jsonb(row) - 'id' - 'geom'           " +
      ") FROM(SELECT * FROM auth_zmb_source.glofas_stations) row;";

    client.query(sql, function(err, result) {
      if (err) return next(err);

      req.pgData = result.rows;
      release();
      next();
    });
  });
};

exports.getPoi = function(req, res, next) {
  console.log("Getting POIs:", req.query);

  pool.connect(function(err, client, release) {
    if (err) return next(err);

    client.query(
      {
        text: "SELECT usp_fbf_zambia($1::text, $2::text);",
        values: [req.query.country, req.query.type],
      },
      function(err, result) {
        if (err) return next(err);

        res.jsonp(result.rows[0].usp_fbf_zambia.features);
        release();
      }
    );
  });
};
