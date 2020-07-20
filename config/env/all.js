"use strict";

module.exports = {
  app: {
    title: "CommunityRisk Dashboard",
    socialImage: "/modules/core/img/510-logo_512x512.png",
    favicon: "/modules/core/img/510-logo_32x32.png",
  },
  port: process.env.PORT || 8080,
  sslport: process.env.SSLPORT || 8008,
  key_file: "./config/cert/localhost-key.pem",
  cert_file: "./config/cert/localhost-cert.pem",
  sessionSecret: "MEAN",
  geoserver: {
    baseUrl: "https://168.63.64.220:444/geoserver/fbf/wms",
  },
  assets: {
    lib: {
      css: [
        "public/build/bower/bootstrap/css/bootstrap.min.css", // in bower.json
        "public/build/custom/bootstrap/css/bootstrap-theme.css", // in bower.json
        "public/build/bower/leaflet/css/leaflet.css", // in bower.json
        "public/build/bower/angular/css/angular-csp.css", // in bower.json
        "public/build/bower/dcjs/css/dc.css", // in bower.json
        "public/build/bower/angular-loading-bar/css/loading-bar.css", // in bower.json
        "public/build/custom/font-awesome/css/font-awesome.min.css", // NOT in bower.json
        "public/build/custom/dc-addons/dist/leaflet-map/dc-leaflet-legend.css", // NOT in bower.json
        "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css",
        "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css",
      ],
      js: [
        "public/build/bower/jquery/js/jquery.min.js", // in bower.json
        "public/build/custom/slick/js/slick.min.js",
        "public/build/bower/crossfilter/js/crossfilter.min.js",
        "public/build/bower/angular/js/angular.js", //in bower.json
        "public/build/bower/angular-route/js/angular-route.js", //in bower.json
        "public/build/bower/angular-resource/js/angular-resource.js", //in bower.json
        "public/build/bower/angular-sanitize/js/angular-sanitize.js",
        "public/build/bower/angular-ui-router/js/angular-ui-router.min.js",
        "public/lib/angular-translate/angular-translate.js", //in bower.json
        "public/build/bower/bootstrap/js/bootstrap.min.js",
        "public/build/bower/leaflet/js/leaflet.js", //in bower.json
        "public/build/bower/angular-gettext/js/angular-gettext.js",
        "public/build/bower/d3/js/d3.js",
        "public/build/bower/dcjs/js/dc.js", //in bower.json
        "public/build/custom/dc-leaflet/js/dc-leaflet-dev.js", // NOT in bower.json
        "public/build/bower/angular-loading-bar/js/loading-bar.js",
        "public/build/bower/jquery-countTo/js/jquery.countTo.js", // in bower.json
        "public/build/bower/jquery-scrollTo/js/jquery-scrollTo.js", // in bower.json
        "public/build/custom/dc-addons/dist/leaflet-map/dc-leaflet.js", // in bower.json
        "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js",
        "public/build/bower/topojson/js/topojson.js", // in bower.json
      ],
    },
    css: ["public/modules/**/*.css"],
    js: [
      "public/config.js",
      "public/application.js",
      "public/modules/*/*.js",
      "public/modules/**/*.js",
    ],
  },
};
