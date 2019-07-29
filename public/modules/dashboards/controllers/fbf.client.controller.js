"use strict";

angular.module("dashboards").controller("FbfController", [
  "$translate",
  "$scope",
  "$rootScope",
  "$compile",
  "$location",
  "Authentication",
  "Data",
  "AuthData",
  "helpers",
  "exportService",
  "shareService",
  "crossfilterService",
  "colorSetupService",
  "sidebarHtmlService",
  "districtButtonsService",
  "chartService",
  "GEOSERVER_BASEURL",
  "DEBUG",
  function(
    $translate,
    $scope,
    $rootScope,
    $compile,
    $location,
    Authentication,
    Data,
    AuthData,
    helpers,
    exportService,
    shareService,
    crossfilterService,
    colorSetupService,
    sidebarHtmlService,
    districtButtonsService,
    chartService,
    GEOSERVER_BASEURL,
    DEBUG
  ) {
    $scope.user = Authentication.user;

    // This is a 'private' view, so a valid user is required:
    if (!$scope.user && !DEBUG) {
      return $location.path("signin");
    }

    ////////////////////////
    // SET MAIN VARIABLES //
    ////////////////////////

    $scope.change_lead_time = function(lead_time) {
      $scope.lead_time_toggle = 1;
      $scope.lead_time = lead_time;
      $scope.initiate();
    };

    $scope.change_current_prev = function(current_prev) {
      $scope.current_prev_toggle = 1;
      $scope.current_prev = current_prev;
      $scope.initiate();
    };

    //////////////////////
    // DEFINE VARIABLES //
    //////////////////////

    $rootScope.loadCount = 0;
    $scope.reload = 0;
    $scope.authentication = Authentication;
    $scope.geom = null;
    $scope.country_code_default = "ZMB";
    $scope.country_code = $scope.country_code_default;
    $scope.view_code = "CRA";
    $scope.metric = "";
    if ($rootScope.country_code) {
      $scope.country_code = $rootScope.country_code;
    } else {
      $rootScope.country_code = $scope.country_code_default;
    }
    if ($rootScope.view_code) {
      $scope.view_code = $rootScope.view_code;
    }
    $scope.metric_label = "";
    $scope.metric_year = "";
    $scope.metric_source = "";
    $scope.metric_desc = "";
    $scope.metric_icon = "modules/dashboards/img/undefined.png";
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
      "#fee5d9",
      "#fcae91",
      "#fb6a4a",
      "#de2d26",
      "#a50f15",
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
    $scope.stations = [];
    $scope.rcLocations = [];
    $scope.lead_time = "3-day";
    $scope.lead_time_toggle = 0;
    $scope.current_prev = "Current";

    ////////////////////////
    // INITIATE DASHBOARD //
    ////////////////////////

    $scope.initiate = function(d) {
      //Start loading bar
      helpers.start();

      //Load the map-view by default
      $("#row-chart-container").hide();
      $("#map-chart").show();
      $scope.chart_show = "map";

      //Determine if a parameter-specific URL was entered, and IF SO, set the desired parameters
      var url = shareService.readParameterUrl(location.href);
      $scope.directURLload = url.directURLload;
      if (url.country_code) {
        $scope.country_code = url.country_code;
      }
      if ($scope.directURLload) {
        $scope.admlevel = url.admlevel;
        $scope.metric = url.metric;
        $scope.chart_show = url.chart_show;
        $scope.parent_codes = url.parent_codes;
      }

      //Set some exceptions, can be done better in future (i.e. reading from metadata, BUT metadata is only readed later in the script currently)
      if (!$scope.directURLload && !d) {
        // Old default settings
        //$scope.admlevel = 1;
        // New default settings
        $scope.directURLload = true;
        $scope.admlevel = 2;
        $scope.metric = "population_affected";
        document
          .getElementById("level2")
          .setAttribute("class", "btn btn-secondary btn-active");
      }

      //This is the main search-query for PostgreSQL
      $scope.parent_codes_input = "{" + $scope.parent_codes.join(",") + "}";

      loadFunction(d);

      prepareStationsData();
      prepareRcLocationsData();
      prepareHealthsitesData();
      prepareWaterpointsData();
      prepareRoadData();
      $scope.add_raster_layer();

      // Add timeout to give map time to load (only upon first load, not when changing zoom-level)

      window.setTimeout(function() {
        $scope.show_raster_layer();
        if (!d) {
          document.getElementById("flood-toggle").click();
        }
        // $scope.show_glofas_stations();
      }, 2000);
    };

    ///////////////
    // LOAD DATA //
    ///////////////

    //Get Data
    var loadFunction = function(d) {
      Data.getAll(
        {
          admlevel: $scope.admlevel,
          country: $scope.country_code,
          parent_codes: $scope.parent_codes_input,
          view: $scope.view_code,
          disaster_type: "",
          disaster_name: "",
        },
        function(pgData) {
          AuthData.getFbfJsonData(
            {
              country: $scope.country_code.toLowerCase(),
              type: "data_adm" + $scope.admlevel,
            },
            function(fbf_admin_data) {
              AuthData.getFbfJsonData(
                {
                  country: $scope.country_code.toLowerCase(),
                  type: "metadata_fbf_zambia",
                },
                function(fbf_metadata) {
                  $scope.load_data(d, pgData[0], fbf_admin_data, fbf_metadata);
                }
              );
            }
          );
        }
      );
    };

    //Process Data
    $scope.load_data = function(d, pgData, fbf_admin_data, fbf_metadata) {
      if (!d) {
        d = {};
        $scope.reload = 0;
      } else {
        $scope.reload = 1;
      }
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
      d.Rapportage.forEach(function(e) {
        for (var i = 0; i < fbf_admin_data.length; i++) {
          if (
            e.pcode == fbf_admin_data[i].pcode &&
            fbf_admin_data[i].lead_time == $scope.lead_time &&
            fbf_admin_data[i].current_prev == $scope.current_prev
          ) {
            for (var attrname in fbf_admin_data[i]) {
              e[attrname] = fbf_admin_data[i][attrname];
            }
          }
        }
      });

      // 4. Variable-metadata
      d.Metadata = $.grep(fbf_metadata, function(e) {
        return (
          e.upload_to_dashboard == 1 &&
          helpers
            .nullToEmptyString(e.country_code)
            .indexOf($scope.country_code) > -1 &&
          e.admin_level >= $scope.admlevel &&
          e.admin_level_min <= $scope.admlevel
        );
      });

      // 5. Country-metadata
      d.Country_meta = $.grep(pgData.usp_data.meta_country, function(e) {
        return e.country_code == $scope.country_code;
      });

      DEBUG && console.log(d);

      //ADDITIONAL OUTPUT
      //Get current Date
      for (var i = 0; i < fbf_admin_data.length; i++) {
        if (fbf_admin_data[i].current_prev == "Current") {
          $scope.current_date = fbf_admin_data[i].date;
          break;
        }
      }
      for (var i = 0; i < fbf_admin_data.length; i++) {
        if (fbf_admin_data[i].current_prev == "Previous") {
          $scope.prev_date = fbf_admin_data[i].date;
          break;
        }
      }
      var date =
        $scope.current_prev == "Current"
          ? $scope.current_date
          : $scope.prev_date;
      date = new Date(date);
      $scope.date =
        date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
      //Get triggers for other lead-time (to signal)
      $scope.trigger_3day = 0;
      $scope.trigger_7day = 0;
      $scope.trigger_current = 0;
      for (var i = 0; i < fbf_admin_data.length; i++) {
        var record = fbf_admin_data[i];
        if (
          $scope.lead_time == "3-day" &&
          record.lead_time == "3-day" &&
          record.current_prev == $scope.current_prev
        ) {
          $scope.trigger_3day += record.fc_trigger == 1 ? 1 : 0;
          $scope.trigger_7day += record.other_lead_time_trigger == 1 ? 1 : 0;
        } else if (
          $scope.lead_time == "7-day" &&
          record.lead_time == "7-day" &&
          record.current_prev == $scope.current_prev
        ) {
          $scope.trigger_3day += record.other_lead_time_trigger == 1 ? 1 : 0;
          $scope.trigger_7day += record.fc_trigger == 1 ? 1 : 0;
        } else if (
          $scope.current_prev == "Previous" &&
          record.current_prev == "Current"
        ) {
          $scope.trigger_current += record.fc_trigger == 1 ? 1 : 0;
        }
      }
      document.getElementById("3-day-signal").style.display =
        $scope.trigger_3day >= 1 ? "inline" : "none";
      document.getElementById("7-day-signal").style.display =
        $scope.trigger_7day >= 1 ? "inline" : "none";
      // document.getElementById('lead-time-signal').style.display = $scope.trigger_3day >= 1 || $scope.trigger_7day >= 1 ? "inline" : "none";
      if (
        ($scope.trigger_7day >= 1 && $scope.lead_time == "3-day") ||
        ($scope.trigger_3day >= 1 && $scope.lead_time == "7-day")
      ) {
        document.getElementById("lead-time-signal").style.display = "inline";
      } else {
        document.getElementById("lead-time-signal").style.display = "none";
      }
      document.getElementById("current-signal").style.display =
        $scope.trigger_current >= 1 ? "inline" : "none";
      document.getElementById("current_prev-signal").style.display =
        $scope.trigger_current >= 1 && $scope.current_prev == "Previous"
          ? "inline"
          : "none";

      //Clean up some styling (mainly for if you change to new country when you are at a lower zoom-level already)
      if ($scope.reload == 0) {
        document
          .getElementsByClassName("sidebar-wrapper-fbf")[0]
          .setAttribute("style", "");
        document.getElementById("mapPopup").style.visibility = "hidden";
        document.getElementsByClassName("reset-button")[0].style.visibility =
          "hidden";
        if (document.getElementById("level2") && $scope.admlevel < 2) {
          document
            .getElementById("level2")
            .setAttribute("class", "btn btn-secondary");
        }
        if (document.getElementById("level3") && $scope.admlevel < 3) {
          document
            .getElementById("level3")
            .setAttribute("class", "btn btn-secondary");
        }
        $(".sidebar-wrapper-fbf").addClass("in");
        $(document).ready(function() {
          if ($(window).width() < 768) {
            $(".sidebar-wrapper-fbf").removeClass("in");
          }
        });
        for (i = 0; i < $("#menu-buttons.in").length; i++) {
          $("#menu-buttons.in")[i].classList.remove("in");
        }
        $(".view-buttons button.active").removeClass("active");
        $scope.chart_show == "map"
          ? $(".view-buttons button.btn-map-view").addClass("active")
          : $(".view-buttons button.btn-tabular").addClass("active");
      } else {
        //Final CSS
        $(".view-buttons button.active").removeClass("active");
        $(".view-buttons button.btn-map-view").addClass("active");
      }

      //Load actual content
      $scope.generateCharts(d);

      $(document).ready(function() {
        if ($(window).width() < 768) {
          $(".collapse-button").addClass("collapsed");
        }
      });

      // end loading bar
      helpers.complete();

      //Check if browser is IE (L_PREFER_CANVAS is a result from an earlier IE-check in layout.server.view.html)
      if ($rootScope.loadCount == 0 && typeof L_PREFER_CANVAS !== "undefined") {
        $("#IEmodal").modal("show");
        $rootScope.loadCount += 1;
      }
    };

    ///////////////////////////////////////////
    // MAIN FUNCTION TO GENERATE ALL CONTENT //
    ///////////////////////////////////////////

    $scope.generateCharts = function(d) {
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

      /////////////////////////////////////
      // CONFIGURE NEEDED HTML/VARIABLES //
      /////////////////////////////////////

      //Look up country parameters
      $scope.country_selection = country_name[$scope.country_code];
      var zoom_min = Number(country_zoom_min[$scope.country_code]);
      var zoom_max = Number(country_zoom_max[$scope.country_code]);
      if ($scope.admlevel === zoom_min) {
        $scope.name_selection = country_name[$scope.country_code];
      }
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

      //Look up default metric, take population if it's not found (i.e.: if not available on lower admin-level)
      if (!$scope.directURLload) {
        if ($scope.metric === "") {
          $scope.metric = country_default_metric[$scope.country_code];
        } else if (typeof d.Rapportage[0][$scope.metric] == "undefined") {
          $scope.metric = "population";
        }
      }
      // [FBF-SPECIFIC] Create list of triggered districts (for 'zoom in to all triggered districts' button)
      $scope.trigger_codes = [];
      for (var i = 0; i < d.Rapportage.length; i++) {
        if (d.Rapportage[i].fc_trigger == 1) {
          $scope.trigger_codes.push(d.Rapportage[i].pcode);
        }
      }

      //If a country contains only 2 instead of 3 admin-levels
      if (zoom_max - zoom_min < 2) {
        document.getElementById("level3").style.visibility = "hidden";
      } else if (document.getElementById("level3")) {
        document.getElementById("level3").style.visibility = "visible";
      }

      //Set the text/color of the district buttons
      var districtButtons = districtButtonsService.setDistrictButtons(
        $scope.admlevel,
        zoom_min,
        zoom_max,
        $scope.parent_code,
        $scope.parent_codes,
        d,
        $scope.country_code,
        $scope.directURLload,
        $scope.name_selection,
        $scope.levelB_selection,
        $scope.levelB_selection_pre,
        $scope.levelB_codes,
        $scope.levelB_code,
        $scope.levelC_selection,
        $scope.levelC_selection_pre,
        $scope.levelC_codes,
        $scope.levelC_code
      );
      $scope.levelC_codes = districtButtons.levelC_codes;
      $scope.levelC_code = districtButtons.levelC_code;
      $scope.levelC_selection = districtButtons.levelC_selection;
      $scope.levelC_selection_pre = districtButtons.levelC_selection_pre;
      $scope.levelB_codes = districtButtons.levelB_codes;
      $scope.levelB_code = districtButtons.levelB_code;
      $scope.levelB_selection = districtButtons.levelB_selection;
      $scope.levelB_selection_pre = districtButtons.levelB_selection_pre;

      //[FBF-specific]
      $scope.levelA_selection = districtButtons.levelA_selection;
      $scope.levelA_selection_pre = districtButtons.levelA_selection_pre;
      if ($scope.admlevel <= 2) {
        $scope.levelC_selection_pre = "All triggered ";
      } else if ($scope.parent_codes.length > 0) {
        $scope.levelC_selection_pre = "";
      }

      //////////////////////
      // SETUP INDICATORS //
      //////////////////////

      $scope.tables = [];
      var j = 0;
      for (i = 0; i < d.Metadata.length; i++) {
        var record = {};
        var record_temp = d.Metadata[i];
        if (record_temp.group !== "admin") {
          record.id = "data-table" + [i + 1];
          record.name = record_temp.variable;
          record.label = record_temp.label;
          record.layer_type = record_temp.layer_type;
          record.group =
            ["scores", "hazard", "vulnerability", "coping_capacity"].indexOf(
              record_temp.group
            ) > -1
              ? "cra"
              : record_temp.group;
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

      var cf_result = crossfilterService.setupCrossfilter(
        d.Rapportage,
        $scope.metric,
        meta_scorevar,
        $scope.tables
      );
      var cf = cf_result.cf;
      var whereDimension = cf_result.whereDimension;
      var whereDimension_tab = cf_result.whereDimension_tab;

      var whereGroupSum = cf_result.whereGroupSum;
      var whereGroupSum_lookup = cf_result.whereGroupSum_lookup;
      var cf_scores_metric = cf_result.cf_scores_metric;
      var whereGroupSum_scores = cf_result.whereGroupSum_scores;
      var whereGroupSum_scores_tab = cf_result.whereGroupSum_scores_tab;
      var all = cf_result.all;
      var dimensions = cf_result.dimensions;
      var dimensions_scores = cf_result.dimensions_scores;
      $scope.tables = cf_result.tables;

      // Create value-lookup function
      $scope.genLookup_value = function() {
        var lookup_value = {};
        whereGroupSum_lookup.top(Infinity).forEach(function(e) {
          lookup_value[e.key] = e.value.count == 0 ? "No data" : e.value.sum;
        });
        return lookup_value;
      };

      /////////////////
      // COLOR SETUP //
      /////////////////

      //Define thresholds for colors-scales. They are stored in d, because the thresholds are carried when zooming in to deeper admin-level.
      d = colorSetupService.setupThresholds(
        $scope.admlevel,
        zoom_min,
        $scope.directURLload,
        d,
        meta_scorevar
      );

      //Define a function which determines the right color based on value
      var high_med_low = function(ind, ind_score, group) {
        return colorSetupService.high_med_low(
          ind,
          ind_score,
          group,
          $scope.admlevel,
          zoom_max,
          $scope.filters,
          d,
          d_prev,
          dimensions_scores
        );
      };

      //Define the colorScaale used in the chart. Additionally a quantile_max is returned for later use.
      $scope.mapchartColors = function() {
        return colorSetupService.mapchartColors(
          meta_scorevar,
          $scope.metric,
          d,
          $scope.quantileColorDomain_CRA_std,
          $scope.quantileColorDomain_CRA_scores
        );
      };
      var mapchartColors = $scope.mapchartColors().colorScale;
      $scope.quantile_max = $scope.mapchartColors().quantile_max;

      ///////////////////////////////
      // SET UP ALL INDICATOR HTML //
      ///////////////////////////////

      //Create all data for sidebar
      var fill_keyvalues = function() {
        return sidebarHtmlService.fill_keyvalues(
          $scope.tables,
          $scope.admlevel,
          zoom_max,
          $scope.filters,
          meta_format,
          dimensions,
          d,
          d_prev
        );
      };
      var keyvalue = fill_keyvalues();

      var groups = [
        "general",
        "key-actors",
        "impact",
        "impact-shelter",
        "impact-access",
        "impact-wash",
        "impact-health",
        "impact-food",
        "cra",
      ];
      //Create all initial HTML for sidebar
      sidebarHtmlService.createHTML(
        groups,
        keyvalue,
        $scope.tables,
        $scope.admlevel,
        zoom_max,
        $scope.filters,
        meta_icon,
        meta_unit,
        dimensions,
        dimensions_scores,
        d,
        d_prev,
        high_med_low,
        "", //predictions
        "" //actuals
      );
      //Compile clickable elements
      var compile = $(".component-label, .general-component-label, .info-btn");
      for (i = 0; i < compile.length; i++) {
        $compile(compile[i])($scope);
      }
      //Give active class to current indicator
      var section_id = document.getElementById("section-" + $scope.metric);
      if (section_id) {
        section_id.classList.add("section-active");
      }

      //Define function to update HTML (only executed at other places)
      $scope.updateHTML = function(keyvalue) {
        return sidebarHtmlService.updateHTML(
          keyvalue,
          $scope.tables,
          $scope.admlevel,
          zoom_max,
          $scope.filters,
          meta_unit,
          dimensions,
          dimensions_scores,
          d,
          d_prev,
          high_med_low,
          "", //predictions
          "" //actuals
        );
      };

      //////////////////
      // CHARTS SETUP //
      //////////////////

      //Execute basic setup for charts
      chartService.setupCharts(map, cf, all);
      //define dc-charts (the name-tag following the # is how you refer to these charts in html with id-tag)
      var mapChart = dc.leafletChoroplethChart("#map-chart");
      var rowChart = dc.rowChart("#row-chart");
      $scope.coming_from_map = false; //Setting which determines if filter happens while coming from Map (moving to Tabular)
      $scope.coming_from_tab = false; //Setting which determines if filter happens while coming from Tabular (moving to Map)

      /////////////////////
      // MAP CHART SETUP //
      /////////////////////

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
          console.log;
          return d.sum == 0 && !meta_scorevar[$scope.metric]
            ? "#cccccc"
            : mapChart.colors()(d.sum);
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
              helpers.formatAsType(meta_format[$scope.metric], d.value.sum),
              " ",
              meta_unit[$scope.metric]
            );
          } else {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              ": ",
              helpers.formatAsType(
                meta_format[$scope.metric],
                $scope.genLookup_value()[d.key]
              )
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
                  $scope.value_popup = helpers.formatAsType(
                    meta_format[$scope.metric],
                    record[$scope.metric]
                  );
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
            return helpers
              .formatAsType(meta_format[$scope.metric], d.value.sum)
              .concat(" ", meta_unit[$scope.metric], " - ", lookup[d.key]);
          } else {
            if ($scope.genLookup_value()[d.key] == "No data") {
              return "No data - ".concat(lookup[d.key]);
            } else {
              return helpers
                .formatAsType(
                  meta_format[$scope.metric],
                  $scope.genLookup_value()[d.key]
                )
                .concat(" ", meta_unit[$scope.metric], " - ", lookup[d.key]);
            }
          }
        })
        .title(function(d) {
          if (!meta_scorevar[$scope.metric]) {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              ": ",
              helpers.formatAsType(meta_format[$scope.metric], d.value.sum),
              " ",
              meta_unit[$scope.metric]
            );
          } else {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              " (0-10): ",
              helpers.dec2Format(d.value.sum)
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
          $scope.initiate(d);
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
        if (dest_level === 1 && $scope.admlevel > zoom_min) {
          $scope.admlevel = zoom_min;
          $scope.parent_codes = [];
          $scope.levelB_selection_pre = "all_yes";
          $scope.levelB_selection = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + (zoom_min + 1) + "_name"
          )[$scope.country_code];
          $scope.initiate(d);
        } else if (dest_level === 2 && $scope.admlevel > zoom_min + 1) {
          $scope.admlevel = zoom_min + 1;
          $scope.parent_codes = $scope.levelB_codes;
          $scope.name_selection = $scope.name_selection_prev;
          $scope.levelC_selection_pre = "all_yes";
          $scope.levelC_selection = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + (zoom_min + 2) + "_name"
          )[$scope.country_code];
          $scope.initiate(d);
        } else if (dest_level === 2 && $scope.admlevel < zoom_min + 1) {
          $scope.admlevel = zoom_min + 1;
          $scope.parent_codes = [];
          $scope.name_selection = $scope.levelB_selection;
          document
            .getElementById("level2")
            .setAttribute("class", "btn btn-secondary btn-active");
          $scope.initiate(d);
        } else if (
          dest_level === 3 &&
          $scope.admlevel < zoom_min + 2 &&
          $scope.parent_codes.length == 0
        ) {
          $scope.admlevel = zoom_min + 2;
          //[FBF-specific] Take wards for triggered districts instead of all wards
          $scope.parent_codes = $scope.trigger_codes; //[];
          $scope.name_selection = $scope.levelC_selection;
          document
            .getElementById("level2")
            .setAttribute("class", "btn btn-secondary btn-active");
          document
            .getElementById("level3")
            .setAttribute("class", "btn btn-secondary btn-active");
          $scope.initiate(d);
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
        var mapchartColors = $scope.mapchartColors().colorScale;
        $scope.quantile_max = $scope.mapchartColors().quantile_max;
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
            return d.sum == 0 && !meta_scorevar[$scope.metric]
              ? "#cccccc"
              : mapChart.colors()(d.sum);
          })
          .popup(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                helpers.formatAsType(meta_format[$scope.metric], d.value.sum),
                " ",
                meta_unit[$scope.metric]
              );
            } else {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                helpers.formatAsType(
                  meta_format[$scope.metric],
                  $scope.genLookup_value()[d.key]
                )
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
              return helpers
                .formatAsType(meta_format[$scope.metric], d.value.sum)
                .concat(" ", meta_unit[$scope.metric], " - ", lookup[d.key]);
            } else {
              if ($scope.genLookup_value()[d.key] == "No data") {
                return "No data - ".concat(lookup[d.key]);
              } else {
                return helpers
                  .formatAsType(
                    meta_format[$scope.metric],
                    $scope.genLookup_value()[d.key]
                  )
                  .concat(" ", meta_unit[$scope.metric], " - ", lookup[d.key]);
              }
            }
          })
          .title(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                helpers.formatAsType(meta_format[$scope.metric], d.value.sum),
                " ",
                meta_unit[$scope.metric]
              );
            } else {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                " (0-10): ",
                helpers.dec2Format(d.value.sum)
              );
            }
          })
          .x(
            d3.scale
              .linear()
              .range([0, rowChart.width()])
              .domain([0, xAxis])
          );
        $("#map-chart").show();
        dc.redrawAll();

        document.getElementById("mapPopup").style.visibility = "hidden";
        document.getElementById("zoomin_icon").style.visibility = "hidden";
        document
          .getElementById("section-" + id)
          .classList.add("section-active");

        //FBF-only
        hide_show_legend();
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
        if (meta_icon[id]) {
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
          $scope.admlevel,
          $scope.metric,
          $scope.parent_codes,
          $scope.chart_show
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
      $("#dpi-card").hide();

      map = mapChart.map();
      function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([
          [bounds[0][1], bounds[0][0]],
          [bounds[1][1], bounds[1][0]],
        ]);
      }
      zoomToGeom($scope.geom);

      // Make map object available to be used in other directives
      $scope.map = map;

      //Show map
      if ($scope.chart_show == "map") {
        $("#row-chart-container").hide();
      } else if ($scope.chart_show == "row") {
        $scope.tabularShow();
      }

      var zoom_child = $(".leaflet-control-zoom")[0];
      var zoom_parent = $(".leaflet-bottom.leaflet-right")[0];
      zoom_parent.insertBefore(zoom_child, zoom_parent.childNodes[0]);

      //FBF-only
      var hide_show_legend = function() {
        var values = [];
        for (var i = 0; i < whereGroupSum_scores.top(Infinity).length; i++) {
          values.push(whereGroupSum_scores.top(Infinity)[i].value.sum);
        }
        if (
          Math.max(...values) == Math.min(...values) ||
          $scope.metric == "fc_trigger"
        ) {
          $(".legend.leaflet-control").css("display", "none");
        } else {
          $(".legend.leaflet-control").css("display", "block");
        }
      };
      hide_show_legend();

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
          levelA_selection_pre: $scope.levelA_selection_pre,
          levelB_selection_pre: $scope.levelB_selection_pre,
          levelC_selection_pre: $scope.levelC_selection_pre,
        };
      };
    };

    ////////////////////////
    /// DEBUG / TESTING ///
    ///////////////////////

    $scope.toggle_vector_layer = function() {
      var vectorLayer = map.getPane("overlayPane");

      vectorLayer.style.opacity = vectorLayer.style.opacity !== "0" ? 0 : 1;
    };

    ////////////////////
    /// WMS LAYER(S) ///
    ////////////////////

    var layer = "".concat(
      "flood_extent_",
      $scope.lead_time == "3-day" ? "short_" : "long_",
      $scope.current_prev == "Current" ? "0" : "1"
    );
    $scope.add_raster_layer = function() {
      $scope.rasterLayer = L.tileLayer.wms(GEOSERVER_BASEURL, {
        layers: layer,
        transparent: true,
        format: "image/png",
      });
    };

    $scope.show_raster_layer = function() {
      map.addLayer($scope.rasterLayer);
    };

    $scope.hide_raster_layer = function() {
      map.removeLayer($scope.rasterLayer);
    };

    $scope.toggled = {};
    $scope.toggle_raster_layer = function(layer) {
      if (typeof $scope.toggled[layer] == "undefined") {
        $scope.toggled[layer] = true;
      } else {
        $scope.toggled[layer] = !$scope.toggled[layer];
      }

      if ($scope.toggled[layer]) {
        $scope.show_raster_layer();
      } else {
        $scope.hide_raster_layer();
      }
    };

    /////////////////////
    /// POI & MARKERS ///
    /////////////////////

    function prepareStationsData() {
      AuthData.getPoi(
        {
          country: $scope.country_code,
          type: "dashboard_forecast_per_station",
        },
        function(stations_temp) {
          var stations = $.grep(stations_temp, function(e) {
            return (
              e.properties.current_prev == $scope.current_prev &&
              e.properties.lead_time == $scope.lead_time
            );
          });
          $scope.prepare_glofas_stations(stations);
        }
      );
    }

    function prepareRcLocationsData() {
      AuthData.getPoi(
        {
          country: $scope.country_code,
          type: "dashboard_redcross_branches",
        },
        function(rcLocations) {
          $scope.prepare_rc_locations(rcLocations);
        }
      );
    }

    function prepareHealthsitesData() {
      AuthData.getPoi(
        {
          country: $scope.country_code,
          type: "dashboard_poi_healthsites",
        },
        function(healthLocations) {
          $scope.prepare_health_locations(healthLocations);
        }
      );
    }

    function prepareWaterpointsData() {
      AuthData.getPoi(
        {
          country: $scope.country_code,
          type: "dashboard_poi_waterpoints",
        },
        function(waterpointLocations) {
          $scope.prepare_waterpoint_locations(waterpointLocations);
        }
      );
    }

    function createMarker(item, itemTitle, itemClass) {
      return L.marker(item.geometry.coordinates, {
        keyboard: true,
        riseOnHover: true,
        title: itemTitle,
        icon: L.divIcon({
          iconSize: [20, 20],
          iconAnchor: [10, 20],
          popupAnchor: [0, 0],
          className: "marker-icon marker-icon--" + itemClass,
        }),
      });
    }

    $scope.layers = {};
    $scope.prepare_glofas_stations = function(stations) {
      $scope.layers["poi_glofasLocationsLayer"] = L.layerGroup();
      stations.forEach(function(item) {
        if (!item.properties) return;

        var station = item.properties;
        var stationTitle =
          station.station_name + " (" + station.station_code + ")";
        var stationInfoPopup =
          "<strong>" +
          stationTitle +
          "</strong><br>" +
          "Forecast: " +
          helpers.formatAsType("decimal0", station.fc) +
          "<br>Trigger-level: " +
          helpers.formatAsType("decimal0", station.trigger_level) +
          "<br>Districts related to station: " +
          (station.station_used == 0 ? "no" : "yes") +
          "";
        var stationClass = "station";

        if (station.station_used == 1 && station.fc_trigger == 1) {
          stationClass += " is-triggered";
        }
        if (station.station_used == 1 && station.fc_trigger == 0) {
          stationClass += " is-not-triggered";
        }

        var stationMarker = createMarker(item, stationTitle, stationClass);

        stationMarker.addTo($scope.layers["poi_glofasLocationsLayer"]);
        stationMarker.bindPopup(stationInfoPopup);
      });
    };

    $scope.prepare_rc_locations = function(rcLocations) {
      $scope.layers["poi_rc_officesLocationsLayer"] = L.layerGroup();
      rcLocations.forEach(function(item) {
        if (!item.properties) return;

        var location = item.properties;
        var locationTitle = location.branch_name;
        var locationInfoPopup =
          "<strong class='h4'>" +
          locationTitle +
          "</strong><br>" +
          "<strong>" +
          "President: " +
          "</strong>" +
          location.president +
          "<br>" +
          "<strong>" +
          "Volunteers: " +
          "</strong>" +
          location.nr_volunteers +
          "<br>" +
          "<strong>" +
          "Address: " +
          "</strong>" +
          location.address +
          "";

        var locationMarker = createMarker(item, locationTitle, "rc");

        locationMarker.addTo($scope.layers["poi_rc_officesLocationsLayer"]);
        locationMarker.bindPopup(locationInfoPopup);
      });
    };

    $scope.prepare_health_locations = function(healthLocations) {
      $scope.layers["healthsitesLocationsLayer"] = L.layerGroup();
      healthLocations.forEach(function(item) {
        if (!item.properties) return;

        var location = item.properties;
        var locationTitle = location.name;
        var locationInfoPopup =
          "<strong class='h4'>" +
          locationTitle +
          "</strong><br>" +
          "<strong>" +
          "Type: " +
          "</strong>" +
          location.type +
          "";

        var locationMarker = createMarker(item, locationTitle, "health");

        locationMarker.addTo($scope.layers["healthsitesLocationsLayer"]);
        locationMarker.bindPopup(locationInfoPopup);
      });
    };

    $scope.prepare_waterpoint_locations = function(waterpointLocations) {
      $scope.layers["waterpointsLocationsLayer"] = L.layerGroup();
      waterpointLocations.forEach(function(item) {
        if (!item.properties) return;

        var location = item.properties;
        var locationTitle = location.activity_id;
        var locationInfoPopup =
          "<strong class='h4'>" +
          locationTitle +
          "</strong><br>" +
          "<strong>" +
          "Type: " +
          "</strong>" +
          location.water_tech +
          "";

        var locationMarker = createMarker(item, locationTitle, "wash");

        locationMarker.addTo($scope.layers["waterpointsLocationsLayer"]);
        locationMarker.bindPopup(locationInfoPopup);
      });
    };

    $scope.show_locations = function(poi_layer) {
      map.addLayer(poi_layer);
    };
    $scope.hide_locations = function(poi_layer) {
      map.removeLayer(poi_layer);
    };

    $scope.toggle_poi_layer = function(layer) {
      if (typeof $scope.toggled[layer] == "undefined") {
        $scope.toggled[layer] = true;
      } else {
        $scope.toggled[layer] = !$scope.toggled[layer];
      }

      var layer_full = layer + "LocationsLayer";
      if ($scope.toggled[layer]) {
        $scope.show_locations($scope.layers[layer_full]);
      } else {
        $scope.hide_locations($scope.layers[layer_full]);
      }
    };

    /////////////////////
    /// LINES (ROADS) ///
    /////////////////////

    function prepareRoadData() {
      Data.getTable(
        {
          schema: "zmb_fbf",
          table: "dashboard_roads",
        },
        function(roads) {
          $scope.prepare_roads(roads[0].roads);
        }
      );
    }

    $scope.prepare_roads = function(roads) {
      $scope.layers["roadsLocationsLayer"] = L.geoJSON(roads.features, {
        style: {
          color: "purple",
          weight: 500,
        },
      });
    };
  },
]);
