"use strict";

angular.module("dashboards").controller("EpidemicsController", [
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
  "districtButtonsService",
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
    districtButtonsService,
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
      $scope.metric = "population";
      $scope.initiate($rootScope.view_code);
    };

    //////////////////////
    // DEFINE VARIABLES //
    //////////////////////

    $rootScope.loadCount = 0;
    $scope.reload = 0;
    $scope.authentication = Authentication;
    $scope.geom = null;
    $scope.country_code_default = "PHL";
    $scope.country_code = $scope.country_code_default;
    $scope.view_code = "ERA";
    $scope.metric = "population";
    // if ($rootScope.country_code) {
    //   $scope.country_code = $rootScope.country_code;
    // } else {
    //   $rootScope.country_code = $scope.country_code_default;
    // }
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

      //Set some exceptions, can be done better in future (i.e. reading from metadata, BUT metadata is only read later in the script currently)
      if (!$scope.directURLload && !d) {
        $scope.admlevel = $scope.country_code == "PHL" ? 3 : 1;
      }
      $scope.multipleAdminLevels = $scope.country_code == "MLI" ? true : false;

      $scope.parent_codes_input = "{" + $scope.parent_codes.join(",") + "}";

      loadFunction(d);
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
        function(general_data) {
          Data.getEraData(
            {
              country: $scope.country_code,
              admlevel: $scope.admlevel,
              pcodes: $scope.parent_codes_input,
            },
            function(era_data) {
              $scope.load_data(d, general_data[0], era_data);
            }
          );
        }
      );
    };

    $scope.load_data = function(d, pgData, era_data) {
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
      d.Rapportage = era_data;
      // d.Rapportage = [];
      // for (i = 0; i < d.Districts.features.length; i++) {
      //   d.Rapportage[i] = d.Districts.features[i].properties;
      // }

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
          e.view_code.indexOf("ERA") !== -1 &&
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

      DEBUG && console.log(d);

      //Clean up some styling (mainly for if you change to new country when you are at a lower zoom-level already)
      if ($scope.reload == 0) {
        document
          .getElementsByClassName("sidebar-wrapper")[0]
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

      var country_status = helpers.lookUpByCountryCode(
        d.Country_meta,
        "format"
      )[$scope.country_code];

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
      $scope.levelA_selection = districtButtons.levelA_selection;
      $scope.levelA_selection_pre = districtButtons.levelA_selection_pre;

      //////////////////////////////////
      // SETUP VIEW STATUS - CRA ONLY //
      //////////////////////////////////

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
          record.group =
            [
              "hazard",
              "vulnerability",
              "coping_capacity",
              "exposure",
              "susceptibility",
              "scores",
            ].indexOf(record_temp.group) !== -1
              ? "era-" + record_temp.group
              : record_temp.group; // ADJUSTED
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

      if ($scope.country_code === "PHL") {
        $scope.scores = true;
        $scope.exposure = true;
        $scope.susceptibility = true;

        $scope.hazard = false;
        $scope.vulnerability = false;
        $scope.coping_capacity = false;
      } else if ($scope.country_code === "MLI") {
        $scope.scores = false;
        $scope.exposure = false;
        $scope.susceptibility = false;

        $scope.hazard = true;
        $scope.vulnerability = true;
        $scope.coping_capacity = true;
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

      //Create all initial HTML for sidebar
      var groups = [
        "general",
        "era-scores",
        "era-vulnerability",
        "era-hazard",
        "era-coping_capacity",
        "era-exposure",
        "era-susceptibility",
      ];
      sidebarHtmlService.createHTML(
        $scope.view_code,
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
        "", //actuals
        $scope.country_code
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
          return d.count == 0 ? "#cccccc" : mapChart.colors()(d.sum);
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
            $scope.parent_codes = [];
            $scope.name_selection = $scope.levelC_selection;
            document
              .getElementById("level2")
              .setAttribute("class", "btn btn-secondary btn-active");
            document
              .getElementById("level3")
              .setAttribute("class", "btn btn-secondary btn-active");
            $scope.initiate(d);
          }
        } else {
          if (dest_level === 1 && $scope.admlevel > zoom_min) {
            $scope.admlevel = zoom_min;
            $scope.parent_codes = [];
            $scope.initiate(d);
          } else if (dest_level === 2 && $scope.admlevel > zoom_min + 1) {
            $scope.admlevel = zoom_min + 1;
            $scope.parent_codes = $scope.levelB_codes;
            $scope.name_selection = $scope.name_selection_prev;
            $scope.initiate(d);
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

      /////////////////////////////////
      // MAP & ROW RELATED FUNCTIONS //
      /////////////////////////////////

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
            return d.count == 0 ? "#cccccc" : mapChart.colors()(d.sum);
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
      if (!$scope.metric_info) {
        $scope.metric_info = $scope.metric;
      }
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

      $scope.export_pdf = function() {
        $("#printModal").modal("show");
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

      L.control.scale().addTo(map);
      var scale_child = $(".leaflet-control-scale")[0];
      var scale_parent = $(".leaflet-bottom.leaflet-right")[0];
      scale_parent.insertBefore(scale_child, scale_parent.childNodes[0]);

      var zoom_child = $(".leaflet-control-zoom")[0];
      var zoom_parent = $(".leaflet-bottom.leaflet-right")[0];
      zoom_parent.insertBefore(zoom_child, zoom_parent.childNodes[0]);

      d.Country_meta_full = $filter("orderBy")(d.Country_meta_full, [
        "+format",
        "+country_code",
      ]);

      //Create HTML
      var ERA_countries = ["PHL", "MLI"];
      var ul = document.getElementById("country-items");
      while (ul.childElementCount > 0) {
        ul.removeChild(ul.lastChild);
      }
      var formats = [];
      for (i = 0; i < d.Country_meta_full.length; i++) {
        record = d.Country_meta_full[i];
        if (ERA_countries.indexOf(record.country_code) > -1) {
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
      $("#country-selection-span").text($scope.country_selection);

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
          metric_label: helpers.checkSingleCountry(
            $scope.metric,
            d,
            $scope.country_code
          ),
          metric_label_popup: helpers.checkSingleCountry(
            $scope.metric_info,
            d,
            $scope.country_code
          ),
          metric_desc: "desc_".concat(
            helpers.checkSingleCountry(
              $scope.metric_info,
              d,
              $scope.country_code
            )
          ),
          subtype_selection: $scope.subtype_selection,
          levelA_selection_pre: $scope.levelA_selection_pre,
          levelB_selection_pre: $scope.levelB_selection_pre,
          levelC_selection_pre: $scope.levelC_selection_pre,
        };
      };
    };
  },
]);
