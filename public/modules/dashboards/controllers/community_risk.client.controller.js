"use strict";

angular.module("dashboards").controller("CommunityRiskController", [
  "$translate",
  "$scope",
  "$rootScope",
  "$compile",
  "$filter",
  "Authentication",
  "Data",
  "cfpLoadingBar",
  "helpers",
  "exportService",
  "shareService",
  function(
    $translate,
    $scope,
    $rootScope,
    $compile,
    $filter,
    Authentication,
    Data,
    cfpLoadingBar,
    helpers,
    exportService,
    shareService
  ) {
    ////////////////////////
    // SET MAIN VARIABLES //
    ////////////////////////

    $scope.change_country = function(country) {
      $scope.country_code = country;
      $scope.parent_codes = [];
      $scope.metric = "";
      $scope.initiate($rootScope.view_code);
    };

    //////////////////////
    // DEFINE VARIABLES //
    //////////////////////

    $rootScope.loadCount = 0;
    $scope.reload = 0;
    $scope.authentication = Authentication;
    $scope.geom = null;
    $scope.country_code = "PHL";
    $scope.view_code = "CRA";
    $scope.metric = "";
    if ($rootScope.country_code) {
      $scope.country_code = $rootScope.country_code;
    }
    $rootScope.country_code = null;
    if ($rootScope.view_code) {
      $scope.view_code = $rootScope.view_code;
    }
    $scope.metric_label = "";
    $scope.metric_year = "";
    $scope.metric_source = "";
    $scope.metric_desc = "";
    $scope.metric_icon = "";
    $scope.name_selection = "";
    $scope.name_selection_prev = "";
    $scope.name_popup = "";
    $scope.value_popup = 0;
    $scope.country_selection = "";
    $scope.parent_codes = [];
    $scope.data_input = "";
    $scope.filters = [];
    $scope.tables = [];
    $scope.quantileColorDomain_CRA_std = [
      "#f1eef6",
      "#bdc9e1",
      "#74a9cf",
      "#2b8cbe",
      "#045a8d",
    ];
    $scope.quantileColorDomain_CRA_scores = [
      "#1a9641",
      "#a6d96a",
      "#f1d121",
      "#fd6161",
      "#d7191c",
    ];
    var mapfilters_length = 0;
    var d_prev = "";
    var map;

    ///////////////////////
    // INITIAL FUNCTIONS //
    ///////////////////////

    $scope.start = function() {
      cfpLoadingBar.start();
    };
    $scope.complete = function() {
      cfpLoadingBar.complete();
    };

    ////////////////////////
    // INITIATE DASHBOARD //
    ////////////////////////

    $scope.initiate = function() {
      //Start loading bar
      $scope.start();

      //Load the map-view by default
      $("#row-chart-container").hide();
      $("#map-chart").show();
      $scope.chart_show = "map";

      //Determine if a parameter-specific URL was entered, and IF SO, set the desired parameters
      var url = location.href;
      if (url.indexOf("?") > -1) {
        url = url.split("?")[1];
        $scope.country_code = url
          .split("&")[0]
          .split("=")[1]
          .toUpperCase();
        if (url.split("&")[1]) {
          $scope.directURLload = true;
          $scope.admlevel = url.split("&")[1].split("=")[1];
          $scope.metric = url.split("&")[2].split("=")[1];
          $scope.chart_show = url.split("&")[4].split("=")[1];
          $scope.parent_codes =
            url.split("&")[3].split("=")[1] == ""
              ? []
              : url
                  .split("&")[3]
                  .split("=")[1]
                  .split(",");
        } else {
          $scope.directURLload = false;
        }
        window.history.pushState({}, document.title, "/#!/community_risk");
      } else {
        $scope.directURLload = false;
      }

      //Set some exceptions, can be done better in future (i.e. reading from metadata, BUT metadata is only readed later in the script currently)
      if (!$scope.directURLload) {
        $scope.admlevel = $scope.view_code == "CRA" ? 1 : 3;
        if (
          $scope.view_code == "CRA" &&
          ["PHL", "MWI", "NPL", "LKA", "MOZ"].indexOf($scope.country_code) > -1
        ) {
          $scope.admlevel = 2;
        } //These countries have a different min zoom-level: code better in future.
      }

      //This is the main search-query for PostgreSQL
      $scope.parent_codes_input = "{" + $scope.parent_codes.join(",") + "}";
      $scope.data_input =
        $scope.admlevel +
        ",'" +
        $scope.country_code +
        "','" +
        $scope.parent_codes_input +
        "','" +
        $scope.view_code +
        "','" +
        $scope.disaster_type +
        "','" +
        $scope.disaster_name +
        "'";

      Data.get({ adminLevel: $scope.data_input }, function(pgData) {
        $scope.load_data(pgData);
      });
    };

    ///////////////
    // LOAD DATA //
    ///////////////

    $scope.load_data = function(pgData) {
      var d = {};
      var i;

      // 1. Geo-data
      d.Districts = pgData.usp_data.geo;
      d.Districts.features = $.grep(d.Districts.features, function(e) {
        return e.properties.pcode !== null;
      });
      $scope.geom = d.Districts;

      // 2. Feature data
      d.Rapportage = [];
      for (i = 0; i < d.Districts.features.length; i++) {
        d.Rapportage[i] = d.Districts.features[i].properties;
      }

      // 3. Data Preparedness Index data
      d.dpi_temp = pgData.usp_data.dpi;
      d.dpi = [];
      if (d.dpi_temp) {
        for (i = 0; i < d.dpi_temp.length; i++) {
          if (d.dpi_temp[i].admin_level == $scope.admlevel) {
            d.dpi[0] = d.dpi_temp[i];
          }
        }
      }

      // 4. Variable-metadata
      d.Metadata_full = pgData.usp_data.meta_indicators;
      d.Metadata = $.grep(d.Metadata_full, function(e) {
        return (
          (e.view_code == "CRA" || e.view_code == "CRA,PI") &&
          helpers
            .nullToEmptyString(e.country_code)
            .indexOf($scope.country_code) > -1 &&
          e.admin_level >= $scope.admlevel &&
          e.admin_level_min <= $scope.admlevel
        );
      });

      // 5. Country-metadata
      d.Country_meta_full = pgData.usp_data.meta_country;
      d.Country_meta = $.grep(d.Country_meta_full, function(e) {
        return e.country_code == $scope.country_code;
      });

      //Clean up some styling (mainly for if you change to new country when you are at a lower zoom-level already)
      document
        .getElementsByClassName("sidebar-wrapper")[0]
        .setAttribute("style", "");
      document.getElementById("mapPopup").style.visibility = "hidden";
      document.getElementsByClassName("reset-button")[0].style.visibility =
        "hidden";
      if (document.getElementById("level2")) {
        document
          .getElementById("level2")
          .setAttribute("class", "btn btn-secondary");
      }
      if (document.getElementById("level3")) {
        document
          .getElementById("level3")
          .setAttribute("class", "btn btn-secondary");
      }
      $(".sidebar-wrapper").addClass("in");
      $(document).ready(function() {
        if ($(window).width() < 768) {
          $(".sidebar-wrapper").removeClass("in");
        }
      });
      for (i = 0; i < $("#menu-buttons.in").length; i++) {
        $("#menu-buttons.in")[i].classList.remove("in");
      }
      $(".view-buttons button.active").removeClass("active");
      $scope.chart_show == "map"
        ? $(".view-buttons button.btn-map-view").addClass("active")
        : $(".view-buttons button.btn-tabular").addClass("active");

      //Load actual content
      $scope.generateCharts(d);

      $(document).ready(function() {
        if ($(window).width() < 768) {
          $(".collapse-button").addClass("collapsed");
        }
      });

      // end loading bar
      $scope.complete();

      //Check if browser is IE (L_PREFER_CANVAS is a result from an earlier IE-check in layout.server.view.html)
      if ($rootScope.loadCount == 0 && typeof L_PREFER_CANVAS !== "undefined") {
        $("#IEmodal").modal("show");
        $rootScope.loadCount += 1;
      }
    };

    /////////////////////
    // REINITIATE DATA //
    /////////////////////
    $scope.reinitiate = function(d) {
      // start loading bar
      $scope.start();

      //Load the map-view by default
      $("#row-chart-container").hide();
      $("#map-chart").show();
      $scope.chart_show = "map";

      $scope.parent_codes_input = "{" + $scope.parent_codes.join(",") + "}";
      $scope.data_input =
        $scope.admlevel +
        ",'" +
        $scope.country_code +
        "','" +
        $scope.parent_codes_input +
        "','" +
        $scope.view_code +
        "','" +
        $scope.disaster_type +
        "','" +
        $scope.disaster_name +
        "'";

      Data.get({ adminLevel: $scope.data_input }, function(pgData) {
        $scope.reload_data(d, pgData);
      });
    };

    /////////////////
    // RELOAD DATA //
    /////////////////

    //Slightly adjusted version of prepare function upon reload. Needed because the d.Metadata could not be loaded again when the dashboard itself was not re-initiated.
    //Therefore the d-object needed to be saved, instead of completely re-created.
    $scope.reload_data = function(d, pgData) {
      // load data (metadata does not have to be reloaded)
      d.Districts = pgData.usp_data.geo;
      $scope.geom = pgData.usp_data.geo;
      d.Rapportage = [];
      for (var i = 0; i < d.Districts.features.length; i++) {
        d.Rapportage[i] = d.Districts.features[i].properties;
      }
      d.dpi = [];
      if (d.dpi_temp) {
        for (i = 0; i < d.dpi_temp.length; i++) {
          if (d.dpi_temp[i].admin_level == $scope.admlevel) {
            d.dpi[0] = d.dpi_temp[i];
          }
        }
      }
      d.Metadata = $.grep(d.Metadata_full, function(e) {
        return (
          (e.view_code == "CRA" || e.view_code == "CRA,PI") &&
          helpers
            .nullToEmptyString(e.country_code)
            .indexOf($scope.country_code) > -1 &&
          e.admin_level >= $scope.admlevel &&
          e.admin_level_min <= $scope.admlevel
        );
      });

      //Final CSS
      $(".view-buttons button.active").removeClass("active");
      $(".view-buttons button.btn-map-view").addClass("active");

      //Set reload-indicator to 1 (used for translations)
      $scope.reload = 1;

      //Load actual content
      $scope.generateCharts(d);

      // end loading bar
      $scope.complete();
    };

    ///////////////////////////////////////////
    // MAIN FUNCTION TO GENERATE ALL CONTENT //
    ///////////////////////////////////////////

    $scope.generateCharts = function(d) {
      // Clear the charts
      dc.chartRegistry.clear();
      if (map !== undefined) {
        map.remove();
      }

      //define dc-charts (the name-tag following the # is how you refer to these charts in html with id-tag)
      var mapChart = dc.leafletChoroplethChart("#map-chart");
      var rowChart = dc.rowChart("#row-chart");

      //////////////////////////
      // SETUP META VARIABLES //
      //////////////////////////

      //set up country metadata
      var country_name = helpers.lookUpByCountryCode(
        d.Country_meta,
        "country_name"
      );
      var country_zoom_min = helpers.lookUpByCountryCode(
        d.Country_meta,
        "zoomlevel_min"
      );
      var country_zoom_max = helpers.lookUpByCountryCode(
        d.Country_meta,
        "zoomlevel_max"
      );
      var country_default_metric = helpers.lookUpByCountryCode(
        d.Country_meta,
        "default_metric"
      );

      var country_status = helpers.lookUpByCountryCode(
        d.Country_meta,
        "format"
      )[$scope.country_code];

      function setViewStatus(isVisible) {
        var viewStatus = document.getElementById("status");

        if (viewStatus) {
          viewStatus.style.visibility = isVisible ? "visible" : "hidden";
        }
      }

      if (country_status == "template") {
        setViewStatus(true);
        $scope.status_title = "Template only";
        $scope.status_text =
          "This dashboard is only a template with administrative boundaries and population data. It is yet to be filled with actual risk data";
      } else if (country_status == "basic") {
        setViewStatus(true);
        $scope.status_title = "Draft version";
        $scope.status_text =
          "This dashboard is filled with a limited number of indicators only, which need to be checked in terms of quality and use. Not to be used for external sharing and/or drawing conclusions yet.";
      } else if (country_status == "all") {
        var dpi = d.dpi[0].dpi_score;
        if (dpi > 0.1) {
          setViewStatus(false);
          $scope.status_title = "";
          $scope.status_text = "";
        } else {
          setViewStatus(true);
          $scope.status_title = "Needs data";
          $scope.status_text =
            "The Data Preparedness Index of the risk framework for this administrative level falls below the threshold for meaningful interpretation. " +
            "It needs either more, newer or better data sources. The indicators that are included (e.g. population, poverty) can still be used on their own.";
        }
      }

      $scope.country_selection = country_name[$scope.country_code];
      var zoom_min = Number(country_zoom_min[$scope.country_code]);
      var zoom_max = Number(country_zoom_max[$scope.country_code]);
      $scope.inform_admlevel = Number(
        helpers.lookUpByCountryCode(d.Country_meta, "inform_admlevel")[
          $scope.country_code
        ]
      );

      if (!$scope.directURLload) {
        if ($scope.metric === "") {
          $scope.metric = country_default_metric[$scope.country_code];
        } else if (typeof d.Rapportage[0][$scope.metric] == "undefined") {
          $scope.metric = "population";
        }
      }
      if ($scope.admlevel === zoom_min) {
        $scope.name_selection = country_name[$scope.country_code];
      }
      if (zoom_max - zoom_min < 2) {
        document.getElementById("level3").style.visibility = "hidden";
      } else if (document.getElementById("level3")) {
        document.getElementById("level3").style.visibility = "visible";
      }

      // get the lookup tables
      var lookup = helpers.lookUpProperty($scope.geom, "pcode", "name");
      var meta_label = helpers.genLookup_meta(d.Metadata, "label");
      var meta_format = helpers.genLookup_meta(d.Metadata, "format");
      var meta_unit = helpers.genLookup_meta(d.Metadata, "unit");
      var meta_icon = helpers.genLookup_meta(d.Metadata, "icon_src");
      var meta_year = helpers.genLookup_meta(d.Metadata, "year");
      var meta_source = helpers.genLookup_meta(d.Metadata, "source_link");
      var meta_desc = helpers.genLookup_meta(d.Metadata, "description");
      var meta_scorevar = helpers.genLookup_meta(d.Metadata, "scorevar_name");

      $scope.metric_label = meta_label[$scope.metric];
      $scope.type_selection =
        $scope.admlevel == zoom_min
          ? "Country"
          : helpers.lookUpByCountryCode(
              d.Country_meta,
              "level" + ($scope.admlevel - 1) + "_name"
            )[$scope.country_code];
      $scope.subtype_selection = helpers.lookUpByCountryCode(
        d.Country_meta,
        "level" + $scope.admlevel + "_name"
      )[$scope.country_code];

      //Changes to be able to show ALL lower-level districts, for now only applied to Malawi
      $scope.levelB_selection_pre = "all_no";
      if (
        zoom_min == 1 ||
        $scope.country_code == "MWI" ||
        $scope.country_code == "MOZ"
      ) {
        //Apply different classes for this case
        $("#level2").addClass("btn-zoomin");
        $("#level3").addClass("btn-zoomin");

        if ($scope.admlevel == zoom_min) {
          $scope.levelB_selection_pre = "all_yes";
          $scope.levelB_selection = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + (zoom_min + 1) + "_name"
          )[$scope.country_code];
          $scope.levelB_code = "";
          $scope.levelB_codes = [];
        } else if (
          $scope.admlevel < zoom_max &&
          $scope.parent_codes.length > 0
        ) {
          $scope.levelB_selection = $scope.name_selection;
          $scope.levelB_codes = $scope.parent_codes;
        } else if (
          $scope.admlevel < zoom_max &&
          $scope.parent_codes.length == 0
        ) {
          //This is the direct URL-link case
          $scope.levelB_selection_pre = "all_yes";
          $scope.levelB_selection = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + (zoom_min + 1) + "_name"
          )[$scope.country_code];
          $scope.levelB_code = "";
          $scope.levelB_codes = [];
        } else if (
          $scope.admlevel == zoom_max &&
          $scope.parent_codes.length == 0
        ) {
          //This is the direct URL-link case
          $scope.levelB_selection_pre = "all_yes";
          $scope.levelB_selection = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + (zoom_min + 1) + "_name"
          )[$scope.country_code];
          $scope.levelB_code = "";
          $scope.levelB_codes = [];
        }
        if ($scope.admlevel < zoom_max) {
          $scope.levelC_selection_pre =
            $scope.parent_codes.length == 0 ? "all_yes" : undefined;
          $scope.levelC_selection =
            $scope.parent_codes.length == 0
              ? helpers.lookUpByCountryCode(
                  d.Country_meta,
                  "level" + (zoom_min + 2) + "_name"
                )[$scope.country_code]
              : undefined;
          $scope.levelC_code = "";
        } else if (
          $scope.admlevel == zoom_max &&
          $scope.parent_codes.length == 0
        ) {
          //This is the direct URL-link case
          $scope.levelC_selection_pre =
            $scope.parent_codes.length == 0 ? "all_yes" : undefined;
          $scope.levelC_selection =
            $scope.parent_codes.length == 0
              ? helpers.lookUpByCountryCode(
                  d.Country_meta,
                  "level" + (zoom_min + 2) + "_name"
                )[$scope.country_code]
              : undefined;
          $scope.levelC_code = "";
        } else if ($scope.parent_codes.length > 0) {
          $scope.levelC_selection = $scope.name_selection;
          $scope.levelC_code = $scope.parent_code;
        }
      } else {
        //Apply different classes for this case
        $("#level2").removeClass("btn-zoomin");
        $("#level3").removeClass("btn-zoomin");

        if ($scope.admlevel == zoom_min) {
          $scope.levelB_selection = undefined;
          $scope.levelB_codes = [];
        } else if (
          $scope.admlevel <= zoom_max &&
          $scope.levelB_selection == undefined
        ) {
          $scope.levelB_selection = $scope.name_selection;
          $scope.levelB_codes = $scope.parent_codes;
        }
        $scope.levelC_selection =
          $scope.admlevel < zoom_max ? undefined : $scope.name_selection;
        $scope.levelC_code =
          $scope.admlevel < zoom_max ? "" : $scope.parent_code;
      }

      /////////////////////
      // NUMBER FORMATS ///
      /////////////////////

      //Define number formats for absolute numbers and for percentage metrics
      var dec0Format = d3.format(",.0f");
      var dec2Format = d3.format(".2f");
      var percFormat = d3.format(",.2%");

      var currentFormat = function(value) {
        if (meta_format[$scope.metric] === "decimal0") {
          return dec0Format(value);
        } else if (meta_format[$scope.metric] === "decimal2") {
          return dec2Format(value);
        } else if (meta_format[$scope.metric] === "percentage") {
          return percFormat(value);
        }
      };

      //////////////////////
      // SETUP INDICATORS //
      //////////////////////

      d.Metadata.sort(function(a, b) {
        return a.order - b.order;
      });
      $scope.tables = [];
      var j = 0;
      for (var i = 0; i < d.Metadata.length; i++) {
        var record = {};
        var record_temp = d.Metadata[i];
        if (record_temp.group !== "admin") {
          record.id = "data-table" + [i + 1];
          record.name = record_temp.variable;
          record.group = record_temp.group;
          record.propertyPath =
            record_temp.agg_method === "sum" ? "value" : "value.finalVal";
          record.dimension = undefined;
          record.weight_var = record_temp.weight_var;
          record.scorevar_name = record_temp.scorevar_name;
          record.view = "CRA";
          $scope.tables[j] = record;
          j = j + 1;
        }
      }

      ///////////////////////
      // CROSSFILTER SETUP //
      ///////////////////////

      var cf = crossfilter(d.Rapportage);

      // The wheredimension returns the unique identifier of the geo area
      var whereDimension = cf.dimension(function(d) {
        return d.pcode;
      });
      var whereDimension_tab = cf.dimension(function(d) {
        return d.pcode;
      });

      // Create the groups for these two dimensions (i.e. sum the metric)
      var whereGroupSum = whereDimension.group().reduceSum(function(d) {
        return d[$scope.metric];
      });
      whereDimension_tab.group().reduceSum(function(d) {
        return d[$scope.metric];
      });

      var whereGroupSum_lookup = whereDimension.group().reduce(
        function(p, v) {
          p.count = v[$scope.metric] !== null ? p.count + 1 : p.count;
          p.sum = p.sum + v[$scope.metric];
          return p;
        },
        function(p, v) {
          p.count = v[$scope.metric] !== null ? p.count - 1 : p.count;
          p.sum = p.sum - v[$scope.metric];
          return p;
        },
        function() {
          return { count: 0, sum: 0 };
        }
      );

      // ...
      $scope.genLookup_value = function() {
        var lookup_value = {};
        whereGroupSum_lookup.top(Infinity).forEach(function(e) {
          lookup_value[e.key] = e.value.count == 0 ? "No data" : e.value.sum;
        });
        return lookup_value;
      };

      var cf_scores_metric = !meta_scorevar[$scope.metric]
        ? $scope.metric
        : meta_scorevar[$scope.metric];
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
      $scope.tables.forEach(function(t) {
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
      $scope.tables.forEach(function(t) {
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
      for (i = 0; i < $scope.tables.length; i++) {
        var name = $scope.tables[i].name;
        $scope.tables[i].dimension = dimensions[name];
      }

      ///////////////////////////////
      // SET UP ALL INDICATOR HTML //
      ///////////////////////////////

      //Create table with current crossfilter-selection output, so that you can also access this in other ways than through DC.js
      var fill_keyvalues = function() {
        var keyvalue = [];
        $scope.tables.forEach(function(t) {
          var key = t.name;
          if (t.group == "dpi") {
            keyvalue[key] = dec2Format(d.dpi[0][t.name]);
          } else if (
            $scope.admlevel == zoom_max &&
            $scope.filters.length == 0 &&
            !isNaN(d_prev[t.name])
          ) {
            if (meta_format[t.name] === "decimal0") {
              keyvalue[key] = dec0Format(d_prev[t.name]);
            } else if (meta_format[t.name] === "percentage") {
              keyvalue[key] = percFormat(d_prev[t.name]);
            } else if (meta_format[t.name] === "decimal2") {
              keyvalue[key] = dec2Format(d_prev[t.name]);
            }
          } else {
            if (t.propertyPath === "value.finalVal") {
              if (isNaN(dimensions[t.name].top(1)[0].value.finalVal)) {
                keyvalue[key] = "N.A. on this level";
              } else if (meta_format[t.name] === "decimal0") {
                keyvalue[key] = dec0Format(
                  dimensions[t.name].top(1)[0].value.finalVal
                );
              } else if (meta_format[t.name] === "percentage") {
                keyvalue[key] = percFormat(
                  dimensions[t.name].top(1)[0].value.finalVal
                );
              } else if (meta_format[t.name] === "decimal2") {
                keyvalue[key] = dec2Format(
                  dimensions[t.name].top(1)[0].value.finalVal
                );
              }
            } else if (t.propertyPath === "value") {
              if (isNaN(dimensions[t.name].top(1)[0].value)) {
                keyvalue[key] = "N.A. on this level";
              } else if (meta_format[t.name] === "decimal0") {
                keyvalue[key] = dec0Format(dimensions[t.name].top(1)[0].value);
              } else if (meta_format[t.name] === "percentage") {
                keyvalue[key] = percFormat(dimensions[t.name].top(1)[0].value);
              } else if (meta_format[t.name] === "decimal2") {
                keyvalue[key] = dec2Format(dimensions[t.name].top(1)[0].value);
              }
            }
          }
        });
        return keyvalue;
      };
      var keyvalue = fill_keyvalues();

      //Pool all values for all 0-10 score value together to determine quantile_range (so that quantile thresholds will not differ between indicators)
      if ($scope.admlevel == zoom_min || $scope.directURLload) {
        var quantile_range_scores = [];
        j = 0;
        for (i = 0; i < d.Rapportage.length; i++) {
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

      //Function for determining color of indicator-bars and -numbers in sidebar
      var high_med_low = function(ind, ind_score, group) {
        var width;
        if (dimensions_scores[ind]) {
          if (group == "dpi") {
            width = 10 * (1 - d.dpi[0][ind]);
          } else if (
            $scope.admlevel == zoom_max &&
            $scope.filters.length == 0 &&
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
      };

      $scope.createHTML = function(keyvalue) {
        var dpi_score = document.getElementById("dpi_score_main");
        if (dpi_score) {
          dpi_score.textContent = keyvalue.dpi_score;
          dpi_score.setAttribute(
            "class",
            "component-score " + high_med_low("dpi_score", "dpi_score", "dpi")
          );
        }
        var risk_score = document.getElementById("risk_score_main");
        if (risk_score) {
          risk_score.textContent = keyvalue.risk_score;
          risk_score.setAttribute(
            "class",
            "component-score " + high_med_low("risk_score", "risk_score")
          );
        }
        var vulnerability_score = document.getElementById(
          "vulnerability_score_main"
        );
        if (vulnerability_score) {
          vulnerability_score.textContent = keyvalue.vulnerability_score;
          vulnerability_score.setAttribute(
            "class",
            "component-score " +
              high_med_low("vulnerability_score", "vulnerability_score")
          );
        }
        var hazard_score = document.getElementById("hazard_score_main");
        if (hazard_score) {
          hazard_score.textContent = keyvalue.hazard_score;
          hazard_score.setAttribute(
            "class",
            "component-score " + high_med_low("hazard_score", "hazard_score")
          );
        }
        var coping_score = document.getElementById(
          "coping_capacity_score_main"
        );
        if (coping_score) {
          coping_score.textContent = keyvalue.coping_capacity_score;
          coping_score.setAttribute(
            "class",
            "component-score " +
              high_med_low("coping_capacity_score", "coping_capacity_score")
          );
        }

        //Dynamically create HTML-elements for all indicator tables
        var general = document.getElementById("general");
        var dpi = document.getElementById("dpi");
        var scores = document.getElementById("scores");
        var vulnerability = document.getElementById("vulnerability");
        var hazard = document.getElementById("hazard");
        var coping = document.getElementById("coping_capacity");
        var other = document.getElementById("other");
        if (general) {
          while (general.firstChild) {
            general.removeChild(general.firstChild);
          }
        }
        if (dpi) {
          while (dpi.firstChild) {
            dpi.removeChild(dpi.firstChild);
          }
        }
        if (scores) {
          while (scores.firstChild) {
            scores.removeChild(scores.firstChild);
          }
        }
        if (vulnerability) {
          while (vulnerability.firstChild) {
            vulnerability.removeChild(vulnerability.firstChild);
          }
        }
        if (hazard) {
          while (hazard.firstChild) {
            hazard.removeChild(hazard.firstChild);
          }
        }
        if (coping) {
          while (coping.firstChild) {
            coping.removeChild(coping.firstChild);
          }
        }
        if (other) {
          while (other.firstChild) {
            other.removeChild(other.firstChild);
          }
        }

        for (var i = 0; i < $scope.tables.length; i++) {
          var record = $scope.tables[i];
          var width;
          var icon;
          var unit;

          if (!meta_icon[record.name]) {
            icon = "modules/dashboards/img/undefined.png";
          } else {
            icon = "modules/dashboards/img/" + meta_icon[record.name];
          }

          if (meta_unit[record.name] === "null") {
            unit = "";
          } else {
            unit = meta_unit[record.name];
          }

          if (record.group === "general") {
            var div = document.createElement("div");
            div.setAttribute("class", "row profile-item");
            div.setAttribute("id", "section-" + record.name);
            var parent = document.getElementById(record.group);
            parent.appendChild(div);
            var div0 = document.createElement("div");
            div0.setAttribute("class", "col col-md-1 col-sm-1 col-xs-1");
            div.appendChild(div0);
            var img = document.createElement("img");
            img.setAttribute("class", "community-icon");
            img.setAttribute("src", icon);
            div0.appendChild(img);
            var div1 = document.createElement("div");
            div1.setAttribute(
              "class",
              "col col-md-5 col-sm-5 col-xs-5 general-component-label"
            );
            div1.setAttribute(
              "ng-click",
              "change_indicator('" + record.name + "')"
            );
            div1.innerHTML = "{{ '" + record.name + "' | translate }}";
            div.appendChild(div1);
            $compile(div1)($scope);
            var div2 = document.createElement("div");
            div2.setAttribute("class", "col col-md-5 col-sm-5 col-xs-5");
            div2.setAttribute("id", record.name);
            div2.innerHTML = keyvalue[record.name] + " " + unit;
            div.appendChild(div2);
            var div3 = document.createElement("div");
            div3.setAttribute("class", "col col-md-1 col-sm-1 col-xs-1");
            div.appendChild(div3);
            var button = document.createElement("button");
            button.setAttribute("type", "button");
            button.setAttribute("class", "btn-modal");
            button.setAttribute("data-toggle", "modal");
            button.setAttribute("ng-click", "info('" + record.name + "')");
            div3.appendChild(button);
            $compile(button)($scope);
            img = document.createElement("img");
            img.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
            img.setAttribute("style", "height:17px");
            button.appendChild(img);
          } else if (record.group === "other") {
            if (
              $scope.admlevel == zoom_max &&
              $scope.filters.length == 0 &&
              !isNaN(d_prev[record.scorevar_name])
            ) {
              width = d_prev[record.scorevar_name] * 10;
            } else {
              width = dimensions[record.name].top(1)[0].value.finalVal * 10;
            }

            if (
              !($scope.predictions == "no" && record.group == "predictions") &&
              !($scope.actuals == "no" && record.group == "damage") &&
              !(
                ($scope.predictions == "no" || $scope.actuals == "no") &&
                record.group == "pred_error"
              )
            ) {
              div = document.createElement("div");
              div.setAttribute("class", "component-section");
              div.setAttribute("id", "section-" + record.name);
              parent = document.getElementById(record.group);
              parent.appendChild(div);
              div0 = document.createElement("div");
              div0.setAttribute("class", "col-md-2 col-sm-2 col-xs-2");
              div.appendChild(div0);
              var img1 = document.createElement("img");
              img1.setAttribute("style", "height:20px");
              img1.setAttribute("src", icon);
              div0.appendChild(img1);
              div1 = document.createElement("div");
              div1.setAttribute(
                "class",
                "col-md-9 col-sm-9 col-xs-9 component-label"
              );
              div1.setAttribute(
                "ng-click",
                "change_indicator('" + record.name + "')"
              );
              div1.innerHTML = "{{ '" + record.name + "' | translate }}";
              $compile(div1)($scope);
              div.appendChild(div1);
              var div1a = document.createElement("div");
              div1a.setAttribute(
                "class",
                "component-score " +
                  high_med_low(record.name, record.scorevar_name)
              );
              div1a.setAttribute("id", record.name);
              div1a.innerHTML = keyvalue[record.name] + " " + unit;
              div1.appendChild(div1a);
              div3 = document.createElement("div");
              div3.setAttribute(
                "class",
                "col-md-1 col-sm-1 col-xs-1 no-padding"
              );
              div.appendChild(div3);
              button = document.createElement("button");
              button.setAttribute("type", "button");
              button.setAttribute("class", "btn-modal");
              button.setAttribute("data-toggle", "modal");
              button.setAttribute("ng-click", "info('" + record.name + "')");
              div3.appendChild(button);
              $compile(button)($scope);
              var img3 = document.createElement("img");
              img3.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
              img3.setAttribute("style", "height:17px");
              button.appendChild(img3);
            }
          } else if (record.group !== "hide") {
            if (record.group == "dpi") {
              width = d.dpi[0][record.name] * 100;
            } else if (
              $scope.admlevel == zoom_max &&
              $scope.filters.length == 0 &&
              !isNaN(d_prev[record.scorevar_name])
            ) {
              width = d_prev[record.scorevar_name] * 10;
            } else {
              width =
                dimensions_scores[record.name].top(1)[0].value.finalVal * 10;
            }

            div = document.createElement("div");
            div.setAttribute("class", "component-section");
            div.setAttribute("id", "section-" + record.name);
            parent = document.getElementById(record.group);
            parent.appendChild(div);
            div0 = document.createElement("div");
            div0.setAttribute("class", "col-md-2 col-sm-2 col-xs-2");
            div.appendChild(div0);
            img1 = document.createElement("img");
            img1.setAttribute("style", "height:20px");
            img1.setAttribute("src", icon);
            div0.appendChild(img1);
            div1 = document.createElement("div");
            div1.setAttribute(
              "class",
              "col-md-4 col-sm-4 col-xs-4 component-label"
            );
            if (record.group !== "dpi") {
              div1.setAttribute(
                "ng-click",
                "change_indicator('" + record.name + "')"
              );
            }
            div1.innerHTML = "{{ '" + record.name + "' | translate }}";
            $compile(div1)($scope);
            div.appendChild(div1);
            div1a = document.createElement("div");
            div1a.setAttribute(
              "class",
              "component-score " +
                high_med_low(record.name, record.scorevar_name, record.group)
            );
            div1a.setAttribute("id", record.name);
            div1a.innerHTML = keyvalue[record.name] + " " + unit;
            div1.appendChild(div1a);
            div2 = document.createElement("div");
            div2.setAttribute("class", "col-md-5 col-sm-5 col-xs-5");
            div.appendChild(div2);
            var div2a = document.createElement("div");
            div2a.setAttribute("class", "component-scale");
            div2.appendChild(div2a);
            var div2a1 = document.createElement("div");
            div2a1.setAttribute(
              "class",
              "score-bar " +
                high_med_low(record.name, record.scorevar_name, record.group)
            );
            div2a1.setAttribute("id", "bar-" + record.name);
            div2a1.setAttribute("style", "width:" + width + "%");
            div2a.appendChild(div2a1);
            div3 = document.createElement("div");
            div3.setAttribute("class", "col-md-1 col-sm-1 col-xs-1 no-padding");
            div.appendChild(div3);
            button = document.createElement("button");
            button.setAttribute("type", "button");
            button.setAttribute("class", "btn-modal");
            button.setAttribute("data-toggle", "modal");
            button.setAttribute("ng-click", "info('" + record.name + "')");
            div3.appendChild(button);
            $compile(button)($scope);
            img3 = document.createElement("img");
            img3.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
            img3.setAttribute("style", "height:17px");
            button.appendChild(img3);
          }
        }
      };
      $scope.createHTML(keyvalue);
      var section_id = document.getElementById("section-" + $scope.metric);
      if (section_id) {
        section_id.classList.add("section-active");
      }

      $scope.updateHTML = function(keyvalue) {
        var dpi_score = document.getElementById("dpi_score_main");
        if (dpi_score) {
          dpi_score.textContent = keyvalue.dpi_score;
          dpi_score.setAttribute(
            "class",
            "component-score " + high_med_low("dpi_score", "dpi_score", "dpi")
          );
        }
        var risk_score = document.getElementById("risk_score_main");
        if (risk_score) {
          risk_score.textContent = keyvalue.risk_score;
          risk_score.setAttribute(
            "class",
            "component-score " + high_med_low("risk_score", "risk_score")
          );
        }
        var vulnerability_score = document.getElementById(
          "vulnerability_score_main"
        );
        if (vulnerability_score) {
          vulnerability_score.textContent = keyvalue.vulnerability_score;
          vulnerability_score.setAttribute(
            "class",
            "component-score " +
              high_med_low("vulnerability_score", "vulnerability_score")
          );
        }
        var hazard_score = document.getElementById("hazard_score_main");
        if (hazard_score) {
          hazard_score.textContent = keyvalue.hazard_score;
          hazard_score.setAttribute(
            "class",
            "component-score " + high_med_low("hazard_score", "hazard_score")
          );
        }
        var coping_score = document.getElementById(
          "coping_capacity_score_main"
        );
        if (coping_score) {
          coping_score.textContent = keyvalue.coping_capacity_score;
          coping_score.setAttribute(
            "class",
            "component-score " +
              high_med_low("coping_capacity_score", "coping_capacity_score")
          );
        }

        for (var i = 0; i < $scope.tables.length; i++) {
          var record = $scope.tables[i];
          var width;
          var unit;

          if (meta_unit[record.name] === "null") {
            unit = "";
          } else {
            unit = meta_unit[record.name];
          }

          if (record.group === "general") {
            var div2 = document.getElementById(record.name);
            div2.innerHTML = keyvalue[record.name] + " " + unit;
          } else if (record.group === "other") {
            if (
              $scope.admlevel == zoom_max &&
              $scope.filters.length == 0 &&
              !isNaN(d_prev[record.scorevar_name])
            ) {
              width = d_prev[record.scorevar_name] * 10;
            } else {
              width = dimensions[record.name].top(1)[0].value.finalVal * 10;
            }

            if (
              !($scope.predictions == "no" && record.group == "predictions") &&
              !($scope.actuals == "no" && record.group == "damage") &&
              !(
                ($scope.predictions == "no" || $scope.actuals == "no") &&
                record.group == "pred_error"
              )
            ) {
              var div1a = document.getElementById(record.name);
              div1a.setAttribute(
                "class",
                "component-score " +
                  high_med_low(record.name, record.scorevar_name)
              );
              div1a.innerHTML = keyvalue[record.name] + " " + unit;
            }
          } else if (record.group !== "hide") {
            if (record.group == "dpi") {
              width = d.dpi[0][record.name] * 100;
            } else if (
              $scope.admlevel == zoom_max &&
              $scope.filters.length == 0 &&
              !isNaN(d_prev[record.scorevar_name])
            ) {
              width = d_prev[record.scorevar_name] * 10;
            } else {
              width =
                dimensions_scores[record.name].top(1)[0].value.finalVal * 10;
            }

            div1a = document.getElementById(record.name);
            div1a.setAttribute(
              "class",
              "component-score " +
                high_med_low(record.name, record.scorevar_name, record.group)
            );
            div1a.innerHTML = keyvalue[record.name] + " " + unit;
            var div2a1 = document.getElementById("bar-" + record.name);
            div2a1.setAttribute(
              "class",
              "score-bar " +
                high_med_low(record.name, record.scorevar_name, record.group)
            );
            div2a1.setAttribute("style", "width:" + width + "%");
          }
        }
      };

      /////////////////
      // COLOR SETUP //
      /////////////////

      //Define the range of all values for current metric (to be used for quantile coloring)
      //Define the color-quantiles based on this range
      $scope.mapchartColors = function() {
        var quantile_range = [];
        if (meta_scorevar[$scope.metric]) {
          quantile_range = d.quantile_range_scores;
        } else {
          for (i = 0; i < d.Rapportage.length; i++) {
            if (d.Rapportage[i][$scope.metric]) {
              quantile_range.push(d.Rapportage[i][$scope.metric]);
              quantile_range.sort(function sortNumber(a, b) {
                return a - b;
              });
            }
          }
          $scope.quantile_max = quantile_range[quantile_range.length - 1];
        }
        var colorDomain;
        if (!meta_scorevar[$scope.metric]) {
          colorDomain = $scope.quantileColorDomain_CRA_std;
        } else {
          colorDomain = $scope.quantileColorDomain_CRA_scores;
        }

        return d3.scale
          .quantile()
          .domain(quantile_range)
          .range(colorDomain);
      };
      var mapchartColors = $scope.mapchartColors();

      /////////////////////
      // MAP CHART SETUP //
      /////////////////////

      $scope.coming_from_map = false; //Setting which determines if filter happens while coming from Map (moving to Tabular)
      $scope.coming_from_tab = false; //Setting which determines if filter happens while coming from Tabular (moving to Map)

      //Set up the map itself with all its properties
      mapChart
        .width($("#map-chart").width())
        .height(800)
        .dimension(whereDimension)
        .group(whereGroupSum_scores)
        .center([0, 0])
        .zoom(0)
        .geojson(d.Districts)
        .colors(mapchartColors)
        .colorCalculator(function(d) {
          return !d.count ? "#cccccc" : mapChart.colors()(d.sum);
        })
        .featureKeyAccessor(function(feature) {
          return feature.properties.pcode;
        })
        .popup(function(d) {
          if (!meta_scorevar[$scope.metric]) {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              ": ",
              currentFormat(d.value.sum),
              " ",
              meta_unit[$scope.metric]
            );
          } else {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              ": ",
              currentFormat($scope.genLookup_value()[d.key])
            );
          }
        })
        .renderPopup(true)
        .turnOnControls(true)
        .legend(dc.leafletLegend().position("topright"))
        //Set up what happens when clicking on the map
        .on("filtered", function(chart) {
          $scope.filters = chart.filters();
          var keyvalue;
          var resetbutton;

          //When coming from Tabular View: update all information accordingly.
          if ($scope.chart_show == "map" && $scope.coming_from_tab) {
            keyvalue = fill_keyvalues();
            $scope.updateHTML(keyvalue);
            resetbutton = document.getElementsByClassName("reset-button")[0];
            if (chart.filters().length > 0) {
              resetbutton.style.visibility = "visible";
            } else {
              resetbutton.style.visibility = "hidden";
            }
          }
          //When NOT coming from Tabular View
          if ($scope.chart_show == "map" && !$scope.coming_from_tab) {
            keyvalue = fill_keyvalues();
            $scope.updateHTML(keyvalue);
            resetbutton = document.getElementsByClassName("reset-button")[0];
            if ($scope.filters.length > 0) {
              resetbutton.style.visibility = "visible";
            } else {
              resetbutton.style.visibility = "hidden";
            }
          }

          var popup = document.getElementById("mapPopup");
          popup.style.visibility = "hidden";
          document.getElementById("zoomin_icon").style.visibility = "hidden";
          if ($scope.filters.length > mapfilters_length) {
            $scope.$apply(function() {
              $scope.name_popup =
                lookup[$scope.filters[$scope.filters.length - 1]];
              for (var i = 0; i < d.Rapportage.length; i++) {
                var record = d.Rapportage[i];
                if (
                  record.pcode === $scope.filters[$scope.filters.length - 1]
                ) {
                  $scope.value_popup = currentFormat(record[$scope.metric]);
                  $scope.value_popup_unit = helpers.nullToEmptyString(
                    meta_unit[$scope.metric]
                  );
                  break;
                }
              }
              $scope.metric_label = meta_label[$scope.metric];
            });
            //In Firefox event is not a global variable >> Not figured out how to fix this, so use a separate function (see below)
            if ($(window).width() < 768) {
              popup.style.left = "5px";
              popup.style.bottom = "8%";
            } else if (typeof event !== "undefined") {
              popup.style.left =
                Math.min($(window).width() - 210, event.pageX) + "px";
              popup.style.top =
                Math.min($(window).height() - 210, event.pageY) + "px";
            } else {
              popup.style.left = $scope.posx + "px";
              popup.style.top = $scope.posy + "px";
            }
            popup.style.visibility = "visible";
            if ($scope.admlevel < zoom_max && $scope.view_code !== "PI") {
              document.getElementById("zoomin_icon").style.visibility =
                "visible";
            }
          }
          mapfilters_length = $scope.filters.length;
          document
            .getElementById("section-" + $scope.metric)
            .classList.add("section-active");
        });

      //Special Firefox function to retrieve click-coordinates
      $scope.FF_mouse_coordinates = function(e) {
        e = e || window.event;
        if (e.pageX || e.pageY) {
          $scope.posx = e.pageX;
          $scope.posy = e.pageY;
        }
      };
      var mapElem = document.getElementById("map-chart");
      mapElem.addEventListener("click", $scope.FF_mouse_coordinates, false);

      /////////////////////
      // ROW CHART SETUP //
      /////////////////////

      //Extra function needed to determine width of row-chart in various settings
      var rowChart_width;
      if ($(window).width() < 768) {
        rowChart_width = $("#row-chart-container").width();
      } else {
        rowChart_width = $("#row-chart-container").width() - 370;
      }
      var barheight = 20; //Height of one bar in Tabular View
      var xAxis = meta_scorevar[$scope.metric] ? 11 : $scope.quantile_max * 1.1;

      //Row-chart definition
      rowChart
        .width(rowChart_width)
        .height((barheight + 5) * d.Rapportage.length + 50)
        .dimension(whereDimension_tab)
        .group(whereGroupSum_scores_tab)
        .ordering(function(d) {
          return isNaN($scope.genLookup_value()[d.key])
            ? 999999999 - d.value.sum
            : -d.value.sum;
        })
        .fixedBarHeight(barheight)
        .valueAccessor(function(d) {
          return isNaN(d.value.sum) ? 0 : d.value.sum;
        })
        .colors(mapchartColors)
        .colorCalculator(function(d) {
          return !d.value.count ? "#cccccc" : mapChart.colors()(d.value.sum);
        })
        .label(function(d) {
          if (!meta_scorevar[$scope.metric]) {
            return currentFormat(d.value.sum).concat(
              " ",
              meta_unit[$scope.metric],
              " - ",
              lookup[d.key]
            );
          } else {
            if ($scope.genLookup_value()[d.key] == "No data") {
              return "No data - ".concat(lookup[d.key]);
            } else {
              return currentFormat($scope.genLookup_value()[d.key]).concat(
                " ",
                meta_unit[$scope.metric],
                " - ",
                lookup[d.key]
              );
            }
          }
        })
        .title(function(d) {
          if (!meta_scorevar[$scope.metric]) {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              ": ",
              currentFormat(d.value.sum),
              " ",
              meta_unit[$scope.metric]
            );
          } else {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              " (0-10): ",
              dec2Format(d.value.sum)
            );
          }
        })
        .on("filtered", function(chart) {
          $scope.filters = chart.filters();
          var keyvalue;
          var resetbutton;

          //If coming from map: update all sidebar-information accordingly
          if ($scope.chart_show == "row" && $scope.coming_from_map) {
            keyvalue = fill_keyvalues();
            $scope.updateHTML(keyvalue);
            resetbutton = document.getElementsByClassName("reset-button")[0];
            if (chart.filters().length > 0) {
              resetbutton.style.visibility = "visible";
            } else {
              resetbutton.style.visibility = "hidden";
            }
          }
          //If not coming from map
          if ($scope.chart_show == "row" && !$scope.coming_from_map) {
            keyvalue = fill_keyvalues();
            $scope.updateHTML(keyvalue);
            resetbutton = document.getElementsByClassName("reset-button")[0];
            if ($scope.filters.length > 0) {
              resetbutton.style.visibility = "visible";
            } else {
              resetbutton.style.visibility = "hidden";
            }
          }
        })
        .elasticX(false)
        .x(
          d3.scale
            .linear()
            .range([0, rowChart.width()])
            .domain([0, xAxis])
        )
        .xAxis()
        .scale(rowChart.x())
        .tickValues([]);

      /////////////////////////
      // ROW CHART FUNCTIONS //
      /////////////////////////

      //Function to sort either by Indicator Score (descending) or by Area Name (ascending)
      $scope.sort = function(type) {
        if (type === "value") {
          rowChart.ordering(function(d) {
            return isNaN(d.value.sum) ? 0 : -d.value.sum;
          });
        } else if (type == "name") {
          rowChart.ordering(function(d) {
            if (d.value == 0) {
              return "zzz";
            } else {
              return lookup[d.key];
            }
          });
        }
        rowChart.redraw();
      };

      //Function to immediately scroll back to the top (especially handy in mobile setting)
      $scope.scrollRowChart = function() {
        $("#tabular-wrapper").scrollTop(0);
      };

      ///////////////////////////
      // MAP RELATED FUNCTIONS //
      ///////////////////////////

      $scope.zoom_in = function() {
        if ($scope.filters.length > 0 && $scope.admlevel < zoom_max) {
          $scope.admlevel = $scope.admlevel + 1;
          $scope.parent_code_prev = $scope.parent_code;
          $scope.name_selection_prev = $scope.name_selection;
          $scope.parent_codes = $scope.filters;
          $scope.name_selection =
            $scope.filters.length > 1
              ? "Multiple " +
                helpers.lookUpByCountryCode(
                  d.Country_meta,
                  "level" + ($scope.admlevel - 1) + "_name"
                )[$scope.country_code]
              : lookup[$scope.parent_codes[0]];
          if ($scope.admlevel == zoom_max) {
            for (var i = 0; i < d.Rapportage.length; i++) {
              var record = d.Rapportage[i];
              if (record.pcode === $scope.filters[0]) {
                d_prev = record;
                break;
              }
            }
          }
          $scope.filters = [];
          $scope.reinitiate(d);
          document
            .getElementById("level" + ($scope.admlevel - zoom_min + 1))
            .setAttribute("class", "btn btn-secondary btn-active");
          document.getElementById("mapPopup").style.visibility = "hidden";
          document.getElementById("zoomin_icon").style.visibility = "hidden";
          document.getElementsByClassName("reset-button")[0].style.visibility =
            "hidden";
          mapfilters_length = 0;
        }
      };

      //Functions for zooming out
      $scope.zoom_out = function(dest_level) {
        var admlevel_old = $scope.admlevel;
        if (
          zoom_min == 1 ||
          $scope.country_code == "MWI" ||
          $scope.country_code == "MOZ"
        ) {
          if (dest_level === 1 && $scope.admlevel > zoom_min) {
            $scope.admlevel = zoom_min;
            $scope.parent_codes = [];
            $scope.levelB_selection_pre = "all_yes";
            $scope.levelB_selection = helpers.lookUpByCountryCode(
              d.Country_meta,
              "level" + (zoom_min + 1) + "_name"
            )[$scope.country_code];
            $scope.reinitiate(d);
          } else if (dest_level === 2 && $scope.admlevel > zoom_min + 1) {
            $scope.admlevel = zoom_min + 1;
            $scope.parent_codes = $scope.levelB_codes;
            $scope.name_selection = $scope.name_selection_prev;
            $scope.levelC_selection_pre = "all_yes";
            $scope.levelC_selection = helpers.lookUpByCountryCode(
              d.Country_meta,
              "level" + (zoom_min + 2) + "_name"
            )[$scope.country_code];
            $scope.reinitiate(d);
          } else if (dest_level === 2 && $scope.admlevel < zoom_min + 1) {
            $scope.admlevel = zoom_min + 1;
            $scope.parent_codes = [];
            $scope.name_selection = $scope.levelB_selection;
            document
              .getElementById("level2")
              .setAttribute("class", "btn btn-secondary btn-active");
            $scope.reinitiate(d);
          } else if (
            dest_level === 3 &&
            $scope.admlevel < zoom_min + 2 &&
            $scope.parent_codes.length == 0
          ) {
            $scope.admlevel = zoom_min + 2;
            $scope.parent_codes = [];
            $scope.name_selection = $scope.levelC_selection;
            document
              .getElementById("level2")
              .setAttribute("class", "btn btn-secondary btn-active");
            document
              .getElementById("level3")
              .setAttribute("class", "btn btn-secondary btn-active");
            $scope.reinitiate(d);
          }
        } else {
          if (dest_level === 1 && $scope.admlevel > zoom_min) {
            $scope.admlevel = zoom_min;
            $scope.parent_codes = [];
            $scope.reinitiate(d);
          } else if (dest_level === 2 && $scope.admlevel > zoom_min + 1) {
            $scope.admlevel = zoom_min + 1;
            $scope.parent_codes = $scope.levelB_codes;
            $scope.name_selection = $scope.name_selection_prev;
            $scope.reinitiate(d);
          }
        }

        while (admlevel_old - zoom_min > dest_level - 1) {
          document
            .getElementById("level" + (admlevel_old - zoom_min + 1))
            .setAttribute("class", "btn btn-secondary");
          admlevel_old = admlevel_old - 1;
        }
        document.getElementById("mapPopup").style.visibility = "hidden";
        document.getElementById("zoomin_icon").style.visibility = "hidden";

        $scope.mapShow();
      };

      $scope.change_indicator = function(id) {
        var section_id = document.getElementById("section-" + $scope.metric);
        if (section_id) {
          section_id.classList.remove("section-active");
        }
        $scope.metric = id;
        $scope.metric_label = meta_label[id];
        var mapchartColors = $scope.mapchartColors();
        cf_scores_metric = !meta_scorevar[$scope.metric]
          ? $scope.metric
          : meta_scorevar[$scope.metric];
        whereGroupSum.dispose();
        whereGroupSum = whereDimension.group().reduceSum(function(d) {
          return d[$scope.metric];
        });
        whereGroupSum_lookup.dispose();
        whereGroupSum_lookup = whereDimension.group().reduce(
          function(p, v) {
            p.count = v[$scope.metric] !== null ? p.count + 1 : p.count;
            p.sum = p.sum + v[$scope.metric];
            return p;
          },
          function(p, v) {
            p.count = v[$scope.metric] !== null ? p.count - 1 : p.count;
            p.sum = p.sum - v[$scope.metric];
            return p;
          },
          function() {
            return { count: 0, sum: 0 };
          }
        );
        whereGroupSum_scores.dispose();
        whereGroupSum_scores = whereDimension.group().reduce(
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
        whereGroupSum_scores_tab.dispose();
        whereGroupSum_scores_tab = whereDimension_tab.group().reduce(
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
        mapChart
          .group(whereGroupSum_scores)
          .colors(mapchartColors)
          .colorCalculator(function(d) {
            return !d.count ? "#cccccc" : mapChart.colors()(d.sum);
          })
          .popup(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                currentFormat(d.value.sum),
                " ",
                meta_unit[$scope.metric]
              );
            } else {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                currentFormat($scope.genLookup_value()[d.key])
              );
            }
          });

        var xAxis = meta_scorevar[$scope.metric]
          ? 11
          : $scope.quantile_max * 1.1;
        rowChart
          .group(whereGroupSum_scores_tab)
          .ordering(function(d) {
            return isNaN($scope.genLookup_value()[d.key])
              ? 999999999
              : -d.value.sum;
          })
          .valueAccessor(function(d) {
            return isNaN($scope.genLookup_value()[d.key]) ? "" : d.value.sum;
          })
          .colors(mapchartColors)
          .colorCalculator(function(d) {
            return !d.value.count ? "#cccccc" : mapChart.colors()(d.value.sum);
          })
          .label(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return currentFormat(d.value.sum).concat(
                " ",
                meta_unit[$scope.metric],
                " - ",
                lookup[d.key]
              );
            } else {
              if ($scope.genLookup_value()[d.key] == "No data") {
                return "No data - ".concat(lookup[d.key]);
              } else {
                return currentFormat($scope.genLookup_value()[d.key]).concat(
                  " ",
                  meta_unit[$scope.metric],
                  " - ",
                  lookup[d.key]
                );
              }
            }
          })
          .title(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                currentFormat(d.value.sum),
                " ",
                meta_unit[$scope.metric]
              );
            } else {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                " (0-10): ",
                dec2Format(d.value.sum)
              );
            }
          })
          .x(
            d3.scale
              .linear()
              .range([0, rowChart.width()])
              .domain([0, xAxis])
          );
        dc.redrawAll();

        document.getElementById("mapPopup").style.visibility = "hidden";
        document.getElementById("zoomin_icon").style.visibility = "hidden";
        document
          .getElementById("section-" + id)
          .classList.add("section-active");
      };

      ////////////////////////////
      // SIDEBAR: INFO FUNCTION //
      ////////////////////////////

      //Function to open the modal with information on indicator
      $scope.info = function(id) {
        $scope.metric_info = id;
        if (id !== "admin") {
          $scope.metric_label = meta_label[id];
        }
        $scope.metric_label_popup = meta_label[id];
        $scope.metric_year = meta_year[id];
        $scope.metric_source = meta_source[id];
        $scope.metric_desc = meta_desc[id];
        if (!meta_icon[id]) {
          $scope.metric_icon = "modules/dashboards/img/undefined.png";
        } else {
          $scope.metric_icon = "modules/dashboards/img/" + meta_icon[id];
        }
        $("#infoModal").modal("show");
      };

      /////////////////////////////////
      // SIDEBAR: ACCORDION FUNCTION //
      /////////////////////////////////

      //Make sure that when opening another accordion-panel, the current one collapses
      var acc = document.getElementsByClassName("card-header level1");
      var active = document.getElementsByClassName("collapse level1 in")[0];
      for (i = 0; i < acc.length; i++) {
        acc[i].onclick = function() {
          var active_new = document.getElementById(
            this.id.replace("heading", "collapse")
          );
          if (active.id !== active_new.id) {
            active.classList.remove("in");
          }
          active = active_new;
        };
      }

      //////////////////////////////
      // HEADER FUNCTIONS //////////
      //////////////////////////////

      $scope.open_status = function() {
        $("#statusModal").modal("show");
      };

      $scope.open_DPI = function() {
        $("#statusModal").modal("hide");
        $(".collapse.level1.in").removeClass("in");
        $("#collapseZero").addClass("in");
        setTimeout(function() {
          $("#dpi-card").addClass("dpi-card-highlight");
        }, 100);
        setTimeout(function() {
          $(" #dpi-card").removeClass("dpi-card-highlight");
        }, 1000);
      };

      //////////////////////////////
      // HEADER: EXPORT FUNCTIONS //
      //////////////////////////////

      //Export to GEOJSON
      $scope.export_geojson = function() {
        exportService.exportAsGeoJSON(d.Districts);
      };

      //Export to CSV function
      $scope.export_csv = function() {
        exportService.exportAsCSV(d.Rapportage, meta_label);
      };

      $scope.share_URL = function() {
        $scope.shareable_URL = shareService.createFullUrl(
          $scope.country_code,
          $scope.chart_show,
          $scope.admlevel,
          $scope.metric,
          $scope.parent_codes
        );
        $("#URLModal").modal("show");
      };

      $scope.share_country_URL = function() {
        $scope.shareable_URL = shareService.createCountryUrl(
          $scope.country_code
        );
        $("#URLModal").modal("show");
      };

      $scope.copyToClipboard = shareService.copyToClipboard;

      ///////////////////////////////////
      // SIDEBAR: MAP & TABULAR SWITCH //
      ///////////////////////////////////

      //Switch between MAP and TABULAR view
      $scope.mapShow = function() {
        if ($scope.filters.length == 0) {
          zoomToGeom($scope.geom);
        } else {
          $scope.districts_temp = JSON.parse(JSON.stringify($scope.geom));
          $scope.districts_temp.features = [];
          for (var i = 0; i < $scope.geom.features.length; i++) {
            if (
              $scope.filters.indexOf($scope.geom.features[i].properties.pcode) >
              -1
            ) {
              $scope.districts_temp.features.push($scope.geom.features[i]);
            }
          }
          zoomToGeom($scope.districts_temp);
        }

        if ($scope.chart_show == "row") {
          $scope.chart_show = "map";
          $("#row-chart-container").hide();
          $("#map-chart").show();

          $scope.click_filter = false;
          $scope.coming_from_tab = true;
          rowChart.filter(null);
          $scope.click_filter = true;
          $scope.coming_from_tab = false;
        }

        if ($(window).width() < 768) {
          $("#demo.in").removeClass("in");
        }
        $(document).ready(function() {
          if ($(window).width() < 768) {
            $(".collapse-button").addClass("collapsed");
          }
        });
      };

      $scope.tabularShow = function() {
        $scope.chart_show = "row";
        $("#map-chart").hide();
        document.getElementById("mapPopup").style.visibility = "hidden";
        document.getElementById("zoomin_icon").style.visibility = "hidden";
        document.getElementById("row-chart-container").style.visibility =
          "visible";
        $("#row-chart-container").show();

        $scope.click_filter = false;
        $scope.coming_from_map = true;
        mapChart.filter(null);
        $scope.click_filter = true;
        $scope.coming_from_map = false;

        if ($(window).width() < 768) {
          $("#demo.in").removeClass("in");
        }
        $(document).ready(function() {
          if ($(window).width() < 768) {
            $(".collapse-button").addClass("collapsed");
          }
        });
      };

      // This changes the active-state styling between Map View and Tabular View buttons, after switching
      $(".view-buttons button").click(function(e) {
        $(".view-buttons button.active").removeClass("active");
        var $this = $(this);
        if (!$this.hasClass("active")) {
          $this.addClass("active");
        }
        e.preventDefault();
      });

      $scope.reset_function = function() {
        dc.filterAll();
        dc.redrawAll();
        var keyvalue = fill_keyvalues();
        $scope.updateHTML(keyvalue);
        if ($scope.chart_show == "map") {
          zoomToGeom($scope.geom);
        }
      };

      /////////////////////////
      // RENDER MAP AND PAGE //
      /////////////////////////

      //Render all dc-charts and -tables
      dc.renderAll();

      map = mapChart.map();
      function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([
          [bounds[0][1], bounds[0][0]],
          [bounds[1][1], bounds[1][0]],
        ]);
      }
      zoomToGeom($scope.geom);

      //Show map
      if ($scope.chart_show == "map") {
        $("#row-chart-container").hide();
      } else if ($scope.chart_show == "row") {
        $scope.tabularShow();
      }

      var zoom_child = $(".leaflet-control-zoom")[0];
      var zoom_parent = $(".leaflet-bottom.leaflet-right")[0];
      zoom_parent.insertBefore(zoom_child, zoom_parent.childNodes[0]);

      d.Country_meta_full = $filter("orderBy")(d.Country_meta_full, [
        "+format",
        "+country_code",
      ]);

      //Create HTML
      if ($scope.view_code == "CRA") {
        var ul = document.getElementById("country-items");
        while (ul.childElementCount > 0) {
          ul.removeChild(ul.lastChild);
        }
        var formats = [];
        for (i = 0; i < d.Country_meta_full.length; i++) {
          record = d.Country_meta_full[i];

          if (formats.indexOf(record.format) <= -1 && formats.length > 0) {
            var li2 = document.createElement("li");
            li2.setAttribute("class", "divider");
            ul.appendChild(li2);
          }
          var li = document.createElement("li");
          ul.appendChild(li);
          var a = document.createElement("a");
          a.setAttribute("class", "submenu-item");
          a.setAttribute(
            "ng-click",
            "change_country('" + record.country_code + "')"
          );
          a.setAttribute("role", "button");
          a.innerHTML =
            record.format == "all"
              ? record.country_name
              : record.country_name + " (" + record.format + ")";
          $compile(a)($scope);
          li.appendChild(a);

          formats.push(record.format);
        }
      }

      //////////////////////////////////////
      /// TRANSLATION TO OTHER LANGUAGES ///
      //////////////////////////////////////

      //Translation button
      $scope.changeLanguage = function(langKey) {
        $translate.use(langKey);
        $scope.language = langKey;
        for (var i = 0; i < $("#menu-buttons.in").length; i++) {
          $("#menu-buttons.in")[i].classList.remove("in");
        }
      };

      var languages_es = ["PER", "ECU"];
      var languages_fr = ["MLI"];
      var languages_all = [].concat(languages_es, languages_fr);

      if (languages_all.indexOf($scope.country_code) > -1) {
        $("#language-selector").show();
        if ($scope.reload == 1 && $scope.language == "en") {
          $scope.changeLanguage("en");
        } else {
          if (languages_fr.indexOf($scope.country_code) > -1) {
            $scope.changeLanguage("fr");
            document.getElementById("language-selector-es").style.display =
              "none";
            document.getElementById("language-selector-fr").style.display =
              "block";
          } else if (languages_es.indexOf($scope.country_code) > -1) {
            $scope.changeLanguage("es");
            document.getElementById("language-selector-es").style.display =
              "block";
            document.getElementById("language-selector-fr").style.display =
              "none";
          }
        }
      } else {
        $("#language-selector").hide();
        $scope.changeLanguage("en");
      }

      $scope.translateData = function() {
        return {
          metric_label: $scope.metric,
          metric_label_popup: $scope.metric_info,
          metric_desc: "desc_" + $scope.metric_info,
          subtype_selection: $scope.subtype_selection,
          levelB_selection_pre: $scope.levelB_selection_pre,
          levelC_selection_pre: $scope.levelC_selection_pre,
        };
      };
    };
  },
]);
