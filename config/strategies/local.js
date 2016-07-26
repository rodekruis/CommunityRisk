'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	User = require('mongoose').model('User'),
	secrets = require('../secrets');

module.exports = function() {
	// Use local strategy
	passport.use(new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
		},
		function(email, password, done) {
			
			var domainRegex = /@(.*$)/i;
			
			try {
				// get domain from user email address in azure provided data
				var matches = email.match(domainRegex);
				var domain = matches[1].toLowerCase();
				
				// test if email is within valid domain in secrets.json
				if (secrets.domains.indexOf(domain) > -1) {
					User.findOne({
						email: email
					}, function(err, user) {
						if (err) {
							return done(err);
						}
						if (!user) {
							return done(null, false, {
								message: 'Unknown user'
							});
						}
						if (!user.authenticate(password)) {
							return done(null, false, {
								message: 'Invalid password'
							});
						}
						
						return done(null, user);
					});
				}else{
					// fail        
					done(new Error('Dit is geen geldig domein waarmee u kunt inloggen'));
				 }
			}
					
			catch (e) {
				console.log(e);
			}			
		}
	));
};