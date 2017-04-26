'use strict';

angular.module('dashboards')
	.controller('InformGlobalController', ['$scope','$rootScope','$compile', '$q', 'Authentication', 'Dashboards', 'Data', 'Sources', '$window', '$stateParams', 'cfpLoadingBar', '_',
	function($scope,$rootScope, $compile, $q, Authentication, Dashboards, Data, Sources, $window, $stateParams, cfpLoadingBar, _) {
		
		//Define variables
		$scope.authentication = Authentication;
		$scope.geom = null;
		$scope.country_code = 'INFORM';
		if ($rootScope.country_code) { $scope.country_code = $rootScope.country_code;}
		$scope.admlevel = 2;
		$scope.metric = '';
		$scope.metric_label = '';
		$scope.metric_year = '';
		$scope.metric_source = '';
		$scope.metric_desc = '';
		$scope.metric_icon = '';
		$scope.admlevel_text = '';
		$scope.name_selection = '';
		$scope.name_selection_prev = '';
		$scope.name_popup = '';
		$scope.value_popup = 0;
		$scope.country_selection = '';
		$scope.level2_selection = undefined;
		$scope.level3_selection = undefined;
		$scope.level2_code = '';
		$scope.level3_code = '';
		$scope.type_selection = '';
		$scope.subtype_selection = ''; 
		$scope.parent_code = '';
		$scope.data_input = '';
		$scope.filters = [];
		$scope.tables = [];
		$scope.x = 500;
		$scope.y = 200;
		var mapfilters_length = 0;
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
			
			$scope.metric = '';
			$scope.admlevel = 2;
			$scope.data_input = $scope.admlevel + ',\'' + $scope.country_code + '\',\'' + $scope.parent_code;

			Dashboards.get({dashboardId: $stateParams.dashboardId},
			    function(dashboard) {		
					// get the data
					//console.log(data_input);
					Data.get({adminLevel: $scope.data_input}, 
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
			
			$scope.data_input = $scope.admlevel + ',\'' + $scope.country_code + '\',\'' + $scope.parent_code;

			Data.get({adminLevel: $scope.data_input}, 
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
		  //var geo_data = dashboard.sources.Worldmap.data;
		  //d.Districts = topojson.feature(geo_data,geo_data.objects[object_name]);
		  d.Districts = pgData.usp_data.geo;
		  d.Rapportage = pgData.usp_data.ind;
		  
		  //d.Metadata = pgData.usp_data.meta;
		  var meta = dashboard.sources.Metadata.data;
		  d.Metadata = $.grep(meta, function(e){ return e.country_code == $scope.country_code; });
		  d.Country_meta = dashboard.sources.Country_meta.data;
		  $scope.geom = d.Districts //pgData.usp_data.geo;
		  
		  console.log(d);
		  // generate the actual content of the dashboard
		  $scope.generateCharts(d);
		  
		  // end loading bar
		  $scope.complete();
			
		  //Check if browser is IE (L_PREFER_CANVAS is a result from an earlier IE-check in layout.server.view.html)	
		  if (typeof L_PREFER_CANVAS !== 'undefined') {
			$('#IEmodal').modal('show');
		  }	

		};
		//Slightly adjusted version of prepare function upon reload. Needed because the d.Metadata could not be loaded again when the dashboard itself was not re-initiated.
		//Therefore the d-object needed to be saved, instead of completely re-created.
		$scope.prepare_reload = function(d,pgData) {
		  // set the title
		  $scope.title = $scope.config.title;
				
		  // create the map chart (NOTE: this has to be done before the ajax call)
		  $scope.mapChartType = 'leafletChoroplethChart';	
		  
		  // load data (metadata does not have to be reloaded)
		  //var d = {};
		  d.Districts = pgData.usp_data.geo;
		  d.Rapportage = pgData.usp_data.ind;
		  $scope.geom = pgData.usp_data.geo;
		  
		  $scope.generateCharts(d);
		  
		  // end loading bar
		  $scope.complete();	   

		};

		//////////////////////
		// SET UP FUNCTIONS //
		//////////////////////
		
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
		// fill the lookup table with the metadata-information per variable
		$scope.genLookup_country_meta = function (d,field){
			var lookup_country_meta = {};
			d.Country_meta.forEach(function(e){
				lookup_country_meta[e.country_code] = String(e[field]);
			});
			return lookup_country_meta;
		};
		
		// function to find object property value by path 
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
		
		
		///////////////////////////////////////////
		// MAIN FUNCTION TO GENERATE ALL CONTENT //
		///////////////////////////////////////////
		
		$scope.generateCharts = function (d){
			
			// Clear the charts
			dc.chartRegistry.clear();
			if (map !== undefined) { map.remove(); }
			
			//define dc-charts (the name-tag following the # is how you refer to these charts in html with id-tag)
			var mapChart = dc.leafletChoroplethChart('#map-chart');
			//var rowChart = dc.rowChart('#tab-chart');
			
			//////////////////////////
			// SETUP META VARIABLES //
			//////////////////////////

			//set up country metadata
			var country_name = $scope.genLookup_country_meta(d,'country_name');
			var country_level2 = $scope.genLookup_country_meta(d,'level2_name');
			var country_level3 = $scope.genLookup_country_meta(d,'level3_name');
			var country_level4 = $scope.genLookup_country_meta(d,'level4_name');
			var country_zoom_min = $scope.genLookup_country_meta(d,'zoomlevel_min');
			var country_zoom_max = $scope.genLookup_country_meta(d,'zoomlevel_max');
			var country_default_metric = $scope.genLookup_country_meta(d,'default_metric');

			$scope.country_selection = country_name[$scope.country_code];
			var zoom_min = country_zoom_min[$scope.country_code]; 
			var zoom_max = country_zoom_max[$scope.country_code]; 
			if ($scope.metric === '') { 
				$scope.metric = country_default_metric[$scope.country_code]; 
			}
			if ($scope.admlevel === 2) { 
				$scope.name_selection = country_name[$scope.country_code]; 
			}
			if (zoom_max < 4) {document.getElementById('level4').style.visibility = 'hidden'; }		
			if (zoom_max < 3) {document.getElementById('level3').style.visibility = 'hidden'; }		
			
			// get the lookup tables
			var lookup = $scope.genLookup($scope.config.nameAttribute);
			
			var meta_label = $scope.genLookup_meta(d,'label');
			var meta_format = $scope.genLookup_meta(d,'format');
			var meta_unit = $scope.genLookup_meta(d,'unit');
			var meta_icon = $scope.genLookup_meta(d,'icon_src');
			var meta_year = $scope.genLookup_meta(d,'year');
			var meta_source = $scope.genLookup_meta(d,'source_link');
			var meta_desc = $scope.genLookup_meta(d,'description');
			var meta_scorevar = $scope.genLookup_meta(d,'scorevar_name');
			
			$scope.metric_label = meta_label[$scope.metric];
			
			if ($scope.admlevel === 2) {
				$scope.type_selection = 'Country';
				$scope.subtype_selection = country_level2[$scope.country_code]; 
				$scope.level2_selection = undefined;
				$scope.level3_selection = undefined;
				$scope.level2_code = '';
				$scope.level3_code = '';
			} else if ($scope.admlevel === 3) {
				$scope.type_selection = country_level2[$scope.country_code]; 
				$scope.subtype_selection = country_level3[$scope.country_code]; 
				$scope.level2_selection = $scope.name_selection;
				$scope.level2_code = $scope.parent_code;
				$scope.level3_selection = undefined;
				$scope.level3_code = '';
			} else if ($scope.admlevel === 4) {
				$scope.type_selection = country_level3[$scope.country_code]; 
				$scope.subtype_selection = country_level4[$scope.country_code]; 
				$scope.level3_selection = $scope.name_selection;
				$scope.level3_code = $scope.parent_code;
			}
			
			$scope.tables = [];
			for (var i=0; i < d.Metadata.length; i++) {
				var record = {};
				var record_temp = d.Metadata[i];
				record.id = 'data-table' + [i+1];
				record.name = record_temp.variable;
				record.group = record_temp.group;
				record.propertyPath = record_temp.agg_method === 'sum' ? 'value' : 'value.finalVal';
				record.dimension = undefined;
				record.weight_var = record_temp.weight_var;
				record.scorevar_name = record_temp.scorevar_name;
				$scope.tables[i] = record;
			}
			
						
			/////////////////////
			// NUMBER FORMATS ///
			/////////////////////
			
			//Define number formats for absolute numbers and for percentage metrics
			var intFormat = d3.format(',');
			var dec0Format = d3.format(',.0f');
			var dec1Format = d3.format(',.1f');
			var dec2Format = d3.format('.2f');
			var percFormat = d3.format(',.2%');
			
			var currentFormat = function(value) {
				if (meta_format[$scope.metric] === 'decimal0') { return dec0Format(value);}
				else if (meta_format[$scope.metric] === 'decimal2') { return dec2Format(value);}
				else if (meta_format[$scope.metric] === 'percentage') { return percFormat(value);}
			};
			
			
			///////////////////////
			// CROSSFILTER SETUP //
			///////////////////////
			
			//var cf = crossfilter(d3.range(0, data.Districts.features.length));
			var cf = crossfilter(d.Rapportage);
			
			// The wheredimension returns the unique identifier of the geo area
			var whereDimension = cf.dimension(function(d) { return d.pcode; });
			//var whereDimension_tab = cf.dimension(function(d) { return d.pcode; });
			
			// Create the groups for these two dimensions (i.e. sum the metric)
			var whereGroupSum = whereDimension.group().reduceSum(function(d) { return d[$scope.metric];});
			//var whereGroupSum_tab = whereDimension_tab.group();
			var whereGroupSum_scores = whereDimension.group().reduceSum(function(d) { if (!meta_scorevar[$scope.metric]) { return d[$scope.metric];} else { return d[meta_scorevar[$scope.metric]];};});

			// group with all, needed for data-count
			var all = cf.groupAll();
			// get the count of the number of rows in the dataset (total and filtered)
			dc.dataCount('#count-info')
					.dimension(cf)
					.group(all);
				
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
			
			//Create the appropriate crossfilter dimension-group for each element of Tables
			var dimensions = [];
			$scope.tables.forEach(function(t) {
				var name = t.name;
				if (t.propertyPath === 'value.finalVal') {
					var weight_var = t.weight_var;
					dimensions[name] = totaalDim.group().reduce(reduceAddAvg([name],[weight_var]),reduceRemoveAvg([name],[weight_var]),reduceInitialAvg);
				} else if (t.propertyPath === 'value') {
					dimensions[name] = totaalDim.group().reduceSum(function(d) {return d[name];});
				}
			});
			// Make a separate one for the filling of the bar charts (based on 0-10 score per indicator)
			var dimensions_scores = [];
			$scope.tables.forEach(function(t) {
				var name = t.name;
				if (t.scorevar_name) { 
					var name_score = t.scorevar_name;
					if (t.propertyPath === 'value.finalVal') {
						var weight_var = t.weight_var;
						dimensions_scores[name] = totaalDim.group().reduce(reduceAddAvg([name_score],[weight_var]),reduceRemoveAvg([name_score],[weight_var]),reduceInitialAvg);
					} else if (t.propertyPath === 'value') {
						dimensions_scores[name] = totaalDim.group().reduceSum(function(d) {return d[name_score];});
					}
				}
			});
			//Now attach the dimension to the tables-array		
			var i;
			for (i=0; i < d.Metadata.length; i++) {
				var name = $scope.tables[i].name;
				$scope.tables[i].dimension = dimensions[name];
			}
			
			
			///////////////////////////////
			// SET UP ALL INDICATOR HTML //
			///////////////////////////////
			
			//Create table with current crossfilter-selection output, so that you can also access this in other ways than through DC.js
			var fill_keyvalues = function() {
				var keyvalue = [];
				$scope.tables.forEach(function(t) {
					var key = t.name;
					if ($scope.admlevel == zoom_max && zoom_max > zoom_min && $scope.filters.length == 0) {
						if(meta_format[t.name] === 'decimal0'){
							keyvalue[key] =  dec0Format(d_prev[t.name]);
						} else if(meta_format[t.name] === 'percentage'){
							keyvalue[key] =  percFormat(d_prev[t.name]);
						} else if(meta_format[t.name] === 'decimal2'){
							keyvalue[key] =  dec2Format(d_prev[t.name]);
						}
					} else {
						if (t.propertyPath === 'value.finalVal') {
							if (isNaN(dimensions[t.name].top(1)[0].value.finalVal)) {
								keyvalue[key] =  'N.A. on this level'; 
							} else if(meta_format[t.name] === 'decimal0'){
								keyvalue[key] = dec0Format(dimensions[t.name].top(1)[0].value.finalVal);
							} else if(meta_format[t.name] === 'percentage'){
								keyvalue[key] = percFormat(dimensions[t.name].top(1)[0].value.finalVal);
							} else if(meta_format[t.name] === 'decimal2'){
								keyvalue[key] = dec2Format(dimensions[t.name].top(1)[0].value.finalVal);
							}
						} else if(t.propertyPath === 'value') {
							if (isNaN(dimensions[t.name].top(1)[0].value)) {
								keyvalue[key] =  'N.A. on this level'; 
							} else if(meta_format[t.name] === 'decimal0'){
								keyvalue[key] = dec0Format(dimensions[t.name].top(1)[0].value);
							} else if(meta_format[t.name] === 'percentage'){
								keyvalue[key] = percFormat(dimensions[t.name].top(1)[0].value);
							} else if(meta_format[t.name] === 'decimal2'){
								keyvalue[key] = dec2Format(dimensions[t.name].top(1)[0].value);
							}
						}
					}
				});
				return keyvalue;
			};
			var keyvalue = fill_keyvalues();
			
			var high_med_low = function(ind,ind_score) {
				
				if (dimensions_scores[ind]) {
					if ($scope.admlevel == zoom_max && zoom_max > zoom_min && $scope.filters.length == 0) {
							var width = d_prev[ind_score];
						} else {
							var width = dimensions_scores[ind].top(1)[0].value.finalVal;
						}
					if (isNaN(width)) {return 'notavailable';}
					else if (width < 3.5) { return 'good';} 
					else if (width <= 4.5) {return 'medium-good';}
					else if (width <= 5.5) {return 'medium';}
					else if (width <= 6.5) {return 'medium-bad';}
					else if (width > 6.5) { return 'bad';} 
				}				
			};	

			$scope.createHTML = function(keyvalue) {
				
				var risk_score = document.getElementById('risk_score_main');
				if (risk_score) {
					risk_score.textContent = keyvalue.risk_score;
					risk_score.setAttribute('class','component-score ' + high_med_low('risk_score','risk_score'));					
				}
				var vulnerability_score = document.getElementById('vulnerability_score_main');
				if (vulnerability_score) {
					vulnerability_score.textContent = keyvalue.vulnerability_score;
					vulnerability_score.setAttribute('class','component-score ' + high_med_low('vulnerability_score','vulnerability_score'));				
				}
				var hazard_score = document.getElementById('hazard_score_main');
				if (hazard_score) {
					hazard_score.textContent = keyvalue.hazard_score;
					hazard_score.setAttribute('class','component-score ' + high_med_low('hazard_score','hazard_score'));				
				}
				var coping_score = document.getElementById('coping_capacity_score_main');
				if (coping_score) {
					coping_score.textContent = keyvalue.coping_capacity_score;
					coping_score.setAttribute('class','component-score ' + high_med_low('coping_capacity_score','coping_capacity_score'));				
				}

				
				//Dynamically create HTML-elements for all indicator tables
				var general = document.getElementById('general');
				var scores = document.getElementById('scores');
				var vulnerability = document.getElementById('vulnerability');
				var hazard = document.getElementById('hazard');
				var coping = document.getElementById('coping');
				while (general.firstChild) { general.removeChild(general.firstChild); }
				while (scores.firstChild) { scores.removeChild(scores.firstChild); }
				while (vulnerability.firstChild) { vulnerability.removeChild(vulnerability.firstChild); }
				while (hazard.firstChild) { hazard.removeChild(hazard.firstChild); }
				while (coping.firstChild) { coping.removeChild(coping.firstChild); }
				for (var i=0;i<$scope.tables.length;i++) {
					var record = $scope.tables[i];
					
					if (!meta_icon[record.name]) {var icon = 'modules/dashboards/img/undefined.png';}
					else {var icon = 'modules/dashboards/img/'+meta_icon[record.name];}
					
					if (record.group === 'general') {
						
						if (meta_unit[record.name] === 'null') {var unit = '';} else {var unit = meta_unit[record.name];}
						
						var div = document.createElement('div');
						div.setAttribute('class','row profile-item');
						var parent = document.getElementById(record.group);
						parent.appendChild(div);
						var div0 = document.createElement('div');
						div0.setAttribute('class','col col-md-1');
						div.appendChild(div0);	
						var img = document.createElement('img');
						img.setAttribute('class','community-icon');
						img.setAttribute('src',icon);
						div0.appendChild(img);
						var div1 = document.createElement('div');
						div1.setAttribute('class','col col-md-5 general-component-label');
						div1.setAttribute('ng-click','map_coloring(\''+record.name+'\')');
						div1.innerHTML = meta_label[record.name];
						div.appendChild(div1);	
						$compile(div1)($scope);
						var div2 = document.createElement('div');
						div2.setAttribute('class','col col-md-4');
						div2.setAttribute('id',record.name);
						div2.innerHTML = keyvalue[record.name] + ' ' + unit;
						div.appendChild(div2);
						var div3 = document.createElement('div');
						div3.setAttribute('class','col col-md-2');
						div.appendChild(div3);
						var button = document.createElement('button');
						button.setAttribute('type','button');
						button.setAttribute('class','btn-modal');
						button.setAttribute('data-toggle','modal');
						button.setAttribute('ng-click','info(\'' + record.name + '\')');
						div3.appendChild(button);
						$compile(button)($scope);
						var img = document.createElement('img');
						img.setAttribute('src','modules/dashboards/img/icon-popup.svg');
						img.setAttribute('style','height:17px');
						button.appendChild(img);
					
					} else if (record.group) {
						
						if ($scope.admlevel == zoom_max && zoom_max > zoom_min && $scope.filters.length == 0) {
							var width = d_prev[record.scorevar_name]*10;
						} else {
							var width = dimensions_scores[record.name].top(1)[0].value.finalVal*10;
						}

						var div = document.createElement('div');
						div.setAttribute('class','component-section');
						var parent = document.getElementById(record.group);
						parent.appendChild(div);
						var div0 = document.createElement('div');
						div0.setAttribute('class','col-md-2');
						div.appendChild(div0);	
						var img1 = document.createElement('img');
						img1.setAttribute('style','height:20px');
						img1.setAttribute('src',icon);
						div0.appendChild(img1);
						var div1 = document.createElement('div');
						div1.setAttribute('class','col-md-3 component-label');
						div1.setAttribute('ng-click','map_coloring(\''+record.name+'\')');
						div1.innerHTML = meta_label[record.name];
						$compile(div1)($scope);
						div.appendChild(div1);	
						var div1a = document.createElement('div');
						div1a.setAttribute('class','component-score ' + high_med_low(record.name,record.scorevar_name));
						div1a.setAttribute('id',record.name);
						div1a.innerHTML = keyvalue[record.name];
						div1.appendChild(div1a);
						var div2 = document.createElement('div');
						div2.setAttribute('class','col-md-5');
						div.appendChild(div2);
						var div2a = document.createElement('div');
						div2a.setAttribute('class','component-scale');
						div2.appendChild(div2a);
						var div2a1 = document.createElement('div');
						div2a1.setAttribute('class','score-bar ' + high_med_low(record.name,record.scorevar_name));
						div2a1.setAttribute('id','bar-'+record.name);
						div2a1.setAttribute('style','width:'+ width + '%');
						div2a.appendChild(div2a1);
						var img2 = document.createElement('img');
						img2.setAttribute('class','scale-icon');
						img2.setAttribute('src','modules/dashboards/img/icon-scale.svg');
						div2a.appendChild(img2);
						var div3 = document.createElement('div');
						div3.setAttribute('class','col-sm-2 col-md-2 no-padding');
						div.appendChild(div3);
						var button = document.createElement('button');
						button.setAttribute('type','button');
						button.setAttribute('class','btn-modal');
						button.setAttribute('data-toggle','modal');
						button.setAttribute('ng-click','info(\'' + record.name + '\')');
						div3.appendChild(button);
						$compile(button)($scope);
						var img3 = document.createElement('img');
						img3.setAttribute('src','modules/dashboards/img/icon-popup.svg');
						img3.setAttribute('style','height:17px');
						button.appendChild(img3);
					}
				}
			};
			$scope.createHTML(keyvalue);
			
			
			$scope.updateHTML = function(keyvalue) {
				
				var risk_score = document.getElementById('risk_score_main');
				if (risk_score) {
					risk_score.textContent = keyvalue.risk_score;
					risk_score.setAttribute('class','component-score ' + high_med_low('risk_score','risk_score'));					
				}
				var vulnerability_score = document.getElementById('vulnerability_score_main');
				if (vulnerability_score) {
					vulnerability_score.textContent = keyvalue.vulnerability_score;
					vulnerability_score.setAttribute('class','component-score ' + high_med_low('vulnerability_score','vulnerability_score'));				
				}
				var hazard_score = document.getElementById('hazard_score_main');
				if (hazard_score) {
					hazard_score.textContent = keyvalue.hazard_score;
					hazard_score.setAttribute('class','component-score ' + high_med_low('hazard_score','hazard_score'));				
				}
				var coping_score = document.getElementById('coping_capacity_score_main');
				if (coping_score) {
					coping_score.textContent = keyvalue.coping_capacity_score;
					coping_score.setAttribute('class','component-score ' + high_med_low('coping_capacity_score','coping_capacity_score'));				
				}

				for (var i=0;i<$scope.tables.length;i++) {
					var record = $scope.tables[i];
					
					if (record.group === 'general') {
						
						if (meta_unit[record.name] === 'null') {var unit = '';} else {var unit = meta_unit[record.name];}
						var div2 = document.getElementById(record.name);
						div2.innerHTML = keyvalue[record.name] + ' ' + unit;
					
					} else if (record.group) {
						
						if ($scope.admlevel == zoom_max && zoom_max > zoom_min && $scope.filters.length == 0) {
							var width = d_prev[record.scorevar_name]*10;
						} else {
							var width = dimensions_scores[record.name].top(1)[0].value.finalVal*10;
						}
					
						var div1a = document.getElementById(record.name);
						div1a.setAttribute('class','component-score ' + high_med_low(record.name,record.scorevar_name));
						div1a.innerHTML = keyvalue[record.name];
						var div2a1 = document.getElementById('bar-'+record.name);
						div2a1.setAttribute('class','score-bar ' + high_med_low(record.name,record.scorevar_name));
						div2a1.setAttribute('style','width:'+ width + '%');
					}
				}
			};
			
			
			/////////////////////
			// MAP CHART SETUP //
			/////////////////////
			
			//Define the range of all values for current metric (to be used for quantile coloring)
			//Define the color-quantiles based on this range
			$scope.mapchartColors = function() {
				if (!meta_scorevar[$scope.metric]){
					var quantile_range = [];
					for (i=0;i<d.Rapportage.length;i++) {
						quantile_range[i] = d.Rapportage[i][$scope.metric];
					};
					return d3.scale.quantile()
							.domain(quantile_range)
							.range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']);
				}
			};
			var mapchartColors = $scope.mapchartColors();		
			
			//Set up the map itself with all its properties
			mapChart
				.width($('#map-chart').width())
				.height(800)
				.dimension(whereDimension)
				.group(whereGroupSum_scores)
				.center([0,0])
				.zoom(0)
				.geojson(d.Districts)				
				.colors(mapchartColors)
				.colorCalculator(function(d){
					if (!meta_scorevar[$scope.metric]){
						return d ? mapChart.colors()(d) : '#cccccc';
					} else {
						if (d==0) {return '#cccccc';} 
						else if (d<3.5) {return '#1a9641';} else if (d<=4.5) {return '#a6d96a';} else if (d<=5.5) {return '#f1d121';} else if (d<=6.5) {return '#fd6161';} else if (d>6.5) {return '#d7191c';}
					}
				})
				.featureKeyAccessor(function(feature){
					return feature.properties.pcode;
				})
				.popup(function(d){
					return lookup[d.key].concat(' - ',meta_label[$scope.metric],': ',currentFormat(d.value));
				})
				.renderPopup(true)
				.turnOnControls(true)
				//Set up what happens when clicking on the map (popup appearing mainly)
				.on('filtered',function(chart,filters){
					$scope.filters = chart.filters();
					var popup = document.getElementById('mapPopup');
					popup.style.visibility = 'hidden';
					document.getElementById('zoomin_icon').style.visibility = 'hidden';
					if ($scope.filters.length > mapfilters_length) {
						$scope.$apply(function() {
							$scope.name_popup = lookup[$scope.filters[$scope.filters.length - 1]];
							for (var i=0;i<d.Rapportage.length;i++) {
								var record = d.Rapportage[i];
								if (record.pcode === $scope.filters[$scope.filters.length - 1]) {
									$scope.value_popup = currentFormat(record[$scope.metric]); 
									break;
								};
							}
							$scope.metric_label = meta_label[$scope.metric];
						})
						//In Firefox event is not a global variable >> Not figured out how to fix this, so gave the popup a fixed position in FF only
						if (typeof event !== 'undefined') {
							popup.style.left = event.pageX + 'px';	
							popup.style.top = event.pageY + 'px';
						} else {
							popup.style.left = '400px';	
							popup.style.top = '100px';
						}
						popup.style.visibility = 'visible';
						if ($scope.admlevel < zoom_max) { document.getElementById('zoomin_icon').style.visibility = 'visible'; }
					} 
					mapfilters_length = $scope.filters.length;
					//Recalculate all community-profile figures
					var keyvalue = fill_keyvalues();
					$scope.updateHTML(keyvalue);	
					//let reset-button (dis)appear
					var resetbutton = document.getElementsByClassName('reset-button')[0];	
					if ($scope.filters.length > 0) {
						resetbutton.style.visibility = 'visible';
					} else {
						resetbutton.style.visibility = 'hidden';
					}
					
				})
			;
			
		
				
			///////////////////////////
			// MAP RELATED FUNCTIONS //
			///////////////////////////
			
			$scope.zoom_in = function() {
				
				if ($scope.filters.length > 0 && $scope.admlevel < zoom_max) {
					$scope.admlevel = $scope.admlevel + 1;
					$scope.parent_code_prev = $scope.parent_code;
					$scope.name_selection_prev = $scope.name_selection;
					$scope.parent_code = $scope.filters[$scope.filters.length - 1];
					$scope.name_selection = lookup[$scope.parent_code];
					if ($scope.admlevel == zoom_max) {
						$scope.metric = 'population';
						for (var i=0;i<d.Rapportage.length;i++) {
							var record = d.Rapportage[i];
							if (record.pcode === $scope.filters[0]) {d_prev = record; break;}
						}
					}
					$scope.filters = [];
					$scope.reload(d);
					document.getElementById('level' + $scope.admlevel).setAttribute('class','btn btn-secondary btn-active');
					document.getElementById('mapPopup').style.visibility = 'hidden';
					document.getElementById('zoomin_icon').style.visibility = 'hidden';
					document.getElementsByClassName('reset-button')[0].style.visibility = 'hidden';
					mapfilters_length = 0;
				}
				
			}

			//Functions for zooming out
			$scope.zoom_out = function(dest_level) {
				var admlevel_old = $scope.admlevel;
				if (dest_level === 2 && $scope.admlevel > 2) {
					$scope.admlevel = dest_level;
					$scope.parent_code = '';
					$scope.reload(d);
				} else if (dest_level === 3 && $scope.admlevel > 3) {
					$scope.admlevel = 3;
					$scope.parent_code = $scope.level2_code;
					$scope.name_selection = $scope.name_selection_prev;
					$scope.reload(d);
				}
				while (admlevel_old > dest_level) {
					document.getElementById('level' + admlevel_old).setAttribute('class','btn btn-secondary');
					admlevel_old = admlevel_old-1;
				} 
				document.getElementById('mapPopup').style.visibility = 'hidden';
				document.getElementById('zoomin_icon').style.visibility = 'hidden';
			};

			$scope.map_coloring = function(id) {

				$scope.metric = id;	
				$scope.metric_label = meta_label[id];
				var mapchartColors = $scope.mapchartColors();	
				whereGroupSum_scores.dispose();
				whereGroupSum_scores = whereDimension.group().reduceSum(function(d) { if (!meta_scorevar[$scope.metric]) {return d[$scope.metric];} else { return d[meta_scorevar[$scope.metric]];};});
				mapChart
					.group(whereGroupSum_scores)
					.colors(mapchartColors)
					.colorCalculator(function(d){
						if (!meta_scorevar[$scope.metric]){
							return d ? mapChart.colors()(d) : '#cccccc';
						} else {
							if (d==0) {return '#cccccc';} 
							else if (d<3.5) {return '#1a9641';} else if (d<=4.5) {return '#a6d96a';} else if (d<=5.5) {return '#f1d121';} else if (d<=6.5) {return '#fd6161';} else if (d>6.5) {return '#d7191c';}
						}
					})
					;
				dc.filterAll();
				dc.redrawAll();
				document.getElementById('mapPopup').style.visibility = 'hidden';
				document.getElementById('zoomin_icon').style.visibility = 'hidden';
			};
			
			
			//Make sure that when opening another accordion-panel, the current one collapses
			var acc = document.getElementsByClassName('card-header');
			var panel = document.getElementsByClassName('collapse');
			var active = document.getElementsByClassName('collapse in')[0];
			
			for (var i = 0; i < acc.length; i++) {
				acc[i].onclick = function() {
					var active_new = document.getElementById(this.id.replace('heading','collapse'));
					if (active.id !== active_new.id) {
						active.classList.remove('in');
					} 
					active = active_new;
				}
			}
		
			
			/////////////////////
			// OTHER FUNCTIONS //
			/////////////////////		
			
			//Function to open the modal with information on indicator
			$scope.info = function(id) {
				$scope.metric = id;
				$scope.metric_label = meta_label[$scope.metric];
				$scope.metric_year = meta_year[$scope.metric];
				$scope.metric_source = meta_source[$scope.metric];
				$scope.metric_desc = meta_desc[$scope.metric];
				if (!meta_icon[$scope.metric]) {$scope.metric_icon = 'modules/dashboards/img/undefined.png';}
				else {$scope.metric_icon = 'modules/dashboards/img/' + meta_icon[$scope.metric];}
				$('#infoModal').modal('show');
			};
			
			//Export to CSV function
			$scope.export_csv = function() {
				var content = d.Rapportage;
				for (var i=0;i<content.length;i++){
					content[i].name = lookup[content[i].pcode];
				};

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
				
				var download = document.getElementById('download');
				download.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
				download.setAttribute('download', 'export.csv');
			};
			
			//Tabslide functions (Not included yet at the moment)
/* 			$(function(){
				 $('.slide-out-tab-province').tabSlideOut({
					 tabHandle: '.handle',                              //class of the element that will be your tab
					 clickScreenToClose: false,
					 tabLocation: 'left',                               //side of screen where tab lives, top, right, bottom, or left
					 speed: 300,                                        //speed of animation
					 action: 'click',                                   //options: 'click' or 'hover', action to trigger animation
					 topPos: '65px',                                    //position from the top
					 fixedPosition: false                               //options: true makes it stick(fixed position) on scroll
				   });
			});


			$(function(){
				 $('.slide-out-tab-legend').tabSlideOut({
					 tabHandle: '.handle-legend',                       //class of the element that will be your tab
					 tabLocation: 'left',                               //side of screen where tab lives, top, right, bottom, or left
					 speed: 300,                                        //speed of animation
					 action: 'click',                                   //options: 'click' or 'hover', action to trigger animation
					 topPos: '218px',                                   //position from the top
					 fixedPosition: false                               //options: true makes it stick(fixed position) on scroll
				   });
			}); */
			
			
			/////////////////////////
			// RENDER MAP AND PAGE //
			/////////////////////////
			
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

