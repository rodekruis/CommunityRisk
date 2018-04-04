'use strict';

angular.module('core').controller('HomeController', ['$scope','$css','$rootScope','Authentication', 'leafletData',
	function ($scope,$css,$rootScope, Authentication, leafletData) {
    
	$css.remove('modules/dashboards/css/storyboard.css');
	$css.remove('modules/dashboards/css/dashboards.css');
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
	
	var map;
	
	dc.chartRegistry.clear();
	if (map !== undefined) { map.remove(); }
	
	var map_chart = dc.leafletChoroplethChart("#map-chart");
	d3.dsv(';')('modules/core/data/country_metadata.csv', function(country_meta) {
		
		d3.json('modules/core/data/worldmap.json', function (worldmap) {
			
			
			
			var cf = crossfilter(country_meta);
			cf.country_code = cf.dimension(function(d) {return d.country_code;});
			var country_code = cf.country_code.group();
			// group with all, needed for data-count
			var all = cf.groupAll();
			dc.dataCount('#count-info').dimension(cf).group(all);


			var countries = topojson.feature(worldmap,worldmap.objects.countries);
			
			// fill the lookup table which finds the community name with the community code
			var lookup = {};
			countries.features.forEach(function(e){
				lookup[e.properties.id] = String(e.properties.name);
			});

	
			map_chart.width(660).height(800)
				.dimension(cf.country_code)
				.group(country_code)
				.geojson(countries)	
				.colorCalculator(function(d) {if (typeof d == 'undefined') {return '#ccc';} else if (d==1) {return '#4C8293';};})
				.valueAccessor(function(d) {console.log(d); return d.value;})
				.featureKeyAccessor(function(feature){
					return feature.properties.id;
				})
				.popup(function(d) {return lookup[d.key];})
				.on('filtered',function(chart,filters) {
					$scope.choose_country(chart.filters()[0]);
					window.location.replace('#!/community_risk');
				})
			;
			dc.renderAll();	
			map = map_chart.map();
			map.fitBounds([[-30,-90],[50,120]]);
		});
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