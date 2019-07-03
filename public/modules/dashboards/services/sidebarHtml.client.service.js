"use strict";

// Generate the HTML for the left sidebar
angular.module("dashboards").factory("sidebarHtmlService", [
  "helpers",
  function(helpers) {
    //Create table with current crossfilter-selection output, so that you can also access this in other ways than through DC.js
    var fill_keyvalues = function(
      tables,
      admlevel,
      zoom_max,
      filters,
      meta_format,
      dimensions,
      d,
      d_prev
    ) {
      var keyvalue = [];
      tables.forEach(function(t) {
        var key = t.name;
        if (t.group == "dpi") {
          keyvalue[key] = helpers.dec2Format(d.dpi[0][t.name]);
        } else if (
          admlevel == zoom_max &&
          filters.length == 0 &&
          !isNaN(d_prev[t.name])
        ) {
          if (meta_format[t.name] === "decimal0") {
            keyvalue[key] = helpers.dec0Format(d_prev[t.name]);
          } else if (meta_format[t.name] === "percentage") {
            keyvalue[key] = helpers.percFormat(d_prev[t.name]);
          } else if (meta_format[t.name] === "decimal2") {
            keyvalue[key] = helpers.dec2Format(d_prev[t.name]);
          }
        } else {
          if (t.propertyPath === "value.finalVal") {
            if (isNaN(dimensions[t.name].top(1)[0].value.finalVal)) {
              keyvalue[key] = "-"; //"N.A. on this level";
            } else if (meta_format[t.name] === "decimal0") {
              keyvalue[key] = helpers.dec0Format(
                dimensions[t.name].top(1)[0].value.finalVal
              );
            } else if (meta_format[t.name] === "percentage") {
              keyvalue[key] = helpers.percFormat(
                dimensions[t.name].top(1)[0].value.finalVal
              );
            } else if (meta_format[t.name] === "decimal2") {
              keyvalue[key] = helpers.dec2Format(
                dimensions[t.name].top(1)[0].value.finalVal
              );
            }
          } else if (t.propertyPath === "value") {
            if (isNaN(dimensions[t.name].top(1)[0].value)) {
              keyvalue[key] = "-"; //"N.A. on this level";
            } else if (meta_format[t.name] === "decimal0") {
              keyvalue[key] = helpers.dec0Format(
                dimensions[t.name].top(1)[0].value
              );
            } else if (meta_format[t.name] === "percentage") {
              keyvalue[key] = helpers.percFormat(
                dimensions[t.name].top(1)[0].value
              );
            } else if (meta_format[t.name] === "decimal2") {
              keyvalue[key] = helpers.dec2Format(
                dimensions[t.name].top(1)[0].value
              );
            }
          }
        }
      });
      return keyvalue;
    };

    var createHTML = function(
      groups,
      keyvalue,
      tables,
      admlevel,
      zoom_max,
      filters,
      meta_icon,
      meta_unit,
      dimensions,
      dimensions_scores,
      d,
      d_prev,
      high_med_low,
      predictions,
      actuals
    ) {
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
      var coping_score = document.getElementById("coping_capacity_score_main");
      if (coping_score) {
        coping_score.textContent = keyvalue.coping_capacity_score;
        coping_score.setAttribute(
          "class",
          "component-score " +
            high_med_low("coping_capacity_score", "coping_capacity_score")
        );
      }

      //New for FBF-view
      var pop_affected = document.getElementById("pop_affected_main");
      if (pop_affected) {
        pop_affected.textContent = keyvalue.population_affected;
      }
      var pop_main = document.getElementById("population_main");
      if (pop_main) {
        pop_main.textContent = keyvalue.population;
      }

      //Dynamically create HTML-elements for all indicator tables
      var groupElements = {};
      groups.forEach(function(e) {
        groupElements[e] = document.getElementById(e);
        if (groupElements[e]) {
          while (groupElements[e].firstChild) {
            groupElements[e].removeChild(groupElements[e].firstChild);
          }
        }
      });

      for (var i = 0; i < tables.length; i++) {
        var record = tables[i];
        var width;
        var icon = "modules/dashboards/img/undefined.png";
        var unit = "";

        if (meta_icon[record.name]) {
          icon = "modules/dashboards/img/" + meta_icon[record.name];
        }
        if (record.name === "poi_glofas") {
          icon = "modules/dashboards/img/glofas_icon.png";
        }

        if (meta_unit[record.name] !== "null") {
          unit = meta_unit[record.name];
        }

        if (
          [
            "impact-shelter",
            "impact-access",
            "impact-wash",
            "impact-health",
            "impact-food",
            "key-actors",
            "general",
          ].indexOf(record.group) > -1
        ) {
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
          var click_fn_string;
          if (record.layer_type == "polygon") {
            click_fn_string = "change_indicator('" + record.name + "')";
          } else if (record.layer_type == "raster") {
            click_fn_string = "toggle_raster_layer('" + record.name + "')";
          } else if (record.layer_type == "point") {
            click_fn_string = "toggle_poi_layer('" + record.name + "')";
          } else {
            click_fn_string = "change_indicator('" + record.name + "')";
          }
          div1.setAttribute("ng-click", click_fn_string);
          div1.innerHTML = "{{ '" + record.name + "' | translate }}";
          div.appendChild(div1);
          //$compile(div1)($scope);
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
          button.setAttribute("class", "btn-modal info-btn");
          button.setAttribute("data-toggle", "modal");
          button.setAttribute("ng-click", "info('" + record.name + "')");
          div3.appendChild(button);
          //$compile(button)($scope);
          img = document.createElement("img");
          img.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
          img.setAttribute("style", "height:17px");
          button.appendChild(img);
        } else if (record.group === "other") {
          if (
            admlevel == zoom_max &&
            filters.length == 0 &&
            !isNaN(d_prev[record.scorevar_name])
          ) {
            width = d_prev[record.scorevar_name] * 10;
          } else {
            width = dimensions[record.name].top(1)[0].value.finalVal * 10;
          }

          if (
            !(predictions == "no" && record.group == "predictions") &&
            !(actuals == "no" && record.group == "damage") &&
            !(
              (predictions == "no" || actuals == "no") &&
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
            //$compile(div1)($scope);
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
            div3.setAttribute("class", "col-md-1 col-sm-1 col-xs-1 no-padding");
            div.appendChild(div3);
            button = document.createElement("button");
            button.setAttribute("type", "button");
            button.setAttribute("class", "btn-modal info-btn");
            button.setAttribute("data-toggle", "modal");
            button.setAttribute("ng-click", "info('" + record.name + "')");
            div3.appendChild(button);
            //$compile(button)($scope);
            var img3 = document.createElement("img");
            img3.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
            img3.setAttribute("style", "height:17px");
            button.appendChild(img3);
          }
        } else if (record.group !== "hide") {
          if (record.group == "dpi") {
            width = d.dpi[0][record.name] * 100;
          } else if (
            admlevel == zoom_max &&
            filters.length == 0 &&
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
          //$compile(div1)($scope);
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
          button.setAttribute("class", "btn-modal info-btn");
          button.setAttribute("data-toggle", "modal");
          button.setAttribute("ng-click", "info('" + record.name + "')");
          div3.appendChild(button);
          //$compile(button)($scope);
          img3 = document.createElement("img");
          img3.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
          img3.setAttribute("style", "height:17px");
          button.appendChild(img3);
        }
      }
    };

    var createHTML_PI = function(
      groups,
      keyvalue,
      tables,
      meta_icon,
      meta_unit,
      meta_label,
      predictions,
      actuals
    ) {
      //Dynamically create HTML-elements for all indicator tables
      var groupElements = {};
      groups.forEach(function(e) {
        groupElements[e] = document.getElementById(e);
        if (groupElements[e]) {
          while (groupElements[e].firstChild) {
            groupElements[e].removeChild(groupElements[e].firstChild);
          }
        }
      });

      for (var i = 0; i < tables.length; i++) {
        var record = tables[i];
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

        if (record.group !== "hide" && document.getElementById(record.group)) {
          if (
            (!(predictions == "no" && record.group == "predictions") &&
              !(actuals == "no" && record.group == "damage") &&
              !(
                (predictions == "no" || actuals == "no") &&
                record.group == "pred_error"
              )) ||
            record.group == "cra_features"
          ) {
            var div = document.createElement("div");
            div.setAttribute("class", "component-section");
            div.setAttribute("id", "section-" + record.name);
            var parent = document.getElementById(record.group);
            parent.appendChild(div);
            var div0 = document.createElement("div");
            div0.setAttribute("class", "col-md-2 col-sm-2 col-xs-2");
            div.appendChild(div0);
            var img1 = document.createElement("img");
            img1.setAttribute("style", "height:20px");
            img1.setAttribute("src", icon);
            div0.appendChild(img1);
            var div1 = document.createElement("div");
            div1.setAttribute(
              "class",
              "col-md-9 col-sm-9 col-xs-9 component-label"
            );
            div1.setAttribute(
              "ng-click",
              "map_coloring('" + record.name + "')"
            );
            div1.innerHTML = meta_label[record.name];
            //$compile(div1)($scope);
            div.appendChild(div1);
            var div1a = document.createElement("div");
            div1a.setAttribute("class", "component-score ");
            div1a.setAttribute("id", record.name);
            div1a.innerHTML = keyvalue[record.name] + " " + unit;
            div1.appendChild(div1a);
            var div3 = document.createElement("div");
            div3.setAttribute("class", "col-md-1 col-sm-1 col-xs-1 no-padding");
            div.appendChild(div3);
            var button = document.createElement("button");
            button.setAttribute("type", "button");
            button.setAttribute("class", "btn-modal info-btn");
            button.setAttribute("data-toggle", "modal");
            button.setAttribute("ng-click", "info('" + record.name + "')");
            div3.appendChild(button);
            //$compile(button)($scope);
            var img3 = document.createElement("img");
            img3.setAttribute("src", "modules/dashboards/img/icon-popup.svg");
            img3.setAttribute("style", "height:17px");
            button.appendChild(img3);
          }
        }
      }
    };

    var updateHTML = function(
      keyvalue,
      tables,
      admlevel,
      zoom_max,
      filters,
      meta_unit,
      dimensions,
      dimensions_scores,
      d,
      d_prev,
      high_med_low,
      predictions,
      actuals
    ) {
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
      var coping_score = document.getElementById("coping_capacity_score_main");
      if (coping_score) {
        coping_score.textContent = keyvalue.coping_capacity_score;
        coping_score.setAttribute(
          "class",
          "component-score " +
            high_med_low("coping_capacity_score", "coping_capacity_score")
        );
      }

      //New for FBF-view
      var pop_affected = document.getElementById("pop_affected_main");
      if (pop_affected) {
        pop_affected.textContent = keyvalue.population_affected;
      }
      var pop_main = document.getElementById("population_main");
      if (pop_main) {
        pop_main.textContent = keyvalue.population;
      }

      for (var i = 0; i < tables.length; i++) {
        var record = tables[i];
        var width;
        var unit;

        if (meta_unit[record.name] === "null") {
          unit = "";
        } else {
          unit = meta_unit[record.name];
        }

        if (
          [
            "impact-shelter",
            "impact-access",
            "impact-wash",
            "impact-health",
            "impact-food",
            "key-actors",
            "general",
          ].indexOf(record.group) > -1
        ) {
          var div2 = document.getElementById(record.name);
          div2.innerHTML = keyvalue[record.name] + " " + unit;
        } else if (record.group === "other") {
          if (
            admlevel == zoom_max &&
            filters.length == 0 &&
            !isNaN(d_prev[record.scorevar_name])
          ) {
            width = d_prev[record.scorevar_name] * 10;
          } else {
            width = dimensions[record.name].top(1)[0].value.finalVal * 10;
          }

          if (
            !(predictions == "no" && record.group == "predictions") &&
            !(actuals == "no" && record.group == "damage") &&
            !(
              (predictions == "no" || actuals == "no") &&
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
            admlevel == zoom_max &&
            filters.length == 0 &&
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

    var updateHTML_PI = function(
      keyvalue,
      tables,
      meta_unit,
      predictions,
      actuals
    ) {
      for (var i = 0; i < tables.length; i++) {
        var record = tables[i];
        var unit;

        if (meta_unit[record.name] === "null") {
          unit = "";
        } else {
          unit = meta_unit[record.name];
        }

        if (record.group !== "hide" && document.getElementById(record.group)) {
          if (
            (!(predictions == "no" && record.group == "predictions") &&
              !(actuals == "no" && record.group == "damage") &&
              !(
                (predictions == "no" || actuals == "no") &&
                record.group == "pred_error"
              )) ||
            record.group == "cra_features"
          ) {
            var div1a = document.getElementById(record.name);
            div1a.setAttribute("class", "component-score ");
            div1a.innerHTML = keyvalue[record.name] + " " + unit;
          }
        }
      }
    };

    return {
      fill_keyvalues: fill_keyvalues,
      createHTML: createHTML,
      createHTML_PI: createHTML_PI,
      updateHTML: updateHTML,
      updateHTML_PI: updateHTML_PI,
    };
  },
]);
