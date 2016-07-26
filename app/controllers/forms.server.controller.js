'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	_ = require('lodash');

/**
 * Map authorization middleware
 * Only allow users with role admin to this module
 */
exports.hasAuthorization = function(req, res, next) {
	if (_.intersection(req.user.roles, ['admin']).length) {
				return next();
			} else {
				return res.send(403, {
					message: 'User is not authorized'
				});
			}
};