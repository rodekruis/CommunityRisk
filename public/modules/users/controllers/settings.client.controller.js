"use strict";

angular.module("users").controller("SettingsController", [
  "$scope",
  "$http",
  "$location",
  "Authentication",
  function($scope, $http, $location, Authentication) {
    $scope.user = Authentication.user;

    // If user is not signed in then redirect back home
    if (!$scope.user) {
      return $location.path("/");
    }

    // Change user password
    $scope.changeUserPassword = function() {
      $scope.success = $scope.error = null;

      $http
        .post("/users/password", $scope.passwordDetails)
        .success(function() {
          // If successful show success message and clear form
          $scope.success = true;
          $scope.passwordDetails = null;
        })
        .error(function(response) {
          $scope.error = response.message;
        });
    };

    $scope.languages = [
      { id: "nl_NL", name: "Nederlands" },
      { id: "en_EN", name: "English" },
    ];
  },
]);
