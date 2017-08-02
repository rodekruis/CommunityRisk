'use strict';

angular.module('core')
.directive('heightresize', ['$window', function($window) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {  
			var window = angular.element($window);
        
            scope.onResize = function() {				
               $(elem).height( $window.innerHeight - $('.navbar').height() - $('.mapHeader').height() );
            };
   
            scope.onResize();

            window.bind('resize', function() {
                scope.onResize();
                scope.$apply();
            });
        }
    };
}])

/*
 * Directive to resize a square image
 */
.directive('logoresize', ['$window', function($window) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            var window = angular.element($window);
            
            scope.onResize = function() {
               $(elem).height( (window.height() - $('.navbar').height() - $('.mapHeader').height()) * 0.75 );
               /*$(elem).width( window.height() - $('.navbar').height() - $('.mapHeader').height() );*/
            };
   
            scope.onResize();

            window.bind('resize', function() {
                scope.onResize();
                scope.$apply();
            });
        }
    };
}])
;

    
    