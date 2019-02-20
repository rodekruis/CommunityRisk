"use strict";

/**
 * Module dependencies.
 */

var _ = require("lodash"),
  config = require("../../config/config"),
  pg = require("pg");

/**
 * Show the current map
 */
exports.read = function(req, res) {
  res.jsonp(req.pgData);
};

/**
 * AMap middleware
 */
exports.getData = function(req, res, next, parameters) {
  console.log("Getting all sort of data!!");
  console.log("parameters", parameters);
  var connString =
    "postgres://" +
    config.postgres.user +
    ":" +
    config.postgres.password +
    "@" +
    config.postgres.host +
    "/" +
    config.postgres.db;
  console.log(connString);
  pg.connect(connString, function(err, client, release) {
    if (err) return next(err);

    var sql = `
            SELECT jsonb_build_object(
                'type', 'Feature',
                'id', id,
                'geometry', ST_AsGeoJSON(geom)::jsonb,
                'properties', to_jsonb(row) - 'id' - 'geom'
            ) FROM(SELECT * FROM auth_zmb_source.glofas_stations) row;`;

    client.query(sql, function(err, result) {
      if (err) return next(err);
      console.log(result.rows);
      req.pgData = result.rows;
      release();
      next();
    });
  });
  // console.log("req.pgDatareq.pgDatareq.pgDatareq.pgDatareq.pgData", req.pgData)
  // res.jsonp(req.pgData)
};
