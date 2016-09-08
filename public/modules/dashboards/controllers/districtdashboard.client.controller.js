'use strict';

angular.module('dashboards')
	.controller('DistrictDashboardsController', ['$scope', '$q', 'Authentication', 'Dashboards', 'Data', 'Sources', '$window', '$stateParams', 'cfpLoadingBar', '_',
	function($scope, $q, Authentication, Dashboards, Data, Sources, $window, $stateParams, cfpLoadingBar, _) {

		//Define variables
		$scope.authentication = Authentication;
		$scope.geom = null;
		$scope.metric = 'risk_score';
		$scope.metric_label = 'Risk score';
		$scope.metric_year = '';
		$scope.metric_source = '';
		$scope.metric_desc = '';
		$scope.admlevel = 2;
		$scope.admlevel_text = 'Provinces';
		$scope.name_selection = 'The Philippines';
		$scope.country_selection = 'The Philippines';
		$scope.prov_selection = undefined;
		$scope.mun_selection = undefined;
		$scope.prov_code = '';
		$scope.mun_code = '';
		$scope.type_selection = 'Country';
		$scope.subtype_selection = 'Provinces'; 
		$scope.parent_code = '';
		$scope.data_input = '';//$scope.admlevel + ',\'' + $scope.parent_code;
		$scope.filters = [];
		var d_prev = '';
		var map;
		$scope.config =  {
							whereFieldName:'pcode',
							joinAttribute:'pcode',
							nameAttribute:'name',
							color:'#0080ff'
						};	
		
		//Define functions needed for loading bar while waiting for data
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
			
			$scope.data_input = $scope.admlevel + ',\'' + $scope.parent_code;

			Dashboards.get({dashboardId: $stateParams.dashboardId},
			    function(dashboard) {		
					// get the data
					//console.log(data_input);
					Data.get({adminLevel: $scope.data_input}, //$scope.admlevel || ',' || $scope.parent_code)},
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
		 * Reload the dashboard with new data (upon filtering the map). This will only get new data, but will not get the dashboard info again.
		 */
		$scope.reload = function(d) {	    
				
			// start loading bar
		    $scope.start();
			
			$scope.data_input = $scope.admlevel + ',\'' + $scope.parent_code;

			Data.get({adminLevel: $scope.data_input}, //$scope.admlevel || ',' || $scope.parent_code)},
				function(pgData){
					$scope.prepare_reload(d,pgData);
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
		  var d = {};
		  d.Districts = pgData.usp_data.geo;
		  d.Rapportage = pgData.usp_data.ind;
		  d.Metadata = dashboard.sources.Metadata.data;
		  $scope.geom = pgData.usp_data.geo;
		  
		  // generate the actual content of the dashboard
		  $scope.generateCharts(d);
		  
		  // end loading bar
		  $scope.complete();	   

		};
		//Slightly adjusted version of prepare function upon reload. Needed because the d.Metadata could not be loaded again when the dashboard itself was not re-initiated.
		//Therefore the d-object needed to be saved, instead of completely re-created.
		$scope.prepare_reload = function(d,pgData) {
		  // set the title
		  $scope.title = $scope.config.title;
				
		  // create the map chart (NOTE: this has to be done before the ajax call)
		  $scope.mapChartType = 'leafletChoroplethChart';	
		  
		  // load data
		  //var d = {};
		  d.Districts = pgData.usp_data.geo;
		  d.Rapportage = pgData.usp_data.ind;
		  //d.Metadata = dashboard.sources.Metadata.data;
		  $scope.geom = pgData.usp_data.geo;
		  
		  $scope.generateCharts(d);
		  
		  // end loading bar
		  $scope.complete();	   

		};

		
		// fill the lookup table which finds the community name with the community code
		$scope.genLookup = function (field){
			var lookup = {};
			$scope.geom.features.forEach(function(e){
				lookup[e.properties[$scope.config.joinAttribute]] = String(e.properties[field]);
			});
			return lookup;
		};
		// fill the lookup table with the metadata-information per variable
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
			var meta_label = $scope.genLookup_meta(d,'label');
			var meta_format = $scope.genLookup_meta(d,'format');
			var meta_unit = $scope.genLookup_meta(d,'unit');
			var meta_icon = $scope.genLookup_meta(d,'icon_src');
			var meta_year = $scope.genLookup_meta(d,'year');
			var meta_source = $scope.genLookup_meta(d,'source_link');
			var meta_desc = $scope.genLookup_meta(d,'description');
			
			$scope.metric_label = meta_label[$scope.metric];
			
			if ($scope.admlevel === 2) {
				$scope.type_selection = 'Country';
				$scope.subtype_selection = 'Provinces'; 
				$scope.prov_selection = undefined;
				$scope.mun_selection = undefined;
				$scope.prov_code = '';
				$scope.mun_code = '';
			} else if ($scope.admlevel === 3) {
				$scope.type_selection = 'Province';
				$scope.subtype_selection = 'Municipalities'; 
				$scope.prov_selection = $scope.name_selection;
				$scope.prov_code = $scope.parent_code;
				$scope.mun_selection = undefined;
				$scope.mun_code = '';
			} else if ($scope.admlevel === 4) {
				$scope.type_selection = 'Municipality';
				$scope.subtype_selection = 'Barangays'; 
				$scope.mun_selection = $scope.name_selection;
				$scope.mun_code = $scope.parent_code;
			}
			
			//var cf = crossfilter(d3.range(0, data.Districts.features.length));
			var cf = crossfilter(d.Rapportage);
			// The wheredimension returns the unique identifier of the geo area
			var whereDimension = cf.dimension(function(d) { return d.pcode; });
			// Create the groups for these two dimensions (i.e. sum the metric)
			var whereGroupSum = whereDimension.group().reduceSum(function(d) { return d[$scope.metric];});
				
			// Create customized reduce-functions to be able to calculated percentages over all or multiple districts (i.e. the % of male volunteers))
			var reduceAddAvg = function(metricA,metricB) {
				return function(p,v) {
					p.sumOfSub += v[metricA]*v[metricB];
					p.sumOfTotal += v[metricB];
					p.finalVal = p.sumOfSub / p.sumOfTotal;
					return p;
				};
			};
			var reduceRemoveAvg = function(metricA,metricB) {
				return function(p,v) {
					p.sumOfSub -= v[metricA]*v[metricB];
					p.sumOfTotal -= v[metricB];
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
			var risk_score = totaalDim.group().reduce(reduceAddAvg('risk_score','population'),reduceRemoveAvg('risk_score','population'),reduceInitialAvg);
			var vulnerability_score = totaalDim.group().reduce(reduceAddAvg('vulnerability_score','population'),reduceRemoveAvg('vulnerability_score','population'),reduceInitialAvg);
			var hazard_score = totaalDim.group().reduce(reduceAddAvg('hazard_score','population'),reduceRemoveAvg('hazard_score','population'),reduceInitialAvg);
			var coping_capacity_score = totaalDim.group().reduce(reduceAddAvg('coping_capacity_score','population'),reduceRemoveAvg('coping_capacity_score','population'),reduceInitialAvg);
			//general information
			var population = totaalDim.group().reduceSum(function(d) {return d.population;});
			var land_area = totaalDim.group().reduceSum(function(d) {return d.land_area;});
			var pop_density = totaalDim.group().reduce(reduceAddAvg('pop_density','land_area'),reduceRemoveAvg('pop_density','land_area'),reduceInitialAvg);
			var mun_city = totaalDim.group().reduceSum(function(d) {return d.mun_city;});
			//vulnerability
			var poverty_incidence = totaalDim.group().reduce(reduceAddAvg('poverty_incidence','population'),reduceRemoveAvg('poverty_incidence','population'),reduceInitialAvg);
			var income_class = totaalDim.group().reduce(reduceAddAvg('income_class','population'),reduceRemoveAvg('income_class','population'),reduceInitialAvg);
			var gdp_per_capita = totaalDim.group().reduce(reduceAddAvg('gdp_per_capita','population'),reduceRemoveAvg('gdp_per_capita','population'),reduceInitialAvg);
			var hdi = totaalDim.group().reduce(reduceAddAvg('hdi','population'),reduceRemoveAvg('hdi','population'),reduceInitialAvg);
			//hazards
			var flood_risk = totaalDim.group().reduce(reduceAddAvg('flood_risk','population'),reduceRemoveAvg('flood_risk','population'),reduceInitialAvg);
			var cyclone_risk = totaalDim.group().reduce(reduceAddAvg('cyclone_risk','population'),reduceRemoveAvg('cyclone_risk','population'),reduceInitialAvg);
			var landslide_risk = totaalDim.group().reduce(reduceAddAvg('landslide_risk','population'),reduceRemoveAvg('landslide_risk','population'),reduceInitialAvg);
			var earthquake7_phys_exp = totaalDim.group().reduce(reduceAddAvg('earthquake7_phys_exp','population'),reduceRemoveAvg('earthquake7_phys_exp','population'),reduceInitialAvg);
			var tsunami_phys_exp = totaalDim.group().reduce(reduceAddAvg('tsunami_phys_exp','population'),reduceRemoveAvg('tsunami_phys_exp','population'),reduceInitialAvg);
			var cyclone_surge_2m_phys_exp = totaalDim.group().reduce(reduceAddAvg('cyclone_surge_2m_phys_exp','population'),reduceRemoveAvg('cyclone_surge_2m_phys_exp','population'),reduceInitialAvg);
			//coping capacity
			var nr_facilities = totaalDim.group().reduceSum(function(d) {return d.nr_facilities;});
			var nr_doctors = totaalDim.group().reduceSum(function(d) {return d.nr_doctors;});
			var good_governance_index = totaalDim.group().reduce(reduceAddAvg('good_governance_index','population'),reduceRemoveAvg('good_governance_index','population'),reduceInitialAvg);
			var traveltime = totaalDim.group().reduce(reduceAddAvg('traveltime','population'),reduceRemoveAvg('traveltime','population'),reduceInitialAvg);
			
			// group with all, needed for data-count
			var all = cf.groupAll();

			// get the count of the number of rows in the dataset (total and filtered)
			dc.dataCount('#count-info')
					.dimension(cf)
					.group(all);
			
			//Define number formats for absolute numbers and for percentage metrics
			var intFormat = d3.format(',');
			var dec0Format = d3.format(',.0f');
			var dec1Format = d3.format(',.1f');
			var dec2Format = d3.format('.2f');
			var percFormat = d3.format(',.2%');
			
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
				.colorCalculator(function (d) { return d ? mapChart.colors()(d) : '#cccccc'; })
				.featureKeyAccessor(function(feature){
					return feature.properties.pcode;
				})
				.popup(function(d){
					return lookup[d.key].concat(' - ',meta_label[$scope.metric],': ',dec1Format(d.value));
				})
				.renderPopup(true)
				.turnOnControls(true)
				.on('filtered',function(chart,filters){
					$scope.filters = chart.filters();
					if ($scope.filters.length>0 && $scope.admlevel < 4) {
						$scope.admlevel = $scope.admlevel + 1;
						$scope.parent_code_prev = $scope.parent_code;
						$scope.parent_code = $scope.filters[0];
						$scope.name_selection = lookup[$scope.parent_code];
						if ($scope.admlevel === 4) {
							$scope.metric = 'population';
							for (var i=0;i<d.Rapportage.length;i++) {
								var record = d.Rapportage[i];
								if (record.pcode === $scope.filters[0]) {d_prev = record; break;}
							}
						}
						$scope.filters = [];
						$scope.reload(d);
					}
				})
				;
				
			var tables = [
							{id: '#data-table2', name: 'risk_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: risk_score},
							{id: '#data-table3', name: 'vulnerability_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: vulnerability_score},
							{id: '#data-table4', name: 'hazard_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: hazard_score},
							{id: '#data-table5', name: 'coping_capacity_score', datatype: 'decimal2', group: 'score', propertyPath: 'value.finalVal', dimension: coping_capacity_score},
							{id: '#data-table6', name: 'population', datatype: 'integer', group: 'general', propertyPath: 'value', dimension: population},
							{id: '#data-table7', name: 'land_area', datatype: 'integer', group: 'general', propertyPath: 'value', dimension: land_area},
							{id: '#data-table8', name: 'pop_density', datatype: 'decimal2', group: 'general', propertyPath: 'value.finalVal', dimension: pop_density},
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
						 
			// var tables2 = [];
			// for (var i=2; i < d.Metadata.length; i++) {
				// var record = {};
				// console.log(d.Metadata[i])
				// record.name = d.Metadata[i.variable];
				// tables2[i-2] = record;
			// }
			// console.log(tables2);
			
			// create the data tables: because metrics are in columns in the data set and not in rows, we need one data-table per metric
			tables.forEach(function(t) {
				dc.dataTable(t.id)
						.dimension(t.dimension)                
						.group(function (i) {return ''; })
						.columns([
									// icon
									function(d){return '<img src=\"modules/dashboards/img/'+meta_icon[t.name]+'\" width=\"20\">';},
									// name of variable
									function(d){return meta_label[t.name];}, 
									// the value
									function(d){
										// This makes sure that once the barangay-level is loaded, but no further subselection  is made yet, 
										// the profile of the whole municipality is still shown. Otherwise it would show 'N.A.' sooner than necessary.
										if ($scope.admlevel === 4 && $scope.filters.length === 0) {
											if(meta_format[t.name] === 'decimal0'){
												return dec0Format(d_prev[t.name]);
											} else if(meta_format[t.name] === 'percentage'){
												return percFormat(d_prev[t.name]);
											} else if(meta_format[t.name] === 'decimal2'){
												return dec2Format(d_prev[t.name]);
											}
										} else {
											if (isNaN($scope.deepFind(d, t.propertyPath))) {
												return 'N.A. on this level'; 
											} else if(meta_format[t.name] === 'decimal0'){
												return dec0Format($scope.deepFind(d, t.propertyPath));
											} else if(meta_format[t.name] === 'percentage'){
												return percFormat($scope.deepFind(d, t.propertyPath));
											} else if(meta_format[t.name] === 'decimal2'){
												return dec2Format($scope.deepFind(d, t.propertyPath));
											}
										}
									},
									function(d){
										if (isNaN($scope.deepFind(d, t.propertyPath))) {
											return '';
										} else {return meta_unit[t.name]; }
									}
							])
						.title(function(d){return lookup[t.name];})	
						.order(d3.descending);
			});												
			
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
									.domain([d3.min(d.Rapportage,function(d) {return d[$scope.metric];}),d3.max(d.Rapportage,function(d) {return d[$scope.metric];})])
									.range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']))
					.colorCalculator(function (d) { return d ? mapChart.colors()(d) : '#cccccc'; })
					;
				dc.filterAll();
				dc.redrawAll();
			};
			
			$scope.level_up = function(dest_level) {
				if (dest_level === 2 && $scope.admlevel) {
					$scope.admlevel = 2;
					$scope.parent_code = '';
					$scope.reload(d);
				} else if (dest_level === 3 && $scope.admlevel > 2) {
					$scope.admlevel = 3;
					$scope.parent_code = $scope.prov_code;
					$scope.reload(d);
					
				}
			};
			
			$scope.export_csv = function() {
				var content = d.Rapportage;
				//console.log(content);

				var finalVal = '';
				
				for (var i = 0; i < content.length; i++) {
					var value = content[i];
					var key,innerValue,result;
					if (i === 0) {
						for (key in value) {
							if (value.hasOwnProperty(key)) {
								innerValue =  key;
								result = innerValue.replace(/"/g, '""');
								if (result.search(/("|,|\n)/g) >= 0)
									result = '"' + result + '"';
								if (key !== 'pcode') finalVal += ';';
								finalVal += result;
							}
						}
					finalVal += '\n';	
					}

					for (key in value) { 
						if (value.hasOwnProperty(key)) {
							innerValue =  JSON.stringify(value[key]);
							result = innerValue.replace(/"/g, '""');
							if (result.search(/("|,|\n)/g) >= 0)
								result = '"' + result + '"';
							if (key !== 'pcode') finalVal += ';';
							finalVal += result;
						}
					}

					finalVal += '\n';
				}
				console.log(finalVal);

				var download = document.getElementById('download');
				download.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
				download.setAttribute('download', 'export.csv');
			};
			
			//Render all dc-charts and -tables
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
