"use strict";

// Setting up route
angular.module("users").config([
  "$stateProvider",
  function($stateProvider) {
    // Users state routing
    $stateProvider
      .state("password", {
        url: "/settings/password",
        templateUrl:
          "modules/users/views/settings/change-password.client.view.html",
      })
      .state("signin", {
        url: "/signin",
        templateUrl: "modules/users/views/signin.client.view.html",
      });
  },
]);
