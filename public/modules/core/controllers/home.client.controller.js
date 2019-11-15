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

    $(document).ready(function() {
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
