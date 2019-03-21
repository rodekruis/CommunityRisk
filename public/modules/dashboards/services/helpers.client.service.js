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
      var lookup = {};

      metaData.forEach(function(e) {
        lookup[e.variable] = nullToEmptyString(String(e[field]));
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
    function lookUpByCountryCode(metaData, field) {
      return lookup(metaData, "country_code", field);
    }

    /**
     * fill the lookup table with the metadata-information per variable
     *
     * @param {Object} metaData
     * @param {String} field
     *
     * @returns {Object}
     */
    function lookUpByName(metaData, field) {
      return lookup(metaData, "name", field);
    }

    /**
     * Generic lookup-function
     *
     * @param {Object} collection
     * @param {String} attribute
     * @param {String} field
     */
    function lookup(collection, attribute, field) {
      var lookup = {};

      collection.forEach(function(e) {
        lookup[e[attribute]] = String(e[field]);
      });

      return lookup;
    }

    return {
      nullToEmptyString: nullToEmptyString,
      genLookup: genLookup,
      genLookup_meta: genLookup_meta,
      lookUpByCountryCode: lookUpByCountryCode,
      lookUpByName: lookUpByName,
    };
  },
]);
