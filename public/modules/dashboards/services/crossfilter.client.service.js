"use strict";

// Share URL
// Service to generate a url to share the current view/state of the dashboard
//
angular.module("dashboards").factory("crossfilterService", [
  function() {
    /**
     * Create parameter-specific URL
     *
     * @param {Object} data
     * @param {String} metric
     * @param {Function} meta_scorevar
     * @param {Array} tables
     *
     * @returns {multiple}
     *  */
    function setupCrossfilter(data, metric, meta_scorevar, tables) {
      var cf = crossfilter(data);

      // The wheredimension returns the unique identifier of the geo area
      var whereDimension = cf.dimension(function(d) {
        return d.pcode;
      });
      var whereDimension_tab = cf.dimension(function(d) {
        return d.pcode;
      });

      // Create the groups for these two dimensions (i.e. sum the metric)
      var whereGroupSum = whereDimension.group().reduceSum(function(d) {
        return d[metric];
      });
      whereDimension_tab.group().reduceSum(function(d) {
        return d[metric];
      });

      var whereGroupSum_lookup = whereDimension.group().reduce(
        function(p, v) {
          p.count = v[metric] !== null ? p.count + 1 : p.count;
          p.sum = p.sum + v[metric];
          return p;
        },
        function(p, v) {
          p.count = v[metric] !== null ? p.count - 1 : p.count;
          p.sum = p.sum - v[metric];
          return p;
        },
        function() {
          return { count: 0, sum: 0 };
        }
      );

      // Create value-lookup function
      var genLookup_value = function() {
        var lookup_value = {};
        whereGroupSum_lookup.top(Infinity).forEach(function(e) {
          lookup_value[e.key] = e.value.count == 0 ? "No data" : e.value.sum;
        });
        return lookup_value;
      };

      var cf_scores_metric = !meta_scorevar[metric]
        ? metric
        : meta_scorevar[metric];

      var whereGroupSum_scores = whereDimension.group().reduce(
        function(p, v) {
          p.count = v[cf_scores_metric] !== null ? p.count + 1 : p.count;
          p.sum = p.sum + v[cf_scores_metric];
          return p;
        },
        function(p, v) {
          p.count = v[cf_scores_metric] !== null ? p.count - 1 : p.count;
          p.sum = p.sum - v[cf_scores_metric];
          return p;
        },
        function() {
          return { count: 0, sum: 0 };
        }
      );
      var whereGroupSum_scores_tab = whereDimension_tab.group().reduce(
        function(p, v) {
          p.count = v[cf_scores_metric] !== null ? p.count + 1 : p.count;
          p.sum = p.sum + v[cf_scores_metric];
          return p;
        },
        function(p, v) {
          p.count = v[cf_scores_metric] !== null ? p.count - 1 : p.count;
          p.sum = p.sum - v[cf_scores_metric];
          return p;
        },
        function() {
          return { count: 0, sum: 0 };
        }
      );

      // group with all, needed for data-count
      var all = cf.groupAll();
      // get the count of the number of rows in the dataset (total and filtered)
      dc.dataCount("#count-info")
        .dimension(cf)
        .group(all);

      // Create customized reduce-functions to be able to calculated percentages over all or multiple districts (i.e. the % of male volunteers))
      var reduceAddAvg = function(metricA, metricB) {
        return function(p, v) {
          p.count = v[metricA] !== null ? p.count + 1 : p.count;
          p.sumOfSub += v[metricA] * v[metricB];
          p.sumOfTotal += v[metricB];
          p.finalVal = p.sumOfSub / p.sumOfTotal;
          return p;
        };
      };
      var reduceRemoveAvg = function(metricA, metricB) {
        return function(p, v) {
          p.count = v[metricA] !== null ? p.count - 1 : p.count;
          p.sumOfSub -= v[metricA] * v[metricB];
          p.sumOfTotal -= v[metricB];
          p.finalVal = p.sumOfSub / p.sumOfTotal;
          return p;
        };
      };
      var reduceInitialAvg = function() {
        return { count: 0, sumOfSub: 0, sumOfTotal: 0, finalVal: 0 };
      };

      //All data-tables are not split up in dimensions. The metric is always the sum of all selected records. Therefore we create one total-dimension
      var totaalDim = cf.dimension(function() {
        return "Total";
      });

      //Create the appropriate crossfilter dimension-group for each element of Tables
      var dimensions = [];
      tables.forEach(function(t) {
        var name = t.name;
        if (t.propertyPath === "value.finalVal") {
          var weight_var = t.weight_var;
          dimensions[name] = totaalDim
            .group()
            .reduce(
              reduceAddAvg([name], [weight_var]),
              reduceRemoveAvg([name], [weight_var]),
              reduceInitialAvg
            );
        } else if (t.propertyPath === "value") {
          dimensions[name] = totaalDim.group().reduceSum(function(d) {
            return d[name];
          });
        }
      });

      // Make a separate one for the filling of the bar charts (based on 0-10 score per indicator)
      var dimensions_scores = [];
      tables.forEach(function(t) {
        var name = t.name;
        if (t.scorevar_name) {
          var name_score = t.scorevar_name;
          if (t.propertyPath === "value.finalVal") {
            var weight_var = t.weight_var;
            dimensions_scores[name] = totaalDim
              .group()
              .reduce(
                reduceAddAvg([name_score], [weight_var]),
                reduceRemoveAvg([name_score], [weight_var]),
                reduceInitialAvg
              );
          } else if (t.propertyPath === "value") {
            dimensions_scores[name] = totaalDim.group().reduceSum(function(d) {
              return d[name_score];
            });
          }
        }
      });

      //Now attach the dimension to the tables-array
      for (var i = 0; i < tables.length; i++) {
        var name = tables[i].name;
        tables[i].dimension = dimensions[name];
      }

      return {
        cf: cf,
        whereDimension: whereDimension,
        whereDimension_tab: whereDimension_tab,
        whereGroupSum: whereGroupSum,
        whereGroupSum_lookup: whereGroupSum_lookup,
        cf_scores_metric: cf_scores_metric,
        whereGroupSum_scores: whereGroupSum_scores,
        whereGroupSum_scores_tab: whereGroupSum_scores_tab,
        all: all,
        dimensions: dimensions,
        dimensions_scores: dimensions_scores,
        tables: tables,
      };
    }

    return {
      setupCrossfilter: setupCrossfilter,
    };
  },
]);
