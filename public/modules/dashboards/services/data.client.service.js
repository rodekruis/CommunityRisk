"use strict";

//Dashboards service used for communicating with the articles REST endpoints
angular.module("dashboards").factory("Data", [
  "$resource",
  function($resource) {
    return $resource("data/:adminLevel", {
      adminLevel: "@_id",
    });
  },
]);
