"use strict";

// Share URL
// Service to to configure the buttons that tell you which province (etc) you're in (top-left)
//
angular.module("dashboards").factory("admlevelsService", [
  "helpers",
  function(helpers) {
    //Function that colors/fills the level2/level3 buttons (top-left) when coming in at higher level through direct URL
    var directUrlHigherLevel = function(
      admlevel,
      zoom_min,
      parent_codes,
      d,
      country_code
    ) {
      if (admlevel == zoom_min + 2) {
        document
          .getElementById("level3")
          .setAttribute("class", "btn btn-secondary btn-active");
        if (parent_codes.length == 1) {
          var level3name = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + (zoom_min + 1) + "_name"
          )[country_code];
          var levelC_selection = "Selected " + level3name;
        } else if (parent_codes.length > 1) {
          levelC_selection = "Multiple " + level3name;
        }
        var levelC_codes = parent_codes;
      }
      if (admlevel >= zoom_min + 1) {
        document
          .getElementById("level2")
          .setAttribute("class", "btn btn-secondary btn-active");
        if (parent_codes.length == 1) {
          var level2name = helpers.lookUpByCountryCode(
            d.Country_meta,
            "level" + zoom_min + "_name"
          )[country_code];
          var levelB_selection = "Selected " + level2name;
        } else if (parent_codes.length > 1) {
          levelB_selection = "Multiple " + level2name;
        }
        var levelB_codes = parent_codes;
      }
      return {
        levelC_codes: levelC_codes,
        levelC_selection: levelC_selection,
        levelB_codes: levelB_codes,
        levelB_selection: levelB_selection,
      };
    };

    return {
      directUrlHigherLevel: directUrlHigherLevel,
    };
  },
]);
