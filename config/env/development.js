'use strict';

var secrets = require('../secrets');

module.exports = {
	db: 'mongodb://localhost/dashboards_new', //im-dev',
	postgres: {
		db: 'profiles',
		user: 'profiles',
		password: secrets.postgres.password_dev,
		host: 'localhost'
	},
	//email_address: secrets.email.email_address,
	log: {
		// Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
		format: 'combined',
		// Stream defaults to process.stdout
		// Uncomment to enable logging to a log on the file system
		options: {
			stream: 'access.log'
		}
	},
	usehttp: true, // should a non encrypted server be launced?
	usessl: true, // should an encrypted server be launced?
	app: {
		title: 'Rode Kruis Dashboards - development'
	},
	facebook: {
		clientID: process.env.FACEBOOK_ID || 'APP_ID',
		clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
		callbackURL: 'http://localhost:3000/auth/facebook/callback'
	},
	twitter: {
		clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
		clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
		callbackURL: 'http://localhost:3000/auth/twitter/callback'
	},
	google: {
		clientID: process.env.GOOGLE_ID || 'APP_ID',
		clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
		callbackURL: 'http://localhost:3000/auth/google/callback'
	},
	linkedin: {
		clientID: process.env.LINKEDIN_ID || 'APP_ID',
		clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
		callbackURL: 'http://localhost:3000/auth/linkedin/callback'
	},
	azure: {
		clientID: secrets.azure.clientID,
		clientSecret: secrets.azure.clientSecret,
		tenantId: secrets.azure.tenantId,
		resource: 'https://graph.windows.net',
		redirectURL: 'http://localhost:3000/auth/azure/callback',
		redirectURLSSL: 'http://localhost:3000/auth/azure/callback'
	},
	onedrive : {
		oneDriveBusinessBaseUrl : 'https://rodekruis-my.sharepoint.com/_api/v2.0'
	},
	sharepoint : {
		sharePointSiteBaseUrl : 'https://rodekruis.sharepoint.com/clusterhulpverlening/hulpvoorvluchtelingen/_api/v2.0'
	},
	mailer: {
		from: process.env.MAILER_FROM || 'MAILER_FROM',
		options: {
			service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
			auth: {
				user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
				pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
			}
		}
	}
};