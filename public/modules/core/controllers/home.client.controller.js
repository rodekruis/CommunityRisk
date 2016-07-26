'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'leafletData',
	function ($scope, Authentication, leafletData) {
    $scope.authentication = Authentication;
      
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
                        
}]);