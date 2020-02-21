angular.module("core").directive("crHeader", [
  function() {
    return {
      restrict: "E", // Use element: `<cr-header>`
      replace: true,
      templateUrl: "modules/core/views/header.client.view.html",
      scope: {
        headerLogo: "@",
        headerLogo2: "<?",
        headerLogo3: "<?",
        activeSection: "@",
        showNormalViews: "<?",
        showEpidemics: "<?",
        showViewStatus: "=",
        viewStatusTitle: "=",
        fnOpenViewStatus: "<?",
        showCountrySelector: "<?",
        showShareExport: "<?",
        fnShareUrl: "<?",
        fnShareCountryUrl: "<?",
        fnExportCsv: "<?",
        fnExportGeojson: "<?",
        fnExportPdf: "<?",
        fnSignupMailing: "<?",
        fnJoinWhatsapp: "<?",
        showHelp: "<?",
        fnAboutCra: "<?",
        fnAboutTutorial: "<?",
        fnAboutGithub: "<?",
        fnAboutFbf: "<?",
        fnAboutTutorialFbf: "<?",
        fnAboutLinkCra: "<?",
        fnAboutLinkEap: "<?",
        viewType: "@",
        showLogin: "<?",
        showLanguages: "<?",
        fnChangeLanguage: "<?",
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
