'use strict';

//CartoDB service used for communicating with the articles REST endpoints
angular.module('dashboards')
.factory('Sources', ['$resource', function($resource) {
    return $resource('/sources/:id', {
        id: '@_id'
    });

}]);