"use strict";

// Share URL
// Generate a url to share the current view/state of the dashboard
angular.module("dashboards").factory("shareService", [
  function() {
    /**
     * Create parameter-specific URL
     *
     * @returns {String}
     */
    function createFullUrl(
      country,
      admlevel,
      metric,
      parent_code,
      viewType,
      disaster,
      event
    ) {
      var currentUrl = location.href;
      var baseUrl = currentUrl.split("?")[0];
      var separator = currentUrl.indexOf("?") !== -1 ? "&" : "?";
      var urlParameters = "country=" + country;

      // The order of parameters in the URL is important,
      // as they will be used IN ORDER, NOT by name.

      if (admlevel) {
        urlParameters += "&admlevel=" + admlevel;
      }

      if (metric) {
        urlParameters += "&metric=" + metric;
      }

      if (parent_code) {
        urlParameters += "&parent_code=" + parent_code;
      }

      if (viewType) {
        urlParameters += "&view=" + viewType;
      }

      if (disaster) {
        urlParameters += "&disaster=" + disaster;
      }

      if (event) {
        urlParameters += "&event=" + event;
      }

      return baseUrl + separator + urlParameters;
    }

    /**
     * @param {String} countryCode
     *
     * @returns {String}
     */
    function createCountryUrl(countryCode) {
      return location.href + "?country=" + countryCode;
    }

    /**
     * Copy the value of the #share-url-container element to the users' clipboard
     */
    function copyToClipboard() {
      var containerElement = document.getElementById("share-url-container");

      containerElement.select();
      document.execCommand("copy");
    }

    /**
     * Parse a url into an object with properties/parameters
     *
     * @param {String} url
     *
     * @returns {Object}
     */
    function readParameterUrl(url) {
      var directURLload;

      if (url.indexOf("?") > -1) {
        var params_in = url.split("?")[1].split("&");
        var params_out = {};
        params_in.forEach(function(e) {
          var pair = e.split("=");
          params_out[pair[0]] = pair[1];
        });
        var country_code = params_out.country;
        if (params_in[1]) {
          directURLload = true;
          var admlevel = parseInt(params_out.admlevel);
          var metric = params_out.metric;
          var chart_show = params_out.view;
          var parent_codes =
            params_out.parent_code == ""
              ? []
              : params_out.parent_code.split(",");
          if (params_in.disaster_type) {
            var disaster_type = params_out.disaster;
            var disaster_name = params_out.event.replace("%20", " ");
          }
        } else {
          directURLload = false;
        }
        var view = url.split("#!/")[1].split("?")[0];
        window.history.pushState({}, document.title, "/#!/" + view);
      } else {
        directURLload = false;
      }

      return {
        directURLload: directURLload,
        country_code: country_code,
        admlevel: admlevel,
        metric: metric,
        chart_show: chart_show,
        parent_codes: parent_codes,
        disaster_type: disaster_type,
        disaster_name: disaster_name,
      };
    }

    return {
      createFullUrl: createFullUrl,
      createCountryUrl: createCountryUrl,
      copyToClipboard: copyToClipboard,
      readParameterUrl: readParameterUrl,
    };
  },
]);
