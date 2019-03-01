"use strict";

module.exports = {
  app: {
    title: "Community Profiles Dashboard",
    socialImage: "/modules/core/img/510-logo_512x512.png",
    favicon: "/modules/core/img/510-logo_32x32.png",
  },
  port: process.env.PORT || 3000,
  sslport: process.env.SSLPORT || 444,
  key_file: "./config/cert/localhost-key.pem",
  cert_file: "./config/cert/localhost-cert.pem",
  templateEngine: "swig",
  sessionSecret: "MEAN",
  assets: {
    lib: {
      css: [
        "public/build/bower/bootstrap/css/bootstrap.min.css", // in bower.json
        "public/build/custom/bootstrap/css/bootstrap-theme.min.css", // in bower.json
        "public/build/bower/leaflet/css/leaflet.css", // in bower.json
        "public/build/bower/cartodb.js/css/cartodb.css", // in bower.json
        "public/build/bower/angular/css/angular-csp.css", // in bower.json
        "public/build/bower/dcjs/css/dc.css", // in bower.json
        "public/build/custom/dc-leaflet/css/dc-leaflet-legend.min.css", // NOT in bower.json
        "public/build/bower/angular-loading-bar/css/loading-bar.css", // in bower.json
        "public/build/custom/font-awesome/css/font-awesome.min.css", // NOT in bower.json
        "public/build/custom/dc-addons/dist/leaflet-map/dc-leaflet-legend.css", // NOT in bower.json
      ],
      js: [
        "public/build/bower/jquery/js/jquery.min.js", // in bower.json
        "public/build/custom/slick/js/slick.min.js",
        "public/build/bower/crossfilter/js/crossfilter.min.js",
        "public/build/bower/lodash/js/lodash.underscore.min.js", //in bower.json
        "public/build/bower/angular/js/angular.js", //in bower.json
        "public/build/bower/angular-lodash/js/angular-lodash.js", //in bower.json
        "public/build/bower/angular-route/js/angular-route.js", //in bower.json
        "public/build/bower/angular-resource/js/angular-resource.js", //in bower.json
        "public/build/bower/angular-touch/js/angular-touch.js",
        "public/build/bower/angular-sanitize/js/angular-sanitize.js",
        "public/build/bower/angular-ui-router/js/angular-ui-router.min.js",
        "public/build/bower/angular-css/js/angular-css.js",
        "public/lib/angular-translate/angular-translate.js", //in bower.json
        "public/build/bower/angular-route-styles/js/route-styles.js",
        "public/build/bower/bootstrap/js/bootstrap.min.js",
        "public/build/bower/leaflet/js/leaflet.js", //in bower.json
        "public/build/bower/angular-leaflet-directive/js/angular-leaflet-directive.js", // in bower.json
        "public/build/bower/leaflet-ajax/js/leaflet.ajax.js",
        "public/build/bower/angular-gettext/js/angular-gettext.js",
        "public/build/bower/d3/js/d3.js",
        "public/build/bower/dcjs/js/dc.js", //in bower.json
        "public/build/custom/dc-leaflet/js/dc-leaflet-dev.js", // NOT in bower.json
        "public/build/custom/angular-dc/js/angular-dc.js", //in bower.json
        "public/build/custom/d3-tip/js/d3-tip.js", //NOT in bower.json
        "public/build/bower/angular-messages/js/angular-messages.js", //in bower.json
        "public/build/bower/ngInfiniteScroll/js/ng-infinite-scroll.js", //in bower.json
        "public/build/bower/angular-elastic/js/elastic.js", //in bower.json
        "public/build/bower/underscore/js/underscore.js", //in bower.json
        "public/build/bower/angular-loading-bar/js/loading-bar.js",
        "public/build/bower/leaflet-gps/js/leaflet-gps.min.js", // in bower.json
        "public/build/bower/cartodb.js/js/cartodb_noleaflet.js", // in bower.json
        "public/build/bower/jquery-countTo/js/jquery.countTo.js", // in bower.json
        "public/build/bower/jquery-scrollTo/js/jquery-scrollTo.js", // in bower.json
        "public/build/bower/jquery-easing/js/jquery.easing.min.js", // in bower.json
        "public/lib/jquery-csv/src/jquery.csv.js", // in bower.json
        "public/build/bower/wow/js/wow.js", // in bower.json
        "public/build/custom/dc-addons/dist/leaflet-map/dc-leaflet.js", // in bower.json
        "public/build/bower/topojson/js/topojson.js", // in bower.json
        "public/build/custom/leaflet-geotiff-custom/geotiff.js",
        "public/build/custom/leaflet-geotiff-custom/leaflet.canvaslayer.field.js",
        "//cdnjs.cloudflare.com/ajax/libs/chroma-js/1.3.0/chroma.min.js",
      ],
    },
    css: ["public/modules/*[!dashboards]*/css/*.css"],
    js: [
      "public/config.js",
      "public/application.js",
      "public/modules/*/*.js",
      "public/modules/**/*.js",
    ],
  },
};
