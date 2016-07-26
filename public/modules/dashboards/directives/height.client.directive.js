'use strict';

angular.module('dashboards')

.directive('heightresize', ['$window', function($window) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            var window = angular.element($window);
            
            scope.onResize = function() {
               $(elem).height( $window.innerHeight - $('.navbar').height() - $('.monitorHeader').height());
           };
   
            scope.onResize();

            window.bind('resize', function() {
                scope.onResize();
                scope.$apply();
            });
        }
    };
}]);