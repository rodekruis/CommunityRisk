'use strict';

angular.module('dashboards')
	.controller('DistrictDashboardsController', ['$scope', '$q', 'Authentication', 'Dashboards', 'Data', 'Sources', '$window', '$stateParams', 'cfpLoadingBar', '_',
	function($scope, $q, Authentication, Dashboards, Data, Sources, $window, $stateParams, cfpLoadingBar, _) {

		$scope.authentication = Authentication;
		$scope.geom = null;
		$scope.metric = 'risk_score';
		$scope.metric_label = '';
		$scope.metric_year = '';
		$scope.metric_source = '';
		$scope.metric_desc = '';
		$scope.admlevel = 2;
		$scope.admlevel_text = 'Provinces';
		$scope.name_selection = 'The Philippines';
		$scope.type_selection = 'Country';
		$scope.subtype_selection = 'Provinces'; 
		$scope.parent_code = '';
		var data_input = '';//$scope.admlevel + ',\'' + $scope.parent_code;
		var filters;
		var map;

		$scope.config =  {
							whereFieldName:'pcode',
							joinAttribute:'pcode',
							nameAttribute:'name',
							color:'#0080ff'
						};	
		
		//functions needed for loading bar while waiting for data
		$scope.start = function() {
		  cfpLoadingBar.start();
		};
		$scope.complete = function () {
		  cfpLoadingBar.complete();
		};
	
		/**
		 * Initiate the dashboard
		 */
		$scope.initiate = function() {	    
				
			// start loading bar
		    $scope.start();
			
			data_input = $scope.admlevel + ',\'' + $scope.parent_code;

			Dashboards.get({dashboardId: $stateParams.dashboardId},
			    function(dashboard) {		
					// get the data
					//console.log(data_input);
					Data.get({adminLevel: data_input}, //$scope.admlevel || ',' || $scope.parent_code)},
						function(pgData){
							$scope.prepare(dashboard, pgData);
						});					
				},
			    function(error) {
					console.log(error);
				//$scope.addAlert('danger', error.data.message);
			    });
			
		};  
		
		/**
		 * get the data from the files as defined in the config.
		 * load  them with ajax and if both are finished, generate the charts
		 */
		$scope.prepare = function(dashboard, pgData) {
		  // set the title
		  $scope.title = $scope.config.title;
				
		  // create the map chart (NOTE: this has to be done before the ajax call)
		  $scope.mapChartType = 'leafletChoroplethChart';	
		  
		  // load data
		  //console.log(pgData);
		  $scope.geom = pgData.usp_data.geo;
		  var d = {};
		  d.Districts = pgData.usp_data.geo;
		  d.Rapportage = pgData.usp_data.ind;
		  d.Metadata = dashboard.sources.Metadata.data;
			
		  $scope.generateCharts(d);
		  
		  // end loading bar
		  $scope.complete();	   

		};

		
		// fill the lookup table with the name attributes
		$scope.genLookup = function (field){
			var lookup = {};
			$scope.geom.features.forEach(function(e){
				lookup[e.properties[$scope.config.joinAttribute]] = String(e.properties[field]);
			});
			return lookup;
		};
		// fill the lookup table with the name attributes
		$scope.genLookup_ind = function (d,field){
			var lookup_ind = {};
			d.Rapportage.forEach(function(e){
				lookup_ind[e.pcode] = String(e[field]);
			});
			return lookup_ind;
		};
		// fill the lookup table with the name attributes
		$scope.genLookup_meta = function (d,field){
			var lookup_meta = {};
			d.Metadata.forEach(function(e){
				lookup_meta[e.variable] = String(e[field]);
			});
			return lookup_meta;
		};
		
		/**
		 * function to find object property value by path
		 * separate with .
		 */
		$scope.deepFind = function deepFind(obj, path) {
			  var paths = path.split('.'),
				  current = obj,
				  i;

			  for (i = 0; i < paths.length; ++i) {
				if (current[paths[i]] === undefined) {
				  return undefined;
				} else {
				  current = current[paths[i]];
				}
			  }
			  return current;
		};

		
		/**
		 * function to generate the 3W component
		 * data is loaded from the data set
		 * geom is geojson file
		 */
		$scope.generateCharts = function (d){
				
			// Clear the charts
			dc.chartRegistry.clear();
			if (map !== undefined) { map.remove(); }
	
			//define dc-charts (the name-tag following the # is how you refer to these charts in html with id-tag)
			var mapChart = dc.leafletChoroplethChart('#map-chart');
						
			// get the lookup tables
			var lookup = $scope.genLookup($scope.config.nameAttribute);
			var lookup_muncity = $scope.genLookup_ind(d,'mun_city');
			var meta_label = $scope.genLookup_meta(d,'label');
			var meta_format = $scope.genLookup_meta(d,'format');
			var meta_unit = $scope.genLookup_meta(d,'unit');
			var meta_icon = $scope.genLookup_meta(d,'icon_src');
			var meta_year = $scope.genLookup_meta(d,'year');
			var meta_source = $scope.genLookup_meta(d,'source_link');
			var meta_desc = $scope.genLookup_meta(d,'description');
			
			if ($scope.admlevel === 2) {
				$scope.type_selection = 'Country';
				$scope.subtype_selection = 'Provinces'; 
			} else if ($scope.admlevel === 3) {
				$scope.type_selection = 'Province';
				$scope.subtype_selection = 'Municipalities'; 
			} else if ($scope.admlevel === 4) {
				$scope.type_selection = 'Municipality';
				$scope.subtype_selection = 'Barangays'; 
			}
			
			
			//var cf = crossfilter(d3.range(0, data.Districts.features.length));
			var cf = crossfilter(d.Rapportage);
			var parentDim = cf.dimension(function(d) { return d.pcode_parent; });
					
			// The wheredimension returns the unique identifier of the geo area
			var whereDimension = cf.dimension(function(d) { return d.pcode; });
								
			// Create the groups for these two dimensions (i.e. sum the metric)
			var whereGroupSum = whereDimension.group().reduceSum(function(d) { return d[$scope.metric];});
				
			// Create customized reduce-functions to be able to calculated percentages over all or multiple districts (i.e. the % of male volunteers))
			var reduceAddAvg = function(metric) {
				return function(p,v) {
					p.sumOfSub += v[metric]*v.population;
					p.sumOfTotal += v.population;
					p.finalVal = p.sumOfSub / p.sumOfTotal;
					return p;
				};
			};
			var reduceRemoveAvg = function(metric) {
				return function(p,v) {
					p.sumOfSub -= v[metric]*v.population;
					p.sumOfTotal -= v.population;
					p.finalVal = p.sumOfSub / p.sumOfTotal;
					return p;
				};
			};
			var reduceInitialAvg = function() {
				return {sumOfSub:0, sumOfTotal:0, finalVal:0 };
			}; 
			
			
			//All data-tables are not split up in dimensions. The metric is always the sum of all selected records. Therefore we create one total-dimension
			var totaalDim = cf.dimension(function(i) { return 'Total'; });

			//For this total-dimension we create a group for each metric to calculate the sum
			//framework scores
			//var risk_score = totaalDim.group().reduceSum(function(d) {return d.risk_score;});
			var risk_score = totaalDim.group().reduce(reduceAddAvg('risk_score'),reduceRemoveAvg('risk_score'),reduceInitialAvg);
			var vulnerability_score = totaalDim.group().reduce(reduceAddAvg('vulnerability_score'),reduceRemoveAvg('vulnerability_score'),reduceInitialAvg);
			var hazard_score = totaalDim.group().reduce(reduceAddAvg('hazard_score'),reduceRemoveAvg('hazard_score'),reduceInitialAvg);
			var coping_capacity_score = totaalDim.group().reduce(reduceAddAvg('coping_capacity_score'),reduceRemoveAvg('coping_capacity_score'),reduceInitialAvg);
			//general information
			var population = totaalDim.group().reduceSum(function(d) {return d.population;});
			var land_area = totaalDim.group().reduceSum(function(d) {return d.land_area;});
			var mun_city = totaalDim.group().reduceSum(function(d) {return d.mun_city;});
			//vulnerability
			var poverty_incidence = totaalDim.group().reduce(reduceAddAvg('poverty_incidence'),reduceRemoveAvg('poverty_incidence'),reduceInitialAvg);
			var income_class = totaalDim.group().reduce(reduceAddAvg('income_class'),reduceRemoveAvg('income_class'),reduceInitialAvg);
			var gdp_per_capita = totaalDim.group().reduce(reduceAddAvg('gdp_per_capita'),reduceRemoveAvg('gdp_per_capita'),reduceInitialAvg);
			var hdi = totaalDim.group().reduce(reduceAddAvg('hdi'),reduceRemoveAvg('hdi'),reduceInitialAvg);
			//hazards
			var flood_risk = totaalDim.group().reduce(reduceAddAvg('flood_risk'),reduceRemoveAvg('flood_risk'),reduceInitialAvg);
			var cyclone_risk = totaalDim.group().reduce(reduceAddAvg('cyclone_risk'),reduceRemoveAvg('cyclone_risk'),reduceInitialAvg);
			var landslide_risk = totaalDim.group().reduce(reduceAddAvg('landslide_risk'),reduceRemoveAvg('landslide_risk'),reduceInitialAvg);
			var earthquake7_phys_exp = totaalDim.group().reduce(reduceAddAvg('earthquake7_phys_exp'),reduceRemoveAvg('earthquake7_phys_exp'),reduceInitialAvg);
			var tsunami_phys_exp = totaalDim.group().reduce(reduceAddAvg('tsunami_phys_exp'),reduceRemoveAvg('tsunami_phys_exp'),reduceInitialAvg);
			var cyclone_surge_2m_phys_exp = totaalDim.group().reduce(reduceAddAvg('cyclone_surge_2m_phys_exp'),reduceRemoveAvg('cyclone_surge_2m_phys_exp'),reduceInitialAvg);
			//coping capacity
			var nr_facilities = totaalDim.group().reduceSum(function(d) {return d.nr_facilities;});
			var nr_doctors = totaalDim.group().reduceSum(function(d) {return d.nr_doctors;});
			var good_governance_index = totaalDim.group().reduce(reduceAddAvg('good_governance_index'),reduceRemoveAvg('good_governance_index'),reduceInitialAvg);
			var traveltime = totaalDim.group().reduce(reduceAddAvg('traveltime'),reduceRemoveAvg('traveltime'),reduceInitialAvg);
			
			// Examples of custom reduce functions
			// var LeeftijdOnder18Group = totaalDim.group().reduce(reduceAddAvg('LeeftijdOnder18'),reduceRemoveAvg('LeeftijdOnder18'),reduceInitialAvg);
			
			// group with all, needed for data-count
			var all = cf.groupAll();

			// get the count of the number of rows in the dataset (total and filtered)
			dc.dataCount('#count-info')
					.dimension(cf)
					.group(all);
			
			//Define number formats for absolute numbers and for percentage metrics
			var intFormat = d3.format(',');
			var dec0Format = d3.format(',.0f');
			var dec2Format = d3.format('.2f');
			var percFormat = d3.format(',.1%');
			
			//Create the map-chart
			if ($scope.admlevel === 3) {
				parentDim.filter(function(d) { if (d === $scope.parent_code) {return d;}});
			}
			
			mapChart
				.width($('#map-chart').width())
				.height(800)
				.dimension(whereDimension)
				.group(whereGroupSum)
				.center([0,0])
				.zoom(0)    
				.geojson(d.Districts)
				.colors(d3.scale.quantile()
								.domain([d3.min(d.Rapportage,function(d) {return d[$scope.metric];}),d3.max(d.Rapportage,function(d) {return d[$scope.metric];})])
								.range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']))
				//.colorAccessor(function (d) {if(d>0){return d;} else {return 0;}})  
				.colorCalculator(function (d) { return (d > 0) ? mapChart.colors()(d) : '#cccccc'; })
				.featureKeyAccessor(function(feature){
					return feature.properties.pcode;
				})
				.popup(function(d){
					return lookup[d.key].concat(' - ',meta_label[$scope.metric],': ',d.value);
				})
				.renderPopup(true)
				.turnOnControls(true)
				.on('filtered',function(chart,filters){
					filters = chart.filters();
					if (filters.length>0 && $scope.admlevel < 4) {
						$scope.admlevel = $scope.admlevel + 1;
						$scope.parent_code_prev = $scope.parent_code;
						$scope.parent_code = filters[0];
						if ($scope.admlevel === 4) {$scope.metric = 'population';}
						$scope.name_selection = lookup[$scope.parent_code];
						$scope.initiate();
					}
				})
				;
				
			//Function that initiates ng-click event for changing the metric in the row-chart when clicking on a metric
			//It differentiates on type of metric (percentage or absolute count)
			$scope.go = function(id) {
				$scope.metric = id;	
				$scope.metric_label = meta_label[$scope.metric];
				$scope.metric_year = meta_year[$scope.metric];
				$scope.metric_source = meta_source[$scope.metric];
				$scope.metric_desc = meta_desc[$scope.metric];
				$('#myModal').modal('show');
				whereGroupSum.dispose();
				whereGroupSum = whereDimension.group().reduceSum(function(d) { return d[id];});	
				mapChart
					.group(whereGroupSum)
					.colors(d3.scale.quantile()
									.domain([d3.min(d.Rapportage,function(d) {return d[id];}),d3.max(d.Rapportage,function(d) {return d[id];})])
									.range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']))
					.colorAccessor(function (d) {if(d>0){return d;} else {return 0;}});
				dc.filterAll();
				dc.redrawAll();
			};
			
			$scope.level_up = function() {
				if ($scope.admlevel > 2) {
					$scope.admlevel = $scope.admlevel - 1;
					$scope.parent_code = $scope.parent_code_prev;
					$scope.initiate();
				}
			};
				
			//This is needed for changing the metric of the row-chart when using the carousel arrows
			//NOTE: this does not work yet at the moment
			$scope.go_left = function() {
				if ($('div.active').index() === 0) {$scope.go('nr_facilities');}
				else if ($('div.active').index() === 1) {$scope.go('risk_score');}
				else if ($('div.active').index() === 2) {$scope.go('population');}
				else if ($('div.active').index() === 3) {$scope.go('poverty_incidence');}
				else if ($('div.active').index() === 4) {$scope.go('flood_risk');}
			};
			$scope.go_right = function() {
				if ($('div.active').index() === 3) {$scope.go('nr_facilities');}
				else if ($('div.active').index() === 4) {$scope.go('risk_score');}
				else if ($('div.active').index() === 0) {$scope.go('population');}
				else if ($('div.active').index() === 1) {$scope.go('poverty_incidence');}
				else if ($('div.active').index() === 2) {$scope.go('flood_risk');}
			};
			
			var tables = [
							{id: '#data-table2', name: 'risk_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: risk_score},
							{id: '#data-table3', name: 'vulnerability_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: vulnerability_score},
							{id: '#data-table4', name: 'hazard_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: hazard_score},
							{id: '#data-table5', name: 'coping_capacity_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: coping_capacity_score},
							{id: '#data-table6', name: 'population', datatype: 'integer', group: 'general', propertyPath: 'value', dimension: population},
							{id: '#data-table7', name: 'land_area', datatype: 'integer', group: 'general', propertyPath: 'value', dimension: land_area},
							{id: '#data-table8', name: 'mun_city', datatype: 'number', group: 'general', propertyPath: 'value', dimension: mun_city},
							{id: '#data-table9', name: 'poverty_incidence', datatype: 'percentage', group: 'vulnerability', propertyPath: 'value.finalVal', dimension: poverty_incidence},
							{id: '#data-table10', name: 'income_class', datatype: 'decimal2', group: 'vulnerability', propertyPath: 'value.finalVal', dimension: income_class},
							{id: '#data-table11', name: 'gdp_per_capita', datatype: 'integer', group: 'vulnerability', propertyPath: 'value.finalVal', dimension: gdp_per_capita},
							{id: '#data-table12', name: 'hdi', datatype: 'decimal2', group: 'vulnerability', propertyPath: 'value.finalVal', dimension: hdi},
							{id: '#data-table13', name: 'flood_risk', datatype: 'decimal2', group: 'hazard', propertyPath: 'value.finalVal', dimension: flood_risk},
							{id: '#data-table14', name: 'cyclone_risk', datatype: 'decimal2', group: 'hazard', propertyPath: 'value.finalVal', dimension: cyclone_risk},
							{id: '#data-table15', name: 'landslide_risk', datatype: 'decimal2', group: 'hazard', propertyPath: 'value.finalVal', dimension: landslide_risk},
							{id: '#data-table16', name: 'earthquake7_phys_exp', datatype: 'decimal2', group: 'hazard', propertyPath: 'value.finalVal', dimension: earthquake7_phys_exp},
							{id: '#data-table17', name: 'tsunami_phys_exp', datatype: 'decimal2', group: 'hazard', propertyPath: 'value.finalVal', dimension: tsunami_phys_exp},
							{id: '#data-table18', name: 'cyclone_surge_2m_phys_exp', datatype: 'decimal2', group: 'hazard', propertyPath: 'value.finalVal', dimension: cyclone_surge_2m_phys_exp},
							{id: '#data-table19', name: 'nr_facilities', datatype: 'integer', group: 'capacity', propertyPath: 'value', dimension: nr_facilities},
							{id: '#data-table20', name: 'nr_doctors', datatype: 'integer', group: 'capacity', propertyPath: 'value', dimension: nr_doctors},
							{id: '#data-table21', name: 'good_governance_index', datatype: 'decimal2', group: 'capacity', propertyPath: 'value.finalVal', dimension: good_governance_index},
							{id: '#data-table22', name: 'traveltime', datatype: 'integer', group: 'capacity', propertyPath: 'value.finalVal', dimension: traveltime}								
						 ];
						 
			var tables2 = [];
			for (var i=2; i < d.Metadata.length; i++) {
				var record = {};
				record.name = d.Metadata[i.variable];
				tables2[i-2] = record;
			}
			console.log(tables2);
				
			// create the data tables: because metrics are in columns in the data set and not in rows, we need one data-table per metric
			tables.forEach(function(t) {
				dc.dataTable(t.id)
						.dimension(t.dimension)                
						.group(function (i) {return ''; })
						.columns([
									// icon
									function(d){return '<img src=\"modules/dashboards/img/'+meta_icon[t.name]+'\" width=\"20\">';},
									// info button
									//function(d){return '<button id=\"myBtn\">Open Modal</button>';}
									// name of variable
									function(d){return meta_label[t.name];}, 
									// the value
									function(d){
										if (t.name === 'mun_city') {
											return lookup_muncity[t.key];
										} else if (isNaN($scope.deepFind(d, t.propertyPath))) {
											return 'N.A. on this level';
										} else if(meta_format[t.name] === 'decimal0'){
											return dec0Format($scope.deepFind(d, t.propertyPath));
										} else if(meta_format[t.name] === 'percentage'){
											return percFormat($scope.deepFind(d, t.propertyPath));
										} else if(meta_format[t.name] === 'decimal2'){
											return dec2Format($scope.deepFind(d, t.propertyPath));
										}
									},
									function(d){
										return meta_unit[t.name];
									}
							])
						.title(function(d){return lookup[t.name];})	
						.order(d3.descending);
			});												
			
		
			//Render all dc-charts and -tables
			//parentDim.filter(function(d) { if ($scope.admlevel === 2) { return d;} else if ($scope.admlevel === 3 && d === parent_code) {return d;}});
			if ($scope.admlevel === 3) {
				parentDim.filter(function(d) { if (d === $scope.parent_code) {return d;}});
			}
			dc.renderAll(); 
			
			map = mapChart.map();
			function zoomToGeom(geom){
				var bounds = d3.geo.bounds(geom);
				map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
			}
			zoomToGeom($scope.geom);
			
				
			
			
		};
	
	}
])

;
