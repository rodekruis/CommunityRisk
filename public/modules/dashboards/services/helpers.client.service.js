"use strict";

angular.module("dashboards").factory("helpers", [
  function() {
    /**
     * Make sure to always return a string
     *
     * @param {any} value
     *
     * @returns {String}
     */
    function nullToEmptyString(value) {
      return value == null || value == "null" || !value ? "" : value;
    }

    /**
     * fill the lookup table which finds the community name with the community code
     *
     * @param {*} geom
     * @param {*} field
     */
    function genLookup(geom, field) {
      var lookup = {};
      var joinAttribute = "pcode";

      geom.features.forEach(function(e) {
        lookup[e.properties[joinAttribute]] = String(e.properties[field]);
      });
      return lookup;
    }

    return {
      nullToEmptyString: nullToEmptyString,
      genLookup: genLookup,
    };
  },
]);
