"use strict";

angular.module("dashboards").factory("AuthData", [
  "$resource",
  function($resource) {
    /**
     * @param {String} country
     * @param {String} type
     *
     * @returns {Array}
     */
    function getPoi(country, type) {
      return $resource("/authdata/poi").query({
        country: country,
        type: type,
      });
    }

    function getFbfJsonData(options, success) {
      return $resource("/authdata/json").query(
        {
          country: options.country,
          type: options.type,
        },
        success
      );
    }

    return {
      getPoi: getPoi,
      getFbfJsonData: getFbfJsonData,
    };
  },
]);
