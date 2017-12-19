'use strict';

// Setting up route
angular.module('dashboards').config(['$stateProvider',
	function($stateProvider) {
		// dashboards state routing
		$stateProvider.
		state('listDashboards', {
			url: '/dashboards',
			templateUrl: 'modules/dashboards/views/list-dashboards.client.view.html'
		}).
		state('createDashboard', {
			url: '/dashboards/create',
			templateUrl: 'modules/dashboards/views/create-dashboards.client.view.html'
		}).
		state('viewDashboard', {
			//url: '/dashboards/:dashboardId/:templateUrl',
			url: '/:templateUrl',
			templateUrl: function ($stateParams){
				return 'modules/dashboards/views/' + $stateParams.templateUrl + '.client.view.html';
		    }
		}).
		state('editDashboard', {
			url: '/dashboards/:dashboardId/edit',
			templateUrl: 'modules/dashboards/views/edit-dashboards.client.view.html'
		})
		; 
	}
]);