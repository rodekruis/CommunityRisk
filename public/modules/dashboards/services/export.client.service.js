"use strict";

// Export Data
// Service to generate the current data-set into different formats
//
angular.module("dashboards").factory("exportService", [
  function() {
    /**
     * @param {Object} content
     * @param {Object} meta_label
     *
     * @returns {String}
     */

    var notUseProperties = [
      "$delete",
      "$get",
      "$query",
      "$remove",
      "$save",
      "toJSON",
    ];

    function createCSV(content, meta_label) {
      var csvFile = "";

      for (var i = 0; i < content.length; i++) {
        var value = content[i];

        if (i === 0) {
          csvFile += createHeaderLine(value, meta_label);
        }

        for (var key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            var innerValue = JSON.stringify(value[key]);
            if (notUseProperties.indexOf(key) == -1) {
              csvFile += cleanValue(innerValue, key);
            }
          }
        }

        csvFile += "\n";
      }

      return csvFile;
    }

    function createHeaderLine(value, meta_label) {
      var line = "";

      for (var key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          var label = createLabel(meta_label, key);
          if (notUseProperties.indexOf(key) == -1) {
            // console.log(label);
            line += cleanValue(label, key);
          }
        }
      }

      return line + "\n";
    }

    function createLabel(meta_label, key) {
      if (meta_label[key]) {
        return meta_label[key];
      } else if (meta_label[key.replace("_score", "")]) {
        return meta_label[key.replace("_score", "")] + " (0-10)";
      } else {
        return key;
      }
    }

    function cleanValue(value, key) {
      var result = value.replace(/"/g, "");

      if (result.search(/("|,|\n)/g) >= 0) {
        result = "" + result + "";
      }
      if (key !== "name") {
        result = ";" + result;
      }

      return result;
    }

    /**
     * @param {String} data
     * @param {String} fileName
     * @param {String} fileType
     */
    function triggerDownload(data, fileName, fileType) {
      var dataUrl =
        "data:" + fileType + ";charset=utf-8," + encodeURIComponent(data);
      var tempLink = document.createElement("a");
      document.body.appendChild(tempLink);

      tempLink.setAttribute("href", dataUrl);
      tempLink.setAttribute("download", fileName);
      tempLink.click();

      tempLink.parentNode.removeChild(tempLink);
    }

    /**
     * @param {Object} data
     * @param {Object} meta_label
     */
    function exportAsCSV(data, meta_label) {
      var exportData = createCSV(data, meta_label);

      triggerDownload(exportData, "export.csv", "text/csv");
    }

    /**
     * @param {Object} data
     *
     * @alias: exportAsGeoJSON
     */
    function exportAsJSON(data) {
      var exportData = JSON.stringify(data);

      triggerDownload(exportData, "export.json", "application/json");
    }

    return {
      exportAsCSV: exportAsCSV,
      exportAsGeoJSON: exportAsJSON,
      exportAsJSON: exportAsJSON,
    };
  },
]);
