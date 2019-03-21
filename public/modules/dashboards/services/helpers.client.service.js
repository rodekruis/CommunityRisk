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

    return {
      nullToEmptyString: nullToEmptyString,
    };
  },
]);
