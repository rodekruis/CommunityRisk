"use strict";

angular.module("core").controller("HomeController", [
  "$scope",
  "$rootScope",
  "$filter",
  "Authentication",
  "helpers",
  "DEBUG",
  function($scope, $rootScope, $filter, Authentication, helpers, DEBUG) {
    $scope.DEBUG = DEBUG;

    $scope.authentication = Authentication;

    $rootScope.country_code = "";
    $rootScope.disaster_type = "";
    $rootScope.view_code = "";

    $scope.choose_country = function(country) {
      $(window).scrollTop(0);
      $rootScope.country_code = country;
    };

    var map;

    dc.chartRegistry.clear();
    if (map !== undefined) {
      map.remove();
    }

    var map_chart = dc.leafletChoroplethChart("#map-chart-home");
    d3.dsv(";")("modules/core/data/country_metadata.csv", function(
      country_meta
    ) {
      d3.json("modules/core/data/worldmap.json", function(worldmap) {
        var cf = crossfilter(country_meta);
        cf.country_code = cf.dimension(function(d) {
          return d.country_code;
        });
        var country_code = cf.country_code.group().reduceSum(function(d) {
          if (d.format == "all") {
            return 1;
          } else if (d.format == "basic") {
            return 2;
          } else {
            return 3;
          }
        });
        // group with all, needed for data-count
        var all = cf.groupAll();
        dc.dataCount("#count-info-home")
          .dimension(cf)
          .group(all);

        var countries = topojson.feature(worldmap, worldmap.objects.countries);

        var lookup = helpers.lookUpProperty(countries, "id", "name");

        map_chart
          .width(660)
          .height(800)
          .dimension(cf.country_code)
          .group(country_code)
          .geojson(countries)
          .colorCalculator(function(d) {
            if (typeof d == "undefined") {
              return "#ccc";
            } else if (d == 1) {
              return "#045a8d";
            } else if (d == 2) {
              return "#74a9cf";
            } else if (d == 3) {
              return "#bdc9e1";
            }
          })
          .valueAccessor(function(d) {
            return d.value;
          })
          .featureKeyAccessor(function(feature) {
            return feature.properties.id;
          })
          .popup(function(d) {
            return lookup[d.key];
          })
          .on("filtered", function(chart) {
            $(window).scrollTop(0);
            $scope.choose_country(chart.filters()[0]);
            window.location.replace("#!/community_risk");
          });
        dc.renderAll();
        map = map_chart.map();
        map.fitBounds([[-30, -90], [45, 120]]);
      });

      $scope.countriesAvailable = $filter("orderBy")(country_meta, [
        "+format",
        "+country_code",
      ]);
    });

    $(document).ready(function() {
      $(".js-count-to").countTo();

      var slickOptions = {
        dots: true,
        infinite: false,
        speed: 300,
        slidesToShow: 1,
        fade: true,
        centerMode: true,
      };

      if ($("#slider").length !== 0) {
        $("#slider").slick(slickOptions);
      }

      if ($("#slider_PI").length !== 0) {
        $("#slider_PI").slick(slickOptions);
      }
    });
  },
]);
