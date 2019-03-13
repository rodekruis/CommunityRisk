"use strict";

// Init the application configuration module for AngularJS application
window.ApplicationConfiguration = (function() {
  // Init module configuration options
  var applicationModuleName = "Nederlandse Rode Kruis Dashboards";
  var applicationModuleVendorDependencies = [
    "ngResource",
    "ngRoute",
    "angularCSS",
    "ngSanitize",
    "ui.router",
    "gettext",
    "AngularDc",
    "angular-loading-bar",
    "pascalprecht.translate",
  ];

  // Add a new vertical module
  var registerModule = function(moduleName) {
    // Create angular module
    angular.module(moduleName, []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule,
  };
})();
