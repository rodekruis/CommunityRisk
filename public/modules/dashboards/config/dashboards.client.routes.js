'use strict';

// Setting up route
angular.module('dashboards').config(['$stateProvider',/*'$routeProvider',*/
	function($stateProvider/* ,$routeProvider */) {
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
			url: '/dashboards/:dashboardId/:templateUrl',
			templateUrl: function ($stateParams){
				return 'modules/dashboards/views/' + $stateParams.templateUrl + '.client.view.html';
		    }/*,
			data: {
				css: 'modules/dashboards/css/dashboards.css'
			}*/
		}).
		state('editDashboard', {
			url: '/dashboards/:dashboardId/edit',
			templateUrl: 'modules/dashboards/views/edit-dashboards.client.view.html'
		})
		/*$routeProvider
        .when('/dashboards/:dashboardId/:templateUrl', {
            templateUrl: function ($stateParams){
				return 'modules/dashboards/views/' + $stateParams.templateUrl + '.client.view.html';
		    }, 
            css: function ($stateParams){
				return 'modules/dashboards/css/' + ($stateParams.templateUrl == 'priority_index_storyboard' ? $stateParams.templateUrl : 'dashboards') + '.css';
		    }
        }) */
		;
	}
]);