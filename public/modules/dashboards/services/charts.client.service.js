"use strict";

// Generate charts and related functions
angular.module("dashboards").factory("chartService", [
  function() {
    /**
     * Create table with current crossfilter-selection output, so that you can also access this in other ways than through DC.js
     *
     * @param {*} map
     * @param {*} cf
     * @param {*} all
     *
     * @returns {Object}
     */
    function setupCharts(map, cf, all) {
      // Clear & Set up the charts
      dc.chartRegistry.clear();
      if (map !== undefined) {
        map.remove();
      }

      dc.dataCount("#count-info")
        .dimension(cf)
        .group(all);
    }

    return {
      setupCharts: setupCharts,
    };
  },
]);
