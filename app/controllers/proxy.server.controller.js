'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	_ = require('lodash'),
	request = require('request'),
	url = require('url');

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
 * get data through proxy
 */
exports.read = function(req, res) {
      res.jsonp(req.response);
};

exports.proxyUrl = function(req, res, next, url) {
	// The whole Url is passed as one parameter, so has to be decoded by to a normal url
	var decodedUrl = decodeURIComponent(url);
	request.get(decodedUrl, function (err, response, body) {
		if (err) return next(err);
		if (!response) return next(new Error('Failed to load proxy source from ' + url));
		
		var data = {};

		try {
		  data = JSON.parse(body);
		} catch (e) {
		  // An error has occured, handle it, by e.g. logging it
		  console.log(e);
		}
		
		req.response = data;
		next();
	});
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

