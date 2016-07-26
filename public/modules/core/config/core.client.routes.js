'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');


		
		// Maps state routing
		$stateProvider
		.state('otherwise', {
			url : '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		})
		.state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
]);