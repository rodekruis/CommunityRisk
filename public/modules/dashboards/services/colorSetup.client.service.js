"use strict";

// Cconfigure color scales for maps and charts
angular.module("dashboards").factory("colorSetupService", [
  "helpers",
  function(helpers) {
    /**
     * @param {*} admlevel
     * @param {*} zoom_min
     * @param {*} directURLload
     * @param {*} d
     * @param {*} meta_scorevar
     *
     * @returns {Object}
     */
    function setupThresholds(
      admlevel,
      zoom_min,
      directURLload,
      d,
      meta_scorevar
    ) {
      //Pool all values for all 0-10 score value together to determine quantile_range (so that quantile thresholds will not differ between indicators)
      if (admlevel == zoom_min || directURLload) {
        var quantile_range_scores = [];
        var j = 0;

        for (var i = 0; i < d.Rapportage.length; i++) {
          Object.keys(d.Rapportage[i]).forEach(function(key) {
            if (
              meta_scorevar[key] &&
              (d.Rapportage[i][meta_scorevar[key]] ||
                d.Rapportage[i][meta_scorevar[key]] == 0)
            ) {
              quantile_range_scores[j] = d.Rapportage[i][meta_scorevar[key]];
              j += 1;
            }
          });
        }
        quantile_range_scores.sort(function(a, b) {
          return a - b;
        });
        d.quantile_range_scores = quantile_range_scores;

        //Establish threshold-values for quantile-range (formula taken exactly from d3-library to mimic the way the thrsholds are established in the map, which happens automatically)
        var quantile = function(values, p) {
          var H = (values.length - 1) * p + 1,
            h = Math.floor(H),
            v = +values[h - 1],
            e = H - h;

          return e ? v + e * (values[h] - v) : v;
        };
        var k = 0,
          q = 5;
        var thresholds = [];
        while (++k < q)
          thresholds[k - 1] =
            Math.round(quantile(quantile_range_scores, k / q) * 100) / 100;
        d.thresholds = thresholds;
      }

      return d;
    }

    /**
     * Determine color of indicator-bars and -numbers in sidebar
     *
     * @param {*} ind
     * @param {*} ind_score
     * @param {*} group
     * @param {*} admlevel
     * @param {*} zoom_max
     * @param {*} filters
     * @param {*} d
     * @param {*} d_prev
     * @param {*} dimensions_scores
     *
     * @returns {String}
     */
    function high_med_low(
      ind,
      ind_score,
      group,
      admlevel,
      zoom_max,
      filters,
      d,
      d_prev,
      dimensions_scores
    ) {
      var width;

      if (dimensions_scores[ind]) {
        if (group == "dpi") {
          width = 10 * (1 - d.dpi[0][ind]);
        } else if (
          admlevel == zoom_max &&
          filters.length == 0 &&
          !isNaN(d_prev[ind_score])
        ) {
          width = d_prev[ind_score];
        } else {
          if (dimensions_scores[ind].top(1)[0].value.count == 0) {
            width = "na";
          } else {
            width = dimensions_scores[ind].top(1)[0].value.finalVal;
          }
        }
        if (ind == "dpi_score") {
          //This reflects that DPI < 0.1 is considered too low
          if (1 - width / 10 < 0.1) {
            return "bad";
          } else {
            return "good";
          }
        }

        //Assign categories to each value (categories relate through colors via CSS)
        if (isNaN(width)) {
          return "notavailable";
        } else if (width < d.thresholds[0]) {
          return "good";
        } else if (width <= d.thresholds[1]) {
          return "medium-good";
        } else if (width <= d.thresholds[2]) {
          return "medium";
        } else if (width <= d.thresholds[3]) {
          return "medium-bad";
        } else if (width > d.thresholds[3]) {
          return "bad";
        }
      }
    }

    /**
     * @param {*} meta_scorevar
     * @param {*} metric
     * @param {*} d
     * @param {*} quantileColorDomain_CRA_std
     * @param {*} quantileColorDomain_CRA_scores
     *
     * @returns {Object}
     */
    function mapchartColors(
      meta_scorevar,
      metric,
      d,
      quantileColorDomain_CRA_std,
      quantileColorDomain_CRA_scores
    ) {
      var quantile_range = [];

      if (meta_scorevar[metric]) {
        quantile_range = d.quantile_range_scores;
      } else {
        for (var i = 0; i < d.Rapportage.length; i++) {
          if (d.Rapportage[i][metric]) {
            quantile_range.push(d.Rapportage[i][metric]);
            quantile_range.sort(function sortNumber(a, b) {
              return a - b;
            });
          }
        }
        var quantile_max = quantile_range[quantile_range.length - 1];
      }

      var colorDomain;

      if (!meta_scorevar[metric]) {
        colorDomain = quantileColorDomain_CRA_std;
      } else {
        colorDomain = quantileColorDomain_CRA_scores;
      }

      return {
        colorScale: d3.scale
          .quantile()
          .domain(quantile_range)
          .range(colorDomain),
        quantile_max: quantile_max,
      };
    }

    /**
     * @param {*} metric
     * @param {*} d
     * @param {*} quantileColorDomain_CRA_std
     * @param {*} quantileColorDomain_PI_std
     * @param {*} quantileColorDomain_PI_error
     *
     * @returns {Object}
     */
    function mapchartColors_PI(
      metric,
      d,
      quantileColorDomain_CRA_std,
      quantileColorDomain_PI_std,
      quantileColorDomain_PI_error
    ) {
      var quantile_range = [];
      for (var i = 0; i < d.Rapportage.length; i++) {
        quantile_range[i] = d.Rapportage[i][metric];
        quantile_range.sort(function sortNumber(a, b) {
          return a - b;
        });
      }
      var quantile_max = quantile_range[quantile_range.length - 1];
      var colorDomain;

      if (helpers.genLookup_meta(d.Metadata, "group")[metric] == "pred_error") {
        colorDomain = quantileColorDomain_PI_error;
      } else if (
        helpers.genLookup_meta(d.Metadata, "view_code")[metric] == "CRA,PI"
      ) {
        colorDomain = quantileColorDomain_CRA_std;
      } else {
        colorDomain = quantileColorDomain_PI_std;
      }

      return {
        colorScale: d3.scale
          .quantile()
          .domain(quantile_range)
          .range(colorDomain),
        quantile_max: quantile_max,
      };
    }

    return {
      setupThresholds: setupThresholds,
      high_med_low: high_med_low,
      mapchartColors: mapchartColors,
      mapchartColors_PI: mapchartColors_PI,
    };
  },
]);
