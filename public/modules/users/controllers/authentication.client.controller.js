"use strict";

angular.module("users").controller("AuthenticationController", [
  "$scope",
  "$http",
  "$location",
  "Authentication",
  function($scope, $http, $location, Authentication) {
    $scope.authentication = Authentication;

    var authRequest = function(requestEndpoint) {
      $http
        .post(requestEndpoint, $scope.credentials)
        .success(function(response) {
          $scope.authentication.user = response;
          $location.path("/fbf");
        })
        .error(function(response) {
          $scope.error = response.message;
        });
    };

    $scope.signin = function() {
      authRequest("/auth/signin");
    };

    $scope.signup = function() {
      authRequest("/auth/signup");
    };
  },
]);
