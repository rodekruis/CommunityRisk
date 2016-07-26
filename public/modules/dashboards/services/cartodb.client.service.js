'use strict';

//CartoDB service used for communicating with the articles REST endpoints
angular.module('dashboards')
.factory('CartoDB', ['$resource', function($resource) {
    return $resource('/cartodb/:table', {
        table: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);