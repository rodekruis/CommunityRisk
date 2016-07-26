'use strict';

// Setting up route
angular.module('maps').config(['$stateProvider',
	function($stateProvider) {
		// Maps state routing
		$stateProvider.
		state('listMaps', {
			url: '/maps',
			templateUrl: 'modules/maps/views/list-maps.client.view.html'
		}).
		state('createMap', {
			url: '/maps/create',
			templateUrl: 'modules/maps/views/create-map.client.view.html'
		}).
		state('proxy', {
			url: '/maps/proxy/:url',
			templateUrl: 'modules/maps/views/create-map.client.view.html'
		}).
		state('viewMap', {
			url: '/maps/:mapId',
			templateUrl: 'modules/maps/views/view-map.client.view.html'
		}).
		state('viewMapCenter', {
			url: '/maps/:mapId/:centerLat/:centerLng/:centerZoom/:activeLayers',
			templateUrl: 'modules/maps/views/view-map.client.view.html'
		}).
		state('editMap', {
			url: '/maps/:mapId/edit',
			templateUrl: 'modules/maps/views/edit-map.client.view.html'
		}).
		state('icons', {
			url: '/icons',
			templateUrl: 'modules/maps/views/icons.client.view.html'
		})
		;
	}
]);