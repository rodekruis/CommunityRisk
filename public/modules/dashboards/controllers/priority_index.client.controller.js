"use strict";

angular.module("dashboards").controller("PriorityIndexController", [
  "$translate",
  "$scope",
  "$rootScope",
  "$compile",
  "$filter",
  "Authentication",
  "Data",
  "helpers",
  "exportService",
  "shareService",
  "crossfilterService",
  "sidebarHtmlService",
  "colorSetupService",
  "chartService",
  "DEBUG",
  function(
    $translate,
    $scope,
    $rootScope,
    $compile,
    $filter,
    Authentication,
    Data,
    helpers,
    exportService,
    shareService,
    crossfilterService,
    sidebarHtmlService,
    colorSetupService,
    chartService,
    DEBUG
  ) {
    ////////////////////////
    // SET MAIN VARIABLES //
    ////////////////////////

    $scope.change_country = function(country) {
      $scope.country_code = country;
      $rootScope.country_code = country;
      $scope.parent_codes = [];
      $scope.metric = "";
      $scope.initiate($rootScope.view_code);
    };
    $scope.change_disaster_type = function(disaster_type) {
      $scope.disaster_type_toggle = 1;
      $scope.disaster_type = disaster_type;
      $scope.initiate("PI");
    };
    $scope.change_disaster = function(disaster_name) {
      $scope.disaster_toggle = 1;
      $scope.disaster_name = disaster_name;
      $scope.initiate("PI");
    };

    //////////////////////
    // DEFINE VARIABLES //
    //////////////////////

    $rootScope.loadCount = 0;
    $scope.reload = 0;
    $scope.disaster_type_toggle = 0;
    $scope.disaster_toggle = 0;
    $scope.authentication = Authentication;
    $scope.geom = null;
    $scope.view_code = "PI";
    $scope.country_code_default = "PHL";
    $scope.country_code = $scope.country_code_default;
    $scope.admlevel = 3;
    if ($rootScope.country_code) {
      $scope.country_code = $rootScope.country_code;
    } else {
      $rootScope.country_code = $scope.country_code_default;
    }
    $scope.metric = "";
    if ($rootScope.disaster_type) {
      $scope.disaster_type = $rootScope.disaster_type;
    }
    if ($rootScope.view_code) {
      $scope.view_code = $rootScope.view_code;
    }
    $scope.metric_label = "";
    $scope.metric_year = "";
    $scope.metric_source = "";
    $scope.metric_desc = "";
    $scope.metric_icon = "";
    $scope.name_selection = "";
    $scope.name_popup = "";
    $scope.value_popup = 0;
    $scope.country_selection = "";
    $scope.parent_codes = [];
    $scope.data_input = "";
    $scope.filters = [];
    $scope.tables = [];
    $scope.quantileColorDomain_PI_std = [
      "#ffffb2",
      "#fecc5c",
      "#fd8d3c",
      "#f03b20",
      "#bd0026",
    ];
    $scope.quantileColorDomain_PI_error = [
      "#d7191c",
      "#fdae61",
      "#ffffbf",
      "#DA70D6",
      "#8B008B",
    ];
    $scope.quantileColorDomain_CRA_std = [
      "#f1eef6",
      "#bdc9e1",
      "#74a9cf",
      "#2b8cbe",
      "#045a8d",
    ];
    var mapfilters_length = 0;
    var d_prev = "";
    var map;

    ////////////////////////
    // INITIATE DASHBOARD //
    ////////////////////////

    $scope.initiate = function() {
      //Start loading bar
      helpers.start();

      //Load the map-view by default
      $("#row-chart-container").hide();
      $("#map-chart").show();
      $scope.chart_show = "map";

      //Read Disaster Database or PI from URL
      $scope.view_code_PI =
        location.href.indexOf("priority_index") > -1 ? "PI" : "DDB";

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
        $scope.disaster_type = url.disaster_type;
        $scope.disaster_name = url.disaster_name;
      }

      Data.getTable(
        {
          schema: "metadata",
          table: "DPI_disaster_metadata",
        },
        function(disaster_metadata) {
          var event = $.grep(disaster_metadata, function(e) {
            if ($scope.disaster_toggle == 1) {
              return (
                e.country_code == $scope.country_code &&
                e.disaster_type == $scope.disaster_type &&
                e.pi_ddb == $scope.view_code_PI &&
                // ((e.name == $scope.disaster_name && e.pi_ddb == "DDB") ||
                //   e.pi_ddb == "PI")
                e.name == $scope.disaster_name
              );
            } else if ($scope.disaster_type_toggle == 1) {
              return (
                e.country_code == $scope.country_code &&
                e.disaster_type == $scope.disaster_type &&
                e.pi_ddb == $scope.view_code_PI &&
                ((e.default_event == 1 && e.pi_ddb == "DDB") ||
                  e.pi_ddb == "PI")
              );
            } else {
              return (
                e.country_code == $scope.country_code &&
                e.pi_ddb == $scope.view_code_PI &&
                ((e.default_event_country == 1 && e.pi_ddb == "DDB") ||
                  e.pi_ddb == "PI")
              );
            }
          });
          if (event.length == 0) {
            $scope.country_code = $scope.country_code_default;
            $scope.initiate();
          }
          $scope.disaster_type = event[0].disaster_type;
          $scope.disaster_name = event[0].name;
          $scope.disaster_name_string = $scope.disaster_name.replace(/_/g, " ");
          $scope.admlevel = event[0].admin_level;

          //This is the main search-query for PostgreSQL
          $scope.parent_codes_input = "{" + $scope.parent_codes.join(",") + "}";

          Data.getAll(
            {
              admlevel: $scope.admlevel,
              country: $scope.country_code,
              parent_codes: $scope.parent_codes_input,
              view: $scope.view_code,
              disaster_type: $scope.disaster_type,
              disaster_name: $scope.disaster_name,
            },
            function(pgData) {
              $scope.load_data(pgData[0]);

              if (
                $scope.country_code == "PHL" &&
                $scope.disaster_type == "Typhoon"
              ) {
                prepareTrackData(
                  $scope.country_code,
                  $scope.disaster_type,
                  $scope.disaster_name
                );
              }
            }
          );
        }
      );
    };

    ///////////////
    // LOAD DATA //
    ///////////////

    $scope.load_data = function(pgData) {
      var d = {};
      var i;

      // 1. Feature data
      d.Rapportage = pgData.usp_data.ind;

      // 2. Geo-data
      var pcode_list = [];
      for (i = 0; i < d.Rapportage.length; i++) {
        pcode_list[i] = d.Rapportage[i].pcode;
      }
      d.Districts = pgData.usp_data.geo;
      d.Districts.features = $.grep(d.Districts.features, function(e) {
        return pcode_list.indexOf(e.properties.pcode) > -1;
      });
      $scope.geom = d.Districts;

      // 4. Variable-metadata
      d.Metadata_full = pgData.usp_data.meta_indicators;
      d.Metadata = $.grep(d.Metadata_full, function(e) {
        return (
          (((e.view_code == "PI" || e.view_code == "CRA,PI") &&
            helpers
              .nullToEmptyString(e.disaster_type)
              .indexOf($scope.disaster_type) > -1) ||
            (helpers.nullToEmptyString(e.view_code).indexOf("PI") > -1 &&
              helpers.nullToEmptyString(e.disaster_type) == "")) &&
          helpers
            .nullToEmptyString(e.country_code)
            .indexOf($scope.country_code) > -1
        );
      });

      // 5. Country-metadata
      d.Country_meta_full = pgData.usp_data.meta_country;
      d.Country_meta = $.grep(d.Country_meta_full, function(e) {
        return e.country_code == $scope.country_code;
      });

      // 6. Disaster-metadata
      d.Disaster_meta_full = pgData.usp_data.meta_disaster;
      d.Disaster_meta = $.grep(d.Disaster_meta_full, function(e) {
        return (
          e.disaster_type == $scope.disaster_type &&
          e.country_code == $scope.country_code
        );
      });

      DEBUG && console.log(d);

      //Necessary style-change in case sidebar is collapsed when changing countries
      document.getElementById("mapPopup").style.visibility = "hidden";
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
      document
        .getElementsByClassName("sidebar-wrapper")[0]
        .setAttribute("style", "");
      document.getElementsByClassName("reset-button")[0].style.visibility =
        "hidden";
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

      // End loading bar
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
        d.Country_meta_full,
        "country_name"
      );
      var country_zoom_min = helpers.lookUpByCountryCode(
        d.Country_meta_full,
        "zoomlevel_min"
      );
      var country_zoom_max = helpers.lookUpByCountryCode(
        d.Country_meta_full,
        "zoomlevel_max"
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

      $scope.country_selection = country_name[$scope.country_code];
      var zoom_min = Number(country_zoom_min[$scope.country_code]);
      var zoom_max = Number(country_zoom_max[$scope.country_code]);

      if (!$scope.directURLload) {
        if ($scope.view_code_PI == "PI") {
          $scope.metric = "pred_damage_class";
        } else {
          $scope.metric = helpers.lookUpByName(
            d.Disaster_meta,
            "default_metric"
          )[$scope.disaster_name];
        }
      }
      $scope.default_metric = helpers.lookUpByName(
        d.Disaster_meta,
        "default_metric"
      )[$scope.disaster_name];
      $scope.default_metric_label = $scope.default_metric.replace("_", " ");

      if ($scope.admlevel === zoom_min) {
        $scope.name_selection = country_name[$scope.country_code];
      }

      $scope.metric_label = meta_label[$scope.metric];
      $scope.type_selection =
        $scope.admlevel == zoom_min
          ? "Country"
          : helpers.lookUpByCountryCode(
              d.Country_meta_full,
              "level" + ($scope.admlevel - 1) + "_name"
            )[$scope.country_code];
      $scope.subtype_selection = helpers.lookUpByCountryCode(
        d.Country_meta_full,
        "level" + $scope.admlevel + "_name"
      )[$scope.country_code];

      //////////////////////
      // SETUP INDICATORS //
      //////////////////////

      $scope.tables = [];
      var j = 0;
      for (var i = 0; i < d.Metadata.length; i++) {
        var record = {};
        var record_temp = d.Metadata[i];
        if (record_temp.group !== "admin") {
          record.id = "data-table" + [i + 1];
          record.name = record_temp.variable;
          record.group =
            ["vulnerability", "coping_capacity", "general", "other"].indexOf(
              record_temp.group
            ) > -1
              ? "cra_features"
              : record_temp.group;
          record.propertyPath =
            record_temp.agg_method === "sum" ? "value" : "value.finalVal";
          record.dimension = undefined;
          record.weight_var = record_temp.weight_var;
          record.scorevar_name = "";
          record.view = "PI";
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
      var whereGroupSum_scores = cf_result.whereGroupSum_scores;
      var whereGroupSum_scores_tab = cf_result.whereGroupSum_scores_tab;
      var all = cf_result.all;
      var dimensions = cf_result.dimensions;
      $scope.tables = cf_result.tables;

      ///////////////////////////
      /// Priority Index ONLY ///
      ///////////////////////////

      //Create total statistics per disaster
      $scope.actuals = helpers.lookUpByName(d.Disaster_meta, "actuals")[
        $scope.disaster_name
      ];
      $scope.predictions = helpers.lookUpByName(d.Disaster_meta, "predictions")[
        $scope.disaster_name
      ];
      $scope.metric_label = meta_label[$scope.metric];
      if ($scope.actuals == "yes" && $scope.predictions == "no") {
        $scope.type_text =
          "This historical " +
          $scope.disaster_type.toLowerCase() +
          " was used to develop this model, but was never used to make predictions at the time.";
      } else if ($scope.actuals == "yes" && $scope.predictions == "yes") {
        $scope.type_text =
          "For this " +
          $scope.disaster_type.toLowerCase() +
          ", priority areas were predicted using the model, and actual damage was collected later, so prediction errors can be measured.";
      } else if ($scope.actuals == "no" && $scope.predictions == "yes") {
        $scope.type_text =
          "For this " +
          $scope.disaster_type.toLowerCase() +
          ", priority areas were predicted using the model, but actual damage is not yet collected, so prediction errors cannot be measured yet.";
      }
      $scope.start_date = helpers.lookUpByName(d.Disaster_meta, "startdate")[
        $scope.disaster_name
      ];
      $scope.end_date =
        $scope.disaster_type == "Typhoon"
          ? "to " +
            helpers.lookUpByName(d.Disaster_meta, "enddate")[
              $scope.disaster_name
            ]
          : "";

      var total_damage_temp;
      var total_intensity;
      if ($scope.view_code_PI == "DDB") {
        total_damage_temp =
          dimensions[$scope.default_metric].top(1)[0].value > 0
            ? dimensions[$scope.default_metric].top(1)[0].value
            : 0;
        $scope.total_damage = helpers.dec0Format(total_damage_temp);
        $scope.total_potential = helpers.dec0Format(
          dimensions[$scope.default_metric.concat("_potential")].top(1)[0].value
        );
        total_intensity =
          total_damage_temp /
          dimensions[$scope.default_metric.concat("_potential")].top(1)[0]
            .value;
        isNaN(total_intensity)
          ? ($scope.total_intensity = helpers.percFormat(0))
          : ($scope.total_intensity = helpers.percFormat(total_intensity));
      } else {
        total_damage_temp = 0;
        $scope.total_damage = helpers.dec0Format(total_damage_temp);
        $scope.total_potential = 1;
        total_intensity = total_damage_temp / 1;
        isNaN(total_intensity)
          ? ($scope.total_intensity = helpers.percFormat(0))
          : ($scope.total_intensity = helpers.percFormat(total_intensity));
      }

      //Fill the event-dropdown in the sidebar
      var events = document.getElementById("events");
      var drop_events = document.getElementsByClassName("event-drop");
      while (drop_events[0]) {
        drop_events[0].parentNode.removeChild(drop_events[0]);
      }
      for (i = 0; i < d.Disaster_meta.length; i++) {
        record = d.Disaster_meta[i];
        if (
          record.disaster_type == $scope.disaster_type &&
          (($scope.view_code_PI == "DDB" && record.actuals == "yes") ||
            ($scope.view_code_PI == "PI" && record.predictions == "yes"))
        ) {
          var li = document.createElement("li");
          events.appendChild(li);
          var a = document.createElement("a");
          a.setAttribute("ng-click", "change_disaster('" + record.name + "')");
          a.setAttribute("class", "event-drop");
          if (record.startdate && $scope.view_code_PI == "DDB") {
            var len = record.startdate.length;
            a.innerHTML =
              record.name.replace(/_/g, " ") +
              " (" +
              record.startdate.substr(len - 4, len) +
              ")";
          } else {
            a.innerHTML = record.name.replace(/_/g, " ");
          }
          li.appendChild(a);
          $compile(a)($scope);
        }
      }

      /////////////////
      // COLOR SETUP //
      /////////////////

      //Define the colorScaale used in the chart. Additionally a quantile_max is returned for later use.
      $scope.mapchartColors = function() {
        return colorSetupService.mapchartColors_PI(
          $scope.metric,
          d,
          $scope.quantileColorDomain_CRA_std,
          $scope.quantileColorDomain_PI_std,
          $scope.quantileColorDomain_PI_error
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

      //Create all initial HTML for sidebar
      var groups = [
        "predictions",
        "damage",
        "pred_error",
        "disaster",
        "geographic",
        "cra_features",
      ];
      sidebarHtmlService.createHTML_PI(
        groups,
        keyvalue,
        $scope.tables,
        meta_icon,
        meta_unit,
        meta_label,
        $scope.predictions,
        $scope.actuals
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
        return sidebarHtmlService.updateHTML_PI(
          keyvalue,
          $scope.tables,
          meta_unit,
          $scope.predictions,
          $scope.actuals
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
          var colors;
          if ($scope.metric.indexOf("damage_class") > -1) {
            colors = $scope.quantileColorDomain_PI_std;
            if (d.sum == 1) {
              return colors[0];
            } else if (d.sum == 2) {
              return colors[1];
            } else if (d.sum == 3) {
              return colors[2];
            } else if (d.sum == 4) {
              return colors[3];
            } else if (d.sum == 5) {
              return colors[4];
            }
          } else if ($scope.metric == "pred_error_damage") {
            colors = $scope.quantileColorDomain_PI_error;
            if (!d.count) {
              return "#cccccc";
            } else if (d.sum <= -3) {
              return colors[0];
            } else if (d.sum == -2) {
              return colors[1];
            } else if (Math.abs(d.sum) <= 1) {
              return colors[2];
            } else if (d.sum == 2) {
              return colors[3];
            } else if (d.sum >= 3) {
              return colors[4];
            }
          } else {
            return !d.count ? "#cccccc" : mapChart.colors()(d.sum);
          }
        })
        .featureKeyAccessor(function(feature) {
          return feature.properties.pcode;
        })
        .popup(function(d) {
          return lookup[d.key].concat(
            " - ",
            meta_label[$scope.metric],
            ": ",
            helpers.currentFormat(meta_format[$scope.metric], d.value.sum),
            " ",
            meta_unit[$scope.metric]
          );
        })
        .renderPopup(true)
        .turnOnControls(true)
        .legend(dc.leafletLegend().position("topright"))
        //Set up what happens when clicking on the map (popup appearing mainly)
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
                  $scope.value_popup = helpers.currentFormat(
                    meta_format[$scope.metric],
                    record[$scope.metric]
                  );
                  $scope.value_popup_unit = meta_unit[$scope.metric];
                  break;
                }
              }
              $scope.metric_label = meta_label[$scope.metric];
            });
            //In Firefox event is not a global variable >> Not figured out how to fix this, so gave the popup a fixed position in FF only
            if ($(window).width() < 768) {
              popup.style.left = "5px";
              popup.style.bottom = "8%";
            } else if (typeof event !== "undefined") {
              popup.style.left =
                Math.min($(window).width() - 210, event.pageX) + "px";
              popup.style.top =
                Math.min($(window).height() - 210, event.pageY) + "px";
            } else {
              popup.style.left = "390px";
              popup.style.top = "110px";
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
          return isNaN(d.value.sum) ? 0 : -d.value.sum;
        })
        .fixedBarHeight(barheight)
        .valueAccessor(function(d) {
          return isNaN(d.value.sum) ? 0 : d.value.sum;
        })
        .colors(mapchartColors)
        .colorCalculator(function(d) {
          var colors;

          if ($scope.metric.indexOf("damage_class") > -1) {
            colors = $scope.quantileColorDomain_PI_std;
            if (d.value.sum == 1) {
              return colors[0];
            } else if (d.value.sum == 2) {
              return colors[1];
            } else if (d.value.sum == 3) {
              return colors[2];
            } else if (d.value.sum == 4) {
              return colors[3];
            } else if (d.value.sum == 5) {
              return colors[4];
            }
          } else if ($scope.metric == "pred_error_damage") {
            colors = $scope.quantileColorDomain_PI_error;
            if (!d.value.count) {
              return "#cccccc";
            } else if (d.value.sum <= -3) {
              return colors[0];
            } else if (d.value.sum == -2) {
              return colors[1];
            } else if (Math.abs(d.value.sum) <= 1) {
              return colors[2];
            } else if (d.value.sum == 2) {
              return colors[3];
            } else if (d.value.sum >= 3) {
              return colors[4];
            }
          } else {
            return !d.value.count ? "#cccccc" : mapChart.colors()(d.value.sum);
          }
        })
        .label(function(d) {
          if (!meta_scorevar[$scope.metric]) {
            return helpers
              .currentFormat(meta_format[$scope.metric], d.value.sum)
              .concat(" ", meta_unit[$scope.metric], " - ", lookup[d.key]);
          } else {
            return helpers
              .dec2Format(d.value.sum)
              .concat(" / 10 - ", lookup[d.key]);
          }
        })
        .title(function(d) {
          if (!meta_scorevar[$scope.metric]) {
            return helpers
              .nullToEmptyString(lookup[d.key])
              .concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                helpers.currentFormat(meta_format[$scope.metric], d.value.sum),
                " ",
                meta_unit[$scope.metric]
              );
          } else {
            // return lookup[d.key].concat(
            //   " - ",
            //   meta_label[$scope.metric],
            //   " (0-10): ",
            //   helpers.dec2Format(d.value.sum)
            // );
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

      $scope.map_coloring = function(id) {
        var section_id = document.getElementById("section-" + $scope.metric);
        if (section_id) {
          section_id.classList.remove("section-active");
        }
        $scope.metric = id;
        $scope.metric_label = meta_label[id];
        var mapchartColors = $scope.mapchartColors().colorScale;
        $scope.quantile_max = $scope.mapchartColors().quantile_max;
        var cf_scores_metric = $scope.metric;
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
            var colors;
            if ($scope.metric.indexOf("damage_class") > -1) {
              colors = $scope.quantileColorDomain_PI_std;
              if (d.sum == 1) {
                return colors[0];
              } else if (d.sum == 2) {
                return colors[1];
              } else if (d.sum == 3) {
                return colors[2];
              } else if (d.sum == 4) {
                return colors[3];
              } else if (d.sum == 5) {
                return colors[4];
              }
            } else if ($scope.metric == "pred_error_damage") {
              colors = $scope.quantileColorDomain_PI_error;
              if (!d.count) {
                return "#cccccc";
              } else if (d.sum <= -3) {
                return colors[0];
              } else if (d.sum == -2) {
                return colors[1];
              } else if (Math.abs(d.sum) <= 1) {
                return colors[2];
              } else if (d.sum == 2) {
                return colors[3];
              } else if (d.sum >= 3) {
                return colors[4];
              }
            } else {
              return !d.count ? "#cccccc" : mapChart.colors()(d.sum);
            }
          })
          .popup(function(d) {
            return lookup[d.key].concat(
              " - ",
              meta_label[$scope.metric],
              ": ",
              helpers.currentFormat(meta_format[$scope.metric], d.value.sum),
              " ",
              helpers.nullToEmptyString(meta_unit[$scope.metric])
            );
          });

        var xAxis = meta_scorevar[$scope.metric]
          ? 11
          : $scope.quantile_max * 1.1;
        rowChart
          .group(whereGroupSum_scores_tab)
          .ordering(function(d) {
            return isNaN(d.value.sum) ? 0 : -d.value.sum;
          })
          .valueAccessor(function(d) {
            return isNaN(d.value.sum) ? 0 : d.value.sum;
          })
          .colors(mapchartColors)
          .colorCalculator(function(d) {
            var colors;
            if ($scope.metric.indexOf("damage_class") > -1) {
              colors = $scope.quantileColorDomain_PI_std;
              if (d.value.sum == 1) {
                return colors[0];
              } else if (d.value.sum == 2) {
                return colors[1];
              } else if (d.value.sum == 3) {
                return colors[2];
              } else if (d.value.sum == 4) {
                return colors[3];
              } else if (d.value.sum == 5) {
                return colors[4];
              }
            } else if ($scope.metric == "pred_error_damage") {
              colors = $scope.quantileColorDomain_PI_error;
              if (!d.value.count) {
                return "#cccccc";
              } else if (d.value.sum <= -3) {
                return colors[0];
              } else if (d.value.sum == -2) {
                return colors[1];
              } else if (Math.abs(d.value.sum) <= 1) {
                return colors[2];
              } else if (d.value.sum == 2) {
                return colors[3];
              } else if (d.value.sum >= 3) {
                return colors[4];
              }
            } else {
              return !d.value.count
                ? "#cccccc"
                : mapChart.colors()(d.value.sum);
            }
          })
          .label(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return helpers
                .currentFormat(meta_format[$scope.metric], d.value.sum)
                .concat(" ", meta_unit[$scope.metric], " - ", lookup[d.key]);
            } else {
              return helpers
                .dec2Format(d.value.sum)
                .concat(" / 10 - ", lookup[d.key]);
            }
          })
          .title(function(d) {
            if (!meta_scorevar[$scope.metric]) {
              return lookup[d.key].concat(
                " - ",
                meta_label[$scope.metric],
                ": ",
                helpers.currentFormat(meta_format[$scope.metric], d.value.sum),
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
        dc.redrawAll();
        document.getElementById("mapPopup").style.visibility = "hidden";
        document.getElementById("zoomin_icon").style.visibility = "hidden";
        document
          .getElementById("section-" + id)
          .classList.add("section-active");
      };

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

      /////////////////////
      // OTHER FUNCTIONS //
      /////////////////////

      //Function to open the modal with information on indicator
      $scope.info = function(id) {
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

      //Export to GEOJSON
      $scope.export_geojson = function() {
        exportService.exportAsGeoJSON(d.Districts);
      };

      //Export to GEOJSON
      $scope.export_json = function() {
        exportService.exportAsJSON(d.Rapportage);
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
          $scope.chart_show,
          $scope.disaster_type,
          $scope.disaster_name
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
      $scope.reload = 1;
      $scope.disaster_type_toggle = 0;
      $scope.disaster_toggle = 0;

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

      var ul;
      var formats;

      //Create dropdown list of countries HTML
      ul = document.getElementById("country-items");
      while (ul.childElementCount > 0) {
        ul.removeChild(ul.lastChild);
      }
      formats = [];
      var countries = [];
      for (i = 0; i < d.Disaster_meta_full.length; i++) {
        if (
          d.Disaster_meta_full[i].country_code !== null &&
          countries.indexOf(d.Disaster_meta_full[i].country_code) <= -1 &&
          (($scope.view_code_PI == "DDB" &&
            d.Disaster_meta_full[i].actuals == "yes") ||
            ($scope.view_code_PI == "PI" &&
              d.Disaster_meta_full[i].predictions == "yes"))
        ) {
          countries.push(d.Disaster_meta_full[i].country_code);

          record = d.Disaster_meta_full[i];

          if (formats.indexOf(record.format) <= -1 && formats.length > 0) {
            var li2 = document.createElement("li");
            li2.setAttribute("class", "divider");
            ul.appendChild(li2);
          }
          li = document.createElement("li");
          ul.appendChild(li);
          a = document.createElement("a");
          a.setAttribute("class", "submenu-item");
          a.setAttribute(
            "ng-click",
            "change_country('" + record.country_code + "')"
          );
          a.setAttribute("role", "button");
          a.innerHTML = helpers.lookUpByCountryCode(
            d.Country_meta_full,
            "country_name"
          )[record.country_code];
          $compile(a)($scope);
          li.appendChild(a);

          formats.push(record.format);
        }
      }
      //Create dropdown list of disaster types HTML
      ul = document.getElementById("disaster-type-items");
      while (ul.childElementCount > 0) {
        ul.removeChild(ul.lastChild);
      }
      formats = [];
      var disaster_types = [];
      for (i = 0; i < d.Disaster_meta_full.length; i++) {
        if (
          d.Disaster_meta_full[i].country_code == $scope.country_code &&
          d.Disaster_meta_full[i].pi_ddb == $scope.view_code_PI &&
          disaster_types.indexOf(d.Disaster_meta_full[i].disaster_type) <= -1
        ) {
          disaster_types.push(d.Disaster_meta_full[i].disaster_type);

          record = d.Disaster_meta_full[i];

          if (formats.indexOf(record.format) <= -1 && formats.length > 0) {
            li2 = document.createElement("li");
            li2.setAttribute("class", "divider");
            ul.appendChild(li2);
          }
          li = document.createElement("li");
          ul.appendChild(li);
          a = document.createElement("a");
          a.setAttribute("class", "submenu-item");
          a.setAttribute(
            "ng-click",
            "change_disaster_type('" + record.disaster_type + "')"
          );
          a.setAttribute("role", "button");
          a.innerHTML = record.disaster_type;
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

      ///////////////////
      /// FINAL STUFF ///
      ///////////////////

      //Final CSS
      $(".sidebar-wrapper").addClass("in");
      $(document).ready(function() {
        if ($(window).width() < 768) {
          $(".sidebar-wrapper").removeClass("in");
        }
      });
    };

    //////////////////
    /// TRACK DATA ///
    //////////////////

    function prepareTrackData(country_code, disaster_type, disaster_name) {
      Data.getTable(
        {
          schema: country_code + "_datamodel",
          table: "PI_" + disaster_type + "_tracks",
        },
        function(tracks_input) {
          var tracks = tracks_input.filter(function(item) {
            return item.disaster_name == disaster_name;
          });
          $scope.prepare_tracks(tracks[0].tracks);
        }
      );
    }

    $scope.prepare_tracks = function(tracks) {
      $scope.tracks_obs = tracks.features[0];
      $scope.tracks_fc = tracks.features[1];
      $scope.tracksObsLayer = L.geoJSON($scope.tracks_obs, {
        style: {
          color: "#444444",
          weight: 500,
        },
      });
      $scope.tracksFcLayer = L.geoJSON($scope.tracks_fc, {
        style: {
          color: "#444444",
          weight: 500,
          dashArray: "5,10",
        },
      });

      map.addLayer($scope.tracksObsLayer);
      map.addLayer($scope.tracksFcLayer);
    };
  },
]);
