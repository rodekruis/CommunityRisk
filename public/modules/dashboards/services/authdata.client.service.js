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

    return {
      getPoi: getPoi,
    };
  },
]);
