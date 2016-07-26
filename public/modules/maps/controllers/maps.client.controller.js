'use strict';

/*global google */

angular.module('maps').controller('MapsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Maps', '$window', 'leafletData', '$compile', '$parse', 'Proxy', '$modal', '_', //'L', 'cartodb',
	function($scope, $stateParams, $location, Authentication, Maps, $window, leafletData, $compile, $parse, Proxy, $modal, _) { //, 
		$scope.authentication = Authentication;
		$scope.L = $window.L;
		$scope.cartodb = $window.cartodb;
		$scope.LMap = null;
		$scope.subLayers = [];
		$scope.bounds = null;
		$scope.overlayLayers = {};
		$scope.activeLayers = [];
		$scope.baseLayers = {};
		$scope.wmsLegends = [];
		$scope.wfsLegends = [];
		$scope.visualisationLegends = [];
		$scope.infos = {};
		$scope.mapCenter = {};
		$scope.baseUrl = $location.absUrl().substring(0,$location.absUrl().length - $location.path().length);
		$scope.mapParameters = $location.path().split('/').slice(0,3).join('/');
		$scope.columns = 4;
		
		// Set empty tileLayer for angular-leaflet directive to prevent base map loading
		$scope.defaults.tileLayer = '';
				   
		$scope.create = function() {
			var map = new Maps({
				title: this.title,
				//content: this.content
			});
			map.$save(function(response) {
				$location.path('maps/' + response._id);
			}, function(errorResponse) {
				$scope.addAlert('danger', errorResponse.data.message);
			});

			this.title = '';
			//this.content = '';
		};

		$scope.remove = function(map) {
			if (map) {
				map.$remove();

				for (var i in $scope.maps) {
					if ($scope.maps[i] === map) {
						$scope.maps.splice(i, 1);
					}
				}
			} else {
				$scope.map.$remove(function() {
					$location.path('maps');
				});
			}
		};

		$scope.update = function() {
			var map = $scope.map;

			map.$update(function() {
				$location.path('maps/' + map._id);
			}, function(errorResponse) {
				$scope.addAlert('danger', errorResponse.data.message);
			});
		};

		// get categories from maps list
		$scope.categories = [];
		var findCategories = function(){
			angular.forEach($scope.maps, function(value, category){
			    if(value.category !== null && $scope.categories.indexOf(value.category.name) === -1)
			    {
				$scope.categories.push(value.category.name);
			    }
			});
		};
		
		$scope.find = function() {
			Maps.query(function(data) {
				$scope.maps = data;
				
				// Also get categories
				findCategories();
				
				// Split maps array in subarrays of 4, for creating the rows in the list view
				$scope.prepareMapsList();
				
			    }, function(error) {
				$scope.addAlert('danger', error.data.message);
			    });
		};
		
		// watch change of category
		$scope.$watch('showCategory', function() {
			// prepare maps list
			$scope.prepareMapsList();
		});

		$scope.findOne = function() {
			Maps.get({mapId: $stateParams.mapId},
			    function(data) {
				$scope.map = data;
			    },
			    function(error) {
				$scope.addAlert('danger', error.data.message);
			    });
		};
		
		// Active layers function
		$scope.addActiveLayer = function(id){
			if ($scope.activeLayers.indexOf(id) === -1) {
				$scope.activeLayers.push(id);
			}
		};
		
		$scope.deleteActiveLayer = function(id){
			var index = $scope.activeLayers.indexOf(id);
			
			if (index > -1) {
				$scope.activeLayers.splice(index, 1);
			}
		};
		
		// prepare maps list
		$scope.prepareMapsList = function() {
			// check if maps list is already initialized
			if (typeof $scope.maps === 'undefined') {
				return;
			}
			
			var newArr = $scope.maps;
			
			// filter the list by category selected
			var filteredArr = newArr;
			
			// If category is set, and not set to 'all' by the user, then filter on category
			if (typeof $scope.showCategory !== 'undefined' && $scope.showCategory !== ' ') {
				filteredArr = _.filter(newArr, function(map) {
					if (typeof map.category === 'undefined' || map.category === null) {
						return false;
					}
					else {
						return map.category.name === $scope.showCategory;
					}
				});
			}
			
			// Sort maps list by title
			var sorted = _.sortBy(filteredArr, function(map) {
				return map.title.toLowerCase();
			});
			
			// make two dimensional array based on number of columns in view
			$scope.splitMaps = [];
			for (var i=0; i< sorted.length; i+=$scope.columns) {
			  $scope.splitMaps.push(sorted.slice(i, i+$scope.columns));
			}
	        };
		      
			
		/**
		 * Alert box above map for errors
		 */
		$scope.alerts = [];
		    
		$scope.addAlert = function(messageType, message) {
			$scope.alerts.push({type: messageType, msg: message});
		};
		    
		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};
		
		/**
		 *  Function to add geocoding search control to map
		 */
		$scope.loadSearchControl = function(cartomap) {
			var geocoder = new google.maps.Geocoder();

			function googleGeocoding(text, callResponse)
			{
				geocoder.geocode({address: text}, callResponse);
			}
		
			function filterJSONCall(rawjson)
			{
				var json = {},
					key, loc, disp = [];
		
				for(var i in rawjson)
				{
					key = rawjson[i].formatted_address;
					loc = $scope.L.latLng( rawjson[i].geometry.location.lat(), rawjson[i].geometry.location.lng() );
					json[ key ]= loc;	//key,value format
				}
				return json;
			}
		
			cartomap.addControl( new $scope.L.Control.Search({
					container: 'findbox',
					text: 'Zoeken...',			//placeholder value	
					textCancel: 'Cancel',			//title in cancel button
					textErr: 'Locatie niet gevonden',	//error message
					sourceData: googleGeocoding,
					formatData: filterJSONCall,
					markerLocation: true,
					autoType: false,
					autoCollapse: true,
					minLength: 2
			}) );
		};
		
		/**
		 * Add cartodb visualisation through url pointing to viz.json
		 */
		var addVisualisation = function(cartomap, visualisation){
			
			$scope.cartodb.createLayer(cartomap, visualisation.apiUrl, {https:true, legends:false})
			.addTo(cartomap)
			.on('done', function(layer) {
				
				//var layers = layer.layers;
				var overlayMaps = { };
				
				layer.setInteraction(true);
				
				// set Zindex
				layer.setZIndex(visualisation.zindex);
				 
				// Set layer name
				layer.layer_name = visualisation.name;
				layer.parentId = visualisation._id;
				
				// Set visibility
				layer.options.visible = visualisation.visible;
				
				// If layer should not be visible, remove it from the map
				if (!visualisation.visible) {
					$scope.LMap.removeLayer(layer);
				}
				else {
					$scope.addActiveLayer(visualisation._id);
				}
				
				// add whole viz.json layer to layer control
				$scope.overlayLayers[visualisation.name] = layer;
							
				// Check there is a legend in the visualisation
				if (layer.layers[0].hasOwnProperty('legend') && layer.layers[0].legend.type !== 'none') {
					var legend = {};
					var cartoLegend = layer.layers[0].legend;
					cartoLegend.data = cartoLegend.items;
				
					// parse legend
					var rendered = new cdb.geo.ui.Legend(cartoLegend).render().el;				
					
					// get html
					legend.html = rendered.outerHTML;
					
					// set name
					legend.name = visualisation.name;
					
					// add to list
					$scope.visualisationLegends.push(legend);
				}
				
				
				 layer.on('featureOver', function(e, pos, latlng, data) {
				   $scope.cartodb.log.log(e, pos, latlng, data);
				 });
	  
				 layer.on('error', function(err) {
				   $scope.cartodb.log.log('error: ' + err);
				 });
			}).on('error', function() {
				 $scope.cartodb.log.log('some error occurred');
			});
		};
		
		/**
		 * Add WMS layers
		 */
		var addWmsLayer = function(cartomap, wmsLayer){
			
			var wms = null;
			
			if (wmsLayer.tiled) {
				if (wmsLayer.featureInfo) {
					wms = $scope.L.tileLayer.betterWms(wmsLayer.url, {
					layers: wmsLayer.layers,
					format: wmsLayer.format,
					transparent: wmsLayer.transparent,
					version: wmsLayer.version
					});
				} else {
				wms = $scope.L.tileLayer.wms(wmsLayer.url, {
					layers: wmsLayer.layers,
					format: wmsLayer.format,
					transparent: wmsLayer.transparent,
					version: wmsLayer.version
					});
				}
			}
			else {
				wms = new $scope.L.NonTiledLayer.WMS(wmsLayer.url, {
						layers: wmsLayer.layers,
						format: wmsLayer.format,
						transparent: wmsLayer.transparent,
						version: wmsLayer.version,
						pane: cartomap.getPanes().tilePane,
						zIndex: wmsLayer.zindex,
						opacity: wmsLayer.opacity
						}, wmsLayer.featureInfo);
			}
			
			if (wms !== null) {
				// Add layer to map
				wms.addTo(cartomap);
				
				// Add layer to layer control
				var overlayMaps = { };
				
				// set Zindex
				wms.setZIndex(wmsLayer.zindex);
				 
				// Set layer name
				wms.layer_name = wmsLayer.name;
				
				// Set parentid of wms object
				wms.parentId = wmsLayer._id;
				
				// Set visibility
				wms.options.visible = wmsLayer.visible;
				
				if (!wmsLayer.visible) {
					$scope.LMap.removeLayer(wms);
				}
				else {
					$scope.addActiveLayer(wmsLayer._id);
				}
						
				// add whole viz.json layer to layer control
				$scope.overlayLayers[wmsLayer.name] = wms;
				
				// Get layer legends
				var legendOptions = wmsLayer.legendOptions;
				if (wmsLayer.legendOptions !== '') {
					legendOptions = JSON.parse(wmsLayer.legendOptions);
				}
				var legends = wms.getLegendGraphic(legendOptions);
				var legend = {};
				for (var l in legends) {
					legend.url = legends[l];
					legend.name = wmsLayer.name;
					$scope.wmsLegends.push(legend);
				}
			}
			
		};
		
		/**
		 * Add WFS Layer
		 */
		var addWfsLayer = function(cartomap, wfsLayer){		
			
			function style(feature) {
				return {
					weight: wfsLayer.featureStyle.weight,
					opacity: wfsLayer.featureStyle.opacity,
					color: wfsLayer.featureStyle.color,
					dashArray: wfsLayer.featureStyle.dashArray,
					fillOpacity: wfsLayer.featureStyle.fillOpacity,
					fillColor: wfsLayer.featureStyle.fillColor
				};
			}
			
			var geojsonMarkerOptions = {
				radius: wfsLayer.markerStyle.radius,
				fillColor: wfsLayer.markerStyle.fillColor,
				color: wfsLayer.markerStyle.color,
				weight: wfsLayer.markerStyle.weight,
				opacity: wfsLayer.markerStyle.opacity,
				fillOpacity: wfsLayer.markerStyle.fillOpacity
			};
			
			function featureUrl(wfsLayer) {
				// transform CRS to WFS accepted format by adding a : after EPSG
				var crsString = '';
				var crs = '';
				// check if CRS was selected
				if (wfsLayer.crs.length > 0) {
					// only first in array can be selected
					crs = wfsLayer.crs[0];
					// check if the layer name contains EPSG and if there is already a :
					if (crs.indexOf('EPSG') > -1 && crs.indexOf('EPSG:' === -1)) {
						crs = [crs.slice(0, 4), ':', crs.slice(4)].join('');
					}
					// Build url parameter to query for coordinate system
					crsString = '&srsName=' + crs;
				}
				
				var bboxString = '';
				if ($scope.bounds !== null) {
					var bboxCrs = '';
					if (crs !== '') {
						bboxCrs = ',' + crs;
					}
					bboxString = '&BBOX=' + $scope.bounds.toBBoxString() + bboxCrs;
				}
				
				

				return encodeURIComponent(wfsLayer.url + '?request=GetFeature&outputformat=json&version=' + wfsLayer.version + '&typeName=' + wfsLayer.featureType + crsString + bboxString);
			}
			
			function onEachFeature(feature, layer) {
				// does this feature have a property named popupContent?
				if (feature.properties && feature.properties[wfsLayer.hoverProperty]) {
					layer.bindPopup(feature.properties[wfsLayer.hoverProperty]);
				}
			}
			
			function pointToLayer(feature, latlng) {
				return $scope.L.circleMarker(latlng, geojsonMarkerOptions);
			}
			
			/**
			 * Get wfsLayer from URL through proxy and show loading icon
			 */
			$scope.loading = Proxy.get({
					url: featureUrl(wfsLayer)
				}).$promise.then(function(response) {
					if (response.type && response.type === 'FeatureCollection') {
						$scope.L.geoJson(response, {
							pointToLayer: pointToLayer,
							style: style,
							onEachFeature: onEachFeature,
						}).addTo(cartomap)
						.on('done', function(layer){
							// Add layer to layer control
							var overlayMaps = { };
							
							// set Zindex
							layer.setZIndex(wfsLayer.zindex);
							 
							// Set layer name
							layer.layer_name = wfsLayer.name;
							
							// Set parentid of wms object
							layer.parentId = wfsLayer._id;
				
							
							// Set visibility
							layer.options.visible = wfsLayer.visible;
							
							if (!wfsLayer.visible) {
								$scope.LMap.removeLayer(layer);
							}
							else {
								$scope.addActiveLayer(wfsLayer._id);
							}
										
							// add whole viz.json layer to layer control
							$scope.overlayLayers[wfsLayer.name] = layer;
						});
					}
				});
		};
		
		/**
		 * Load layers when map initializes
		 */
		$scope.loadLayers = function() {
						
			// Get leaflet map object
			leafletData.getMap().then(function(cartomap) {
				
				// Set map in scope
				$scope.LMap = cartomap;
				
				// set bounds variable whenever the map position or zoom is changed
				cartomap.on('moveend', function() {
					$scope.bounds = cartomap.getBounds();
					
					var center = cartomap.getCenter();
					var zoom = cartomap.getZoom();
					
					$scope.mapCenter.lat = center.lat;
					$scope.mapCenter.lng = center.lng;
					$scope.mapCenter.zoom = zoom;					
				});
				
				// Add the GPS location control
				var gpsStyle = {radius: 3, weight:8, color: '#4C87C7', fill: true, opacity:1.0};
				cartomap.addControl( new $scope.L.Control.Gps({style: gpsStyle }) );
						
				// Get map object
				Maps.get({
					mapId: $stateParams.mapId
				}).$promise.then(function(map) {
					var baseMap = map.baseMap;	
					
					if (map.baseMap !== undefined && map.baseMap !== null) {							
						// add base layer
						var layer = $scope.L.tileLayer(baseMap.url, {attribution: '&copy; <a href="http://www.rodekruis.nl" target="_new">Rode Kruis</a>'});
						cartomap.addLayer(layer);
					
						// add whole viz.json layer to layer control
						layer.layer_name = baseMap.name;
						
						// Set zindex
						layer.setZIndex(1);
						$scope.baseLayers[baseMap.name] = layer;
					}
									
					// Set map center
					// if center is set by url variable
					if ($stateParams.centerLat && $stateParams.centerLng && $stateParams.centerZoom) {
						cartomap.setView(new $scope.L.latLng($stateParams.centerLat, $stateParams.centerLng), $stateParams.centerZoom);
					}
					// if center is not set
					else {
						$scope.mapCenter = map.mapCenter;
						cartomap.setView(new $scope.L.latLng($scope.mapCenter.lat, $scope.mapCenter.lng), $scope.mapCenter.zoom);
					}
					
					/*
					 * Couldn't get the map bounds to work.
					 * Idea is to fit the map to preset bounds, so that on each resolution the map displays properly
					 * Possibly something to do with asynchronous loading of map
					/*
					var mapBounds = map.mapBounds;
					var 	southWest = $scope.L.latLng(mapBounds.latSW, mapBounds.lngSW),
						northEast = $scope.L.latLng(mapBounds.latNE, mapBounds.lngNE),
						bounds = $scope.L.latLngBounds(southWest, northEast);
						
					var mapCenter = bounds.getCenter();
					var zoom = cartomap.getBoundsZoom(bounds);
					
					cartomap.fitBounds(bounds, {reset: true});
					*/
					
					// Add map description to infos scope
					$scope.infos.title = map.title;
					$scope.infos.info = map.description;
					$scope.infos.layers = [];
					
					// See if visible layers should be overriden by url variables
					// At least one layerid should be in the url, otherwise default layer settings will apply
					var urlLayersSet = false;
					var activeLayers = [];
					if ($stateParams.activeLayers) {
						activeLayers = $stateParams.activeLayers.split(',');
						urlLayersSet = true;	
					}
					
					for (var vId in map.visualisation) {
						var visualisation = map.visualisation[vId];
						
						// if url layers are set
						if (urlLayersSet) {
				
							// Check if layer visibility should be overriden
							if (activeLayers.indexOf(visualisation._id) > -1) {
								visualisation.visible = true;
							} else {
								visualisation.visible = false;
							}
						}
						
						addVisualisation(cartomap, visualisation);
						
						// add layer description to infos scope
						$scope.infos.layers.push({title: visualisation.name, info: visualisation.description});
						
					}
					
					for (var wmsId in map.wmsLayer) {
						var wmsLayer = map.wmsLayer[wmsId];
						
						// if url layers are set
						if (urlLayersSet) {
							// Check if layer visibility should be overriden
							if (activeLayers.indexOf(map.wmsLayer[wmsId]._id) > -1) {
								wmsLayer.visible = true;
							} else {
								wmsLayer.visible = false;
							}
						}
						
						addWmsLayer(cartomap, wmsLayer);
						
						// add layer description to infos scope
						$scope.infos.layers.push({title: wmsLayer.name, info: wmsLayer.description});
					}
					
					for (var wfsId in map.wfsLayer) {
						var wfsLayer = map.wfsLayer[wfsId];
						
						// if url layers are set
						if (urlLayersSet) {
							// Check if layer visibility should be overriden
							if (activeLayers.indexOf(map.wfsLayer[wfsId]._id) > -1) {
								wfsLayer.visible = true;
							} else {
								wfsLayer.visible = false;
							}
						}
						addWfsLayer(cartomap, wfsLayer);
						
						// add layer description to infos scope
						$scope.infos.layers.push({title: wfsLayer.name, info: wfsLayer.description});
					}
				});
				
				// Check if map has moved and reload tiles
				cartomap.invalidateSize();
				
				// Load search geocoder
				$scope.loadSearchControl(cartomap);
			});

			
			/**
			 * Toggle layers from map upon user action. Remove or add label and change setting of button
			 */
			$scope.toggleLayer = function(layer, e){
				e.preventDefault();
				e.stopPropagation();
						
				// If layer exists on map, remove layer
				if ($scope.LMap.hasLayer(layer)) {
				    $scope.LMap.removeLayer(layer);
				    layer.options.visible = false;
				    
				    $scope.deleteActiveLayer(layer.parentId);
				    
				// If layer does not exist on map, add layer
				} else {
				    $scope.LMap.addLayer(layer);
				    layer.options.visible = true;
				    
				    $scope.addActiveLayer(layer.parentId);
				}
			};
		};
		
	}
]);