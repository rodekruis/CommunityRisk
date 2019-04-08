"use strict";

angular.module("dashboards").factory("helpers", [
  "cfpLoadingBar",
  function(cfpLoadingBar) {
    /**
     * Start/complete functions
     *
     * @param nothing
     *
     * @returns nothing
     */
    function start() {
      cfpLoadingBar.start();
    }
    function complete() {
      cfpLoadingBar.complete();
    }

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
     * @param {Object} geom
     * @param {String} attribute
     * @param {String} field
     */
    function lookUpProperty(geom, attribute, field) {
      var lookup = {};

      geom.features.forEach(function(e) {
        lookup[e.properties[attribute]] = String(e.properties[field]);
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
    /**
     * Number formats
     *
     */
    //Define number formats for absolute numbers and for percentage metrics
    var dec0Format = d3.format(",.0f");
    var dec2Format = d3.format(".2f");
    var percFormat = d3.format(",.2%");

    var currentFormat = function(type, value) {
      if (type === "decimal0") {
        return dec0Format(value);
      } else if (type === "decimal2") {
        return dec2Format(value);
      } else if (type === "percentage") {
        return percFormat(value);
      }
    };

    return {
      start: start,
      complete: complete,
      nullToEmptyString: nullToEmptyString,
      lookUpProperty: lookUpProperty,
      genLookup_meta: genLookup_meta,
      lookUpByCountryCode: lookUpByCountryCode,
      lookUpByName: lookUpByName,
      dec0Format: dec0Format,
      dec2Format: dec2Format,
      percFormat: percFormat,
      currentFormat: currentFormat,
    };
  },
]);
