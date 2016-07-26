'use strict';
/*
// Setting up route
angular.module('forms').config(['$urlRouterProvider', '$stateProvider',
	function($urlRouterProvider, $stateProvider) {
		
		// Maps state routing
		$stateProvider
		.state('model::all', {
			url : '/forms',
			templateUrl: 'modules/forms/views/list-forms.client.view.html'
		})
		.state('model::edit',{
			url: '/forms/:model/:id/edit',		
			templateUrl: 'modules/forms/views/base-edit.client.view.html'
		})
		.state('model::new',{
			url: '/forms/:model/new',
			templateUrl: 'modules/forms/views/base-edit.client.view.html'
		})
		.state('model::list',{
			url: '/forms/:model',
			templateUrl: 'modules/forms/views/base-list.client.view.html',
		});
	}
]);
*/



angular.module('forms').config(['routingServiceProvider', function(routingService) {
	routingService.start({
		html5Mode: false,
		routing: 'uirouter',
		prefix: '/forms',
		hashPrefix: '!',
		templatePath: 'modules/forms/views/',
		fixedRoutes: [
			{ route: '/forms', state: 'model::all', templateUrl: 'modules/forms/views/list-forms.html' }
		]
			
	});
}]);
