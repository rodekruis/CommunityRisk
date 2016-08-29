'use strict';

/**
 * Module dependencies.
 */
var users = require('../../app/controllers/users'),
	data = require('../../app/controllers/data');

module.exports = function(app) {

	app.route('/data/:adminLevel')
	    .get(data.read);
		
	// Finish by binding the middleware
	//app.param(['adminLevel','parentPcode'], data.getData);
	app.param('adminLevel', data.getData);
};