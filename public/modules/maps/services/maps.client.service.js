'use strict';

//Maps service used for communicating with the Maps REST endpoints
angular.module('maps')

.factory('_', ['$window',
      function($window) {
        // place lodash include before angular
        return $window._;
      }
    ])

.factory('Maps', ['$resource', function($resource) {
    return $resource('maps/:mapId', {
        mapsId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}])

.factory('Proxy', ['$resource', function($resource) {
    return $resource('proxy/:url', {
        url: '@_id'
    });
}])

.factory('CartoDB', ['$resource', function($resource) {
    return $resource('cartodb/:table', {
        table: '@_id'
    });
}]);