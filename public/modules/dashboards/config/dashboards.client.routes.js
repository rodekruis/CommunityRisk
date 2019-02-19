"use strict";

// Setting up route
angular.module("dashboards").config([
  "$stateProvider",
  function($stateProvider) {
    // dashboards state routing
    $stateProvider.state("viewDashboard", {
      url: "/:templateUrl",
      templateUrl: function($stateParams) {
        return (
          "modules/dashboards/views/" +
          $stateParams.templateUrl +
          ".client.view.html"
        );
      },
    });
  },
]);
