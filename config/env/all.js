'use strict';

module.exports = {
	app: {
		title: 'Rode Kruis Dashboards',
		description: 'Full-Stack JavaScript with MongoDB, Express, AngularJS, and Node.js',
		keywords: 'MongoDB, Express, AngularJS, Node.js'
	},
	port: process.env.PORT || 3000,
	sslport: process.env.SSLPORT || 444,
	key_file: './config/cert/localhost-key.pem',
	cert_file: './config/cert/localhost-cert.pem',
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	assets: {
		lib: {
			css: [
				'public/build/bower/forms-angular/css/forms-angular-with-bs3.css', // in bower.json
				'public/build/bower/bootstrap/css/bootstrap.min.css', // in bower.json
				'public/build/custom/bootstrap/css/bootstrap-theme.min.css', // in bower.json
				'public/build/custom/leaflet/css/leaflet.css', // in bower.json
				'public/build/bower/cartodb.js/css/cartodb.css', // in bower.json
				'public/build/bower/angular/css/angular-csp.css', // in bower.json
				'public/build/bower/mdi/css/materialdesignicons.min.css', // in bower.json
				'public/build/bower/dcjs/css/dc.css', // in bower.json
				'public/build/custom/dc-leaflet/css/dc-leaflet-legend.min.css', // NOT in bower.json
				//'public/build/bower/materialize/css/materialize.css', // in bower.json
				'public/build/bower/angular-loading-bar/css/loading-bar.css', // in bower.json
				'public/build/bower/leaflet-search/js/leaflet-search.src.css' // in bower.json
				
			],
			js: [

				'public/build/bower/jquery/js/jquery.min.js', // in bower.json
				'public/build/bower/crossfilter/js/crossfilter.min.js',
				//'public/lib/jquery-ui/ui/jquery-ui.js',
				'public/build/bower/lodash/js/lodash.underscore.min.js', //in bower.json
				'public/build/bower/angular/js/angular.js', //in bower.json
				'public/build/bower/angular-lodash/js/angular-lodash.js', //in bower.json
				'public/build/bower/angular-route/js/angular-route.js', //in bower.json
				'public/build/bower/angular-resource/js/angular-resource.js', //in bower.json
				'public/build/bower/angular-cookies/js/angular-cookies.js', //in bower.json 
				'public/build/bower/angular-touch/js/angular-touch.js', 
				'public/build/bower/angular-sanitize/js/angular-sanitize.js', 
				'public/build/bower/angular-ui-router/js/angular-ui-router.min.js',
				'public/build/bower/bootstrap/js/bootstrap.min.js',
				'public/build/bower/angular-bootstrap/js/ui-bootstrap-tpls.js',
				'public/build/bower/leaflet/js/leaflet-src.js',//in bower.json
				'public/build/bower/angular-leaflet-directive/js/angular-leaflet-directive.js', // in bower.json
				'public/build/bower/leaflet-search/js/leaflet-search.src.js',
				'public/build/bower/leaflet-ajax/js/leaflet.ajax.js',
				'public/build/bower/angular-gettext/js/angular-gettext.js',
				'public/dist/translations.js',
				'public/build/bower/Snap.svg/js/snap.svg-min.js',
				'public/build/bower/d3/js/d3.js',
				'public/build/bower/dcjs/js/dc.js', //in bower.json
				'public/build/custom/dc-leaflet/js/dc-leaflet-dev.js', // NOT in bower.json
				//'public/build/custom/leaflet-map/js/dc-leaflet.js', // NOT in bower.json
				//'public/build/bower/materialize/js/materialize.js',
				'public/build/custom/leaflet-stamen/tile.stamen.js', // NOT in bower.json
				'public/build/custom/angular-dc/js/angular-dc.js', //in bower.json
				'public/build/custom/forms-angular/js/forms-angular.js', //in bower.json
				'public/build/bower/angular-messages/js/angular-messages.js', //in bower.json
				'public/build/bower/ngInfiniteScroll/js/ng-infinite-scroll.js',//in bower.json
				'public/build/bower/angular-elastic/js/elastic.js', //in bower.json
				'public/build/bower/underscore/js/underscore.js',//in bower.json
				'public/build/bower/angular-loading-bar/js/loading-bar.js',
				'public/build/bower/leaflet-gps/js/leaflet-gps.min.js', // in bower.json
				'https://maps.googleapis.com/maps/api/js?v=3&sensor=true',
				'public/build/bower/cartodb.js/js/cartodb_noleaflet.js', // in bower.json
				'public/build/bower/topojson/js/topojson.min.js' // in bower.json
			]
		},
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/*[!tests]*/*.js'
		],
		tests: [
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/*/tests/*.js'
		]
	}
};