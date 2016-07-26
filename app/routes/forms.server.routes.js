'use strict';

/**
 * Module dependencies.
 */

var users = require('../../app/controllers/users'),
	forms = require('../../app/controllers/forms');
	
var mongoose = require('mongoose'),
	Dashboard = mongoose.model('Dashboard'),
	User = mongoose.model('User'),
	_ = require('lodash');
	
var FormsAngular = require('forms-angular');

module.exports = function(app) {	
	// Add form handler
	var secureOptions = {/*authentication: [users.requiresLogin, forms.hasAuthorization]*/};
	var DataFormHandler = new (FormsAngular)(app, secureOptions);
	DataFormHandler.newResource(Dashboard);
	DataFormHandler.newResource(User);
};