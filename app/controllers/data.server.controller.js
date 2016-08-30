'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash'),
    config = require('../../config/config'),
	pg = require('pg');

/**
 * Get the error message from error object
 */
var getErrorMessage = function(err) {
	var message = '';

	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				message = 'Map already exists';
				break;
			default:
				message = 'Something went wrong';
		}
	} else {
		for (var errName in err.errors) {
			if (err.errors[errName].message) message = err.errors[errName].message;
		}
	}

	return message;
};

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
	
	//if (err) return {next(err);};
	//if (!adminLevel) return {res.send(400, { message: 'Failed to load adminLevel'});};
	
	var connString = config.postgres; //'postgres://postgres@localhost/Community_Profiling';
	
	pg.connect(connString, function(err, client) {

        var sql1 = 'SELECT usp_data(';
		var sql2 = '\');';
		var sql = sql1 + adminLevel + sql2;
		console.log(sql);
        
		client.query(sql, function(err, result) {
			req.pgData = result.rows[0];
			//console.log(req.pgData);
			next();
        });
    });
	
		//if(adminLevel !== null){}
		
		//if (err) return next(err);
		//if (err) return res.json(500); //return next(err);
		
};

/**
 * Map authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.map.user.id !== req.user.id) {
		return res.send(403, {
			message: 'User is not authorized'
		});
	}
	next();
};

