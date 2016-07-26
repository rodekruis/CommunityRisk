'use strict';

/**
 * Module dependencies.
 */

	
var mongoose = require('mongoose'),
	_ = require('lodash');
	
var proxy = require('../../app/controllers/proxy');

module.exports = function(app) {
		
	app.route('/proxy/:url')
		.get(proxy.read);
		
	// Finish by binding the article middleware
	app.param('url', proxy.proxyUrl);
};