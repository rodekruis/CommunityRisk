"use strict";

// Communicate with the REST endpoint(s)
angular.module("dashboards").factory("Data", [
  "$resource",
  function($resource) {
    function getAll(options, success) {
      return $resource("data/all").query(
        {
          admlevel: options.admlevel,
          country: options.country,
          parent_codes: options.parent_codes,
          view: options.view,
          disaster_type: options.disaster_type,
          disaster_name: options.disaster_name,
        },
        success
      );
    }

    function getTable(options, success) {
      return $resource("/data/table").query(
        {
          schema: options.schema,
          table: options.table,
        },
        success
      );
    }

    return {
      getAll: getAll,
      getTable: getTable,
    };
  },
]);
