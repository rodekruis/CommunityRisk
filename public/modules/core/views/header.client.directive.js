angular.module("core").directive("crHeader", [
  function() {
    return {
      restrict: "E", // Use element: `<cr-header>`
      replace: true,
      templateUrl: "modules/core/views/header.client.view.html",
      controller: [
        "$scope",
        "$attrs",
        "DEBUG",
        "Authentication",
        function($scope, $attrs, DEBUG, Authentication) {
          $scope.isLoggedIn = !!Authentication.user;

          $scope.activeSection = $attrs.activeSection;
          $scope.enableFbf = DEBUG && $scope.isLoggedIn;
          $scope.showLogin = DEBUG;
        },
      ],
    };
  },
]);
