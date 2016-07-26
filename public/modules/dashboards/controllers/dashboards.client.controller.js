'use strict';

angular.module('dashboards')

.controller('DashboardsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Dashboards', 'CartoDB', '$sce', '$interval', '$window',
	function($scope, $stateParams, $location, Authentication, Dashboards, CartoDB, $sce, $interval, $window) {
		$scope.authentication = Authentication;

		var window = angular.element($window);

		$scope.create = function() {
			var dashboard = new Dashboards({
				name: this.name,
				description: this.description,
				url: this.url
			});
			dashboard.$save(function(response) {
				$location.path('dashboards/' + response._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});

			this.name = '';
			this.description = '';
			this.url = '';
		};

		$scope.remove = function(dashboard) {
			if (dashboard) {
				dashboard.$remove();

				for (var i in $scope.dashboards) {
					if ($scope.dashboards[i] === dashboard) {
						$scope.dashboards.splice(i, 1);
					}
				}
			} else {
				$scope.dashboard.$remove(function() {
					$location.path('dashboards');
				});
			}
		};

		$scope.update = function() {
			var dashboard = $scope.dashboard;

			dashboard.$update(function() {
				$location.path('dashboards/' + dashboard._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.find = function() {
			$scope.dashboards = Dashboards.query();	
		};

		$scope.findOne = function() {
			$scope.dashboard = Dashboards.get({
				dashboardId: $stateParams.dashboardId
			});			
		};		
            
	    // resize the remainder of the page, excluding the height of the navbar and the dashboard header
		$scope.onResize = function() {
			var newHeight = $('window').innerHeight - $('.navbar').height() - $('.dashboardHeader').height();
			$('.dashboardVerticalStretch').css('height', newHeight);
			$('.dashboardVerticalStretch').css('minHeight', newHeight);
		};
	       
	        // call function once to initialize
		$scope.onResize();
	    
	        // bind function to window resize event
		window.bind('resize', function() {
			$scope.onResize();
		});

		
		      
	}
]);