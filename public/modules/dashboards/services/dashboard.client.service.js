'use strict';

//Dashboards service used for communicating with the articles REST endpoints
angular.module('dashboards').factory('Dashboards', ['$resource', function($resource) {
    return $resource('dashboards/:dashboardId', {
        dashboardId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);