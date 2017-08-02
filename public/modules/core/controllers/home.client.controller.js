'use strict';

angular.module('core').controller('HomeController', ['$scope','$css','$rootScope','Authentication', 'leafletData',
	function ($scope,$css,$rootScope, Authentication, leafletData) {
    
	$css.remove('modules/dashboards/css/priority_index_storyboard.css');
	$css.add('modules/dashboards/css/header.css');
	
	$scope.authentication = Authentication;
	
	$rootScope.country_code = '';
	$rootScope.disaster_type = '';
	$rootScope.view_code = '';
	
	$scope.choose_country = function(country) {
		$rootScope.country_code = country;
	}
	$scope.setup_PI = function(country,disaster_type) {
		$rootScope.country_code = country;
		$rootScope.disaster_type = disaster_type;
	}
	$scope.choose_view = function(view) {
		$rootScope.view_code = view;
	}
      
    angular.extend($scope, {
                    defaults: {
                        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        maxZoom: 14,
                        zoomControl: false,
                        path: {
                            weight: 10,
                            color: '#800000',
                            opacity: 1
                        }
                    }
            });
            
    angular.extend($scope, {
            layers: {
                    baselayers: {
                        osm: {
                            name: 'OpenStreetMap',
                            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            type: 'xyz',
							layerOptions: {
							  'showOnSelector': false
							}
                        }
                    }
            }
    });

    //52.1185523,5.2097174
    angular.extend($scope, {
        center: {
            lat: 52.1185523,
            lng: 5.2097174,
            zoom: 10
        }
    });
    
    // Get leaflet map object
    leafletData.getMap().then(function(cartomap) {	
            cartomap.invalidateSize();
    });
	

	$(document).ready(function() {
		
		$('.timer').countTo();
		
		if ($('#slider').length !== 0) {
			$('#slider').slick({
				dots: true,
				infinite: false,
				speed: 300,
				slidesToShow: 1,
				adaptiveHeight: true,
				fade: true,
				centerMode: true,
			});
		};
		
		if ($('#slider_PI').length !== 0) {
			$('#slider_PI').slick({
				dots: true,
				infinite: false,
				speed: 300,
				slidesToShow: 1,
				adaptiveHeight: true,
				fade: true,
				centerMode: true,
			});
		};
	});
                        
}]);