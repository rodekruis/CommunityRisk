'use strict';

//Maps service used for communicating with the Maps REST endpoints
angular.module('forms').factory('Forms', ['$resource', function($resource) {
    return $resource('api/models', {}, {'query':  {method:'GET', isArray:true}});
}]);