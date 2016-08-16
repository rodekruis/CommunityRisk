'use strict';

/**
 * Module dependencies.
 */
var users = require('../../app/controllers/users'),
	dashboards = require('../../app/controllers/dashboards');

module.exports = function(app) {

	app.route('/dashboards/:dashboardId')
	    .get(dashboards.hasAuthorization, dashboards.read)
	    //.get(dashboards.hasAuthorization, dashboards.read, dashboards.postgisData)
		.put(users.requiresLogin, dashboards.hasAuthorization, dashboards.update)
	    .delete(users.requiresLogin, dashboards.hasAuthorization, dashboards.delete);
		
	app.route('/dashboards')
		.get(dashboards.list)
		.post(users.requiresLogin, dashboards.hasCreateAuthorization, dashboards.create);
		
	// Finish by binding the article middleware
	app.param('dashboardId', dashboards.dashboardByID);
};