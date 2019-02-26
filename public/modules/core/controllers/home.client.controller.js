"use strict";

angular.module("core").controller("HomeController", [
  "$translate",
  "$scope",
  "$css",
  "$rootScope",
  "$compile",
  "Authentication",
  "leafletData",
  function(
    $translate,
    $scope,
    $css,
    $rootScope,
    $compile,
    Authentication,
    leafletData
  ) {
    $css.remove("modules/dashboards/css/storyboard.css");
    $css.remove("modules/dashboards/css/dashboards.css");
    $css.add("modules/dashboards/css/header.css");

    $scope.authentication = Authentication;

    $rootScope.country_code = "";
    $rootScope.disaster_type = "";
    $rootScope.view_code = "";

    $scope.choose_country = function(country) {
      $(window).scrollTop(0);
      $rootScope.country_code = country;
    };
    $scope.setup_PI = function(country, disaster_type) {
      $rootScope.country_code = country;
      $rootScope.disaster_type = disaster_type;
    };
    $scope.choose_view = function(view) {
      $(window).scrollTop(0);
      $rootScope.view_code = view;
    };

    var map;

    dc.chartRegistry.clear();
    if (map !== undefined) {
      map.remove();
    }

    var map_chart = dc.leafletChoroplethChart("#map-chart");
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
        dc.dataCount("#count-info")
          .dimension(cf)
          .group(all);

        var countries = topojson.feature(worldmap, worldmap.objects.countries);

        // fill the lookup table which finds the community name with the community code
        var lookup = {};
        countries.features.forEach(function(e) {
          lookup[e.properties.id] = String(e.properties.name);
        });

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
            console.log(d);
            return d.value;
          })
          .featureKeyAccessor(function(feature) {
            return feature.properties.id;
          })
          .popup(function(d) {
            return lookup[d.key];
          })
          .on("filtered", function(chart, filters) {
            $(window).scrollTop(0);
            $scope.choose_country(chart.filters()[0]);
            window.location.replace("#!/community_risk");
          });
        dc.renderAll();
        map = map_chart.map();
        map.fitBounds([[-30, -90], [45, 120]]);
      });

      //Automatically fill country-dropdown menu
      //First sort country-items in right order
      var sort_by;
      (function() {
        // utility functions
        var default_cmp = function(a, b) {
            if (a == b) return 0;
            return a < b ? -1 : 1;
          },
          getCmpFunc = function(primer, reverse) {
            var dfc = default_cmp, // closer in scope
              cmp = default_cmp;
            if (primer) {
              cmp = function(a, b) {
                return dfc(primer(a), primer(b));
              };
            }
            if (reverse) {
              return function(a, b) {
                return -1 * cmp(a, b);
              };
            }
            return cmp;
          };
        // actual implementation
        sort_by = function() {
          var fields = [],
            n_fields = arguments.length,
            field,
            name,
            reverse,
            cmp;

          // preprocess sorting options
          for (var i = 0; i < n_fields; i++) {
            field = arguments[i];
            if (typeof field === "string") {
              name = field;
              cmp = default_cmp;
            } else {
              name = field.name;
              cmp = getCmpFunc(field.primer, field.reverse);
            }
            fields.push({
              name: name,
              cmp: cmp,
            });
          }
          // final comparison function
          return function(A, B) {
            var a, b, name, result;
            for (var i = 0; i < n_fields; i++) {
              result = 0;
              field = fields[i];
              name = field.name;

              result = field.cmp(A[name], B[name]);
              if (result !== 0) break;
            }
            return result;
          };
        };
      })();

      country_meta.sort(
        sort_by("format", { name: "country_code", reverse: false })
      );

      //Create HTML
      var ul = document.getElementById("country-items");
      while (ul.childElementCount > 0) {
        ul.removeChild(ul.lastChild);
      }
      var formats = [];
      for (var i = 0; i < country_meta.length; i++) {
        var record = country_meta[i];

        if (formats.indexOf(record.format) <= -1 && formats.length > 0) {
          var li2 = document.createElement("li");
          li2.setAttribute("class", "divider");
          ul.appendChild(li2);
        }
        var li = document.createElement("li");
        ul.appendChild(li);
        var a = document.createElement("a");
        a.setAttribute(
          "ng-click",
          "choose_country('" + record.country_code + "')"
        );
        a.setAttribute("ng-href", "#!/community_risk");
        a.setAttribute("role", "button");
        a.innerHTML =
          record.format == "all"
            ? record.country_name
            : record.country_name + " (" + record.format + ")";
        $compile(a)($scope);
        li.appendChild(a);

        formats.push(record.format);
      }
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

    //////////////////////////////////////
    /// TRANSLATION TO OTHER LANGUAGES ///
    //////////////////////////////////////

    //Translation button
    $scope.changeLanguage = function(langKey) {
      $translate.use(langKey);
    };

    $scope.translateData = function() {
      return {
        metric_label: $scope.metric,
        metric_desc: "desc_" + $scope.metric,
        subtype_selection: $scope.subtype_selection,
      };
    };
  },
]);
