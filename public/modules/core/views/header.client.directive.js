angular.module("core").directive("crHeader", [
  function() {
    return {
      restrict: "E", // Use element: `<cr-header>`
      replace: true,
      templateUrl: "modules/core/views/header.client.view.html",
      scope: {
        activeSection: "@",
        showViewStatus: "=",
        viewStatusTitle: "=",
        fnOpenViewStatus: "<?",
        showShareExport: "<?",
        fnShareUrl: "<?",
        fnShareCountryUrl: "<?",
        fnExportCsv: "<?",
        fnExportGeojson: "<?",
        fnExportPdf: "<?",
        fnSignupMailing: "<?",
        fnJoinWhatsapp: "<?",
        showHelp: "<?",
        viewType: "<?",
      },
      controller: [
        "$scope",
        "DEBUG",
        "Authentication",
        function($scope, DEBUG, Authentication) {
          $scope.isLoggedIn = !!Authentication.user;

          $scope.enableFbf = DEBUG && $scope.isLoggedIn;

          $scope.showLogin = DEBUG;
        },
      ],
    };
  },
]);
