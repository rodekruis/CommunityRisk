'use strict';

//CartoDB service used for communicating with the articles REST endpoints
angular.module('dashboards')
.factory('GoogleSpreadsheet', ['$resource', function($resource) {
    return $resource('/googlespreadsheet/:id', {
        id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);