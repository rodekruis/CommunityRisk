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

    /**
     * fill the lookup table with the metadata-information per variable
     *
     * @param {Object} metaData
     * @param {String} field
     *
     * @returns {Object}
     */
    function genLookup_meta(metaData, field) {
      var lookup_meta = {};

      metaData.forEach(function(e) {
        lookup_meta[e.variable] = nullToEmptyString(String(e[field]));
      });

      return lookup_meta;
    }

    return {
      nullToEmptyString: nullToEmptyString,
      genLookup: genLookup,
      genLookup_meta: genLookup_meta,
    };
  },
]);
