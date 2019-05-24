"use strict";

angular.module("dashboards").factory("AuthData", [
  "$resource",
  function($resource) {
    /**
     * @param {Object} options
     * @param {String} options.country
     * @param {String} options.type
     * @param {Function} success
     *
     * @returns {*}
     */
    function getPoi(options, success) {
      return $resource("/authdata/poi").query(
        {
          country: options.country,
          type: options.type,
        },
        success
      );
    }

    /**
     * @param {Object} options
     * @param {String} options.country
     * @param {String} options.type
     * @param {Function} success
     *
     * @returns {*}
     */
    function getFbfJsonData(options, success) {
      return $resource("/authdata/json").query(
        {
          country: options.country,
          type: options.type,
        },
        success
      );
    }

    /**
     * @param {Object} options
     * @param {String} options.schema
     * @param {String} options.table
     * @param {Function} success
     *
     * @returns {*}
     */
    function getTable(options, success) {
      return $resource("/authdata/table").query(
        {
          schema: options.schema,
          table: options.table,
        },
        success
      );
    }

    return {
      getPoi: getPoi,
      getFbfJsonData: getFbfJsonData,
      getTable: getTable,
    };
  },
]);
