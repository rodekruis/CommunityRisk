"use strict";

//Start by defining the main module and adding the module dependencies
var ngApp = angular.module(
  ApplicationConfiguration.applicationModuleName,
  ApplicationConfiguration.applicationModuleVendorDependencies
);

ngApp.constant("DEBUG", !!window.DEBUG);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config([
  "$locationProvider",
  "$compileProvider",
  "DEBUG",
  function($locationProvider, $compileProvider, DEBUG) {
    $locationProvider.hashPrefix("!");
    $compileProvider.debugInfoEnabled(DEBUG);
  },
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
  // Fixing facebook bug with redirect
  if (window.location.hash === "#_=_") window.location.hash = "#!";

  // Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
