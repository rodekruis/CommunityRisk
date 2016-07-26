'use strict';

//Dropbox service used for communicating with the articles REST endpoints
angular.module('dashboards')
.factory('Dropbox', ['$resource', function($resource) {
    return $resource('/dropbox/:file', {
        file: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);