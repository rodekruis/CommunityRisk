'use strict';

angular.module('dashboards')
	.controller('CommunityRiskController', ['$scope','$css','$rootScope','$compile', '$q', 'Authentication', 'Dashboards', 'Data', 'Sources', '$window', '$stateParams', 'cfpLoadingBar', '_',
	function($scope,$css,$rootScope, $compile, $q, Authentication, Dashboards, Data, Sources, $window, $stateParams, cfpLoadingBar, _) {
		
		//This is the only working method I found to load page-specific CSS.
		//DOWNSIDE: upon first load, you shortly see the unstyled page before the CSS is added..
		//$css.remove(['modules/dashboards/css/core.css','modules/dashboards/css/header.css']);
		$css.add(['modules/dashboards/css/header.css','modules/dashboards/css/dashboards.css']);
		
        ////////////////////////
		// SET MAIN VARIABLES //
		////////////////////////

		$scope.change_view = function(view) {
			$rootScope.view_code = view;
		}
		$scope.change_country = function(country) {
			$scope.country_code = country;
			$scope.parent_codes = [];
			$scope.metric = '';
			$scope.initiate($rootScope.view_code);
		}		

        
        //////////////////////
		// DEFINE VARIABLES //
		//////////////////////

		$rootScope.loadCount = 0;
		$scope.authentication = Authentication;
		$scope.geom = null;
		$scope.country_code = 'PHL';
		$scope.view_code = 'CRA';
		$scope.metric = '';
		if ($rootScope.country_code) { $scope.country_code = $rootScope.country_code;}
		if ($rootScope.view_code) { $scope.view_code = $rootScope.view_code;};
		$scope.view_code == 'CRA' ? $scope.admlevel = 2 : $scope.admlevel = 3;
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
		$scope.parent_codes = [];
		$scope.data_input = '';
		$scope.filters = [];
		$scope.tables = [];
		$scope.x = 500;
		$scope.y = 200;
		$scope.quantileColorDomain_CRA_std = ['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d'];
		$scope.quantileColorDomain_CRA_scores = ['#1a9641','#a6d96a','#f1d121','#fd6161','#d7191c'];
		var mapfilters_length = 0;
		var d_prev = '';
		var map;
		$scope.config =  {
            whereFieldName:'pcode',
            joinAttribute:'pcode',
            nameAttribute:'name',
            color:'#0080ff'
        };	
		
        
        ///////////////////////
		// INITIAL FUNCTIONS //
		///////////////////////

		$scope.start = function() {
            cfpLoadingBar.start();
		};
		$scope.complete = function () {
            cfpLoadingBar.complete();
		};
        $scope.replace_null = function(value) { 
            return (value == null || value == 'null' || !value) ? "" : value;
        };
	
	
        ////////////////////////
		// INITIATE DASHBOARD //
		////////////////////////
        
		$scope.initiate = function(view_code) {	    
				
			//Start loading bar
		    $scope.start();
			
            //Set some exceptions, can be done better in future (i.e. reading from metadata, BUT metadata is only readed later in the script currently)
			$scope.admlevel = $scope.view_code == 'CRA' ?  1 : 3;
			if ($scope.view_code == 'CRA' && ['PHL','MWI','NPL','LKA','MOZ'].indexOf($scope.country_code) > -1 && !$scope.directURLload) {$scope.admlevel = 2;};	//These countries have a different min zoom-level: code better in future.
			
			//Determine if a parameter-specific URL was entered, and IF SO, set the desired parameters
			var url = location.href;
			if (url.indexOf('?') > -1) {
				url = url.split('?')[1];
				$scope.directURLload = true;
				$scope.country_code = url.split('&')[0].split('=')[1];
				$scope.admlevel = url.split('&')[1].split('=')[1];
				$scope.metric = url.split('&')[2].split('=')[1];
				if ($scope.view_code == 'CRA') {
					$scope.parent_codes = url.split('&')[3].split('=')[1].split(',');
					window.history.pushState({}, document.title, '/#!/community_risk');
				} 
			} else {
				$scope.directURLload = false;
			}
			
			
			//This is the main search-query for PostgreSQL
			$scope.parent_codes_input = '{' + $scope.parent_codes.join(',') + '}';
			$scope.data_input = $scope.admlevel + ',\'' + $scope.country_code + '\',\'' + $scope.parent_codes_input + '\',\'' + $scope.view_code + '\',\'' + $scope.disaster_type + '\',\'' + $scope.disaster_name + '\'';
			//console.log($scope.data_input);
			
			
			Data.get({adminLevel: $scope.data_input}, 
				function(pgData){
					$scope.load_data(pgData);
			});		
			
		}; 
		
		///////////////
		// LOAD DATA //
		///////////////
        
		$scope.load_data = function(pgData) {
		  
            var d = {};
		  
            // 1. Feature data
            d.Rapportage = pgData.usp_data.ind;
          
            // 2. Geo-data
            var pcode_list = [];
            for (var i=0;i<d.Rapportage.length;i++){ pcode_list[i]=d.Rapportage[i].pcode; }
            d.Districts = pgData.usp_data.geo;
            d.Districts.features = $.grep(d.Districts.features, function(e){ return pcode_list.indexOf(e.properties.pcode) > -1; });
            $scope.geom = d.Districts; 
		  
            // 3. Data Preparedness Index data
            d.dpi_temp = pgData.usp_data.dpi;
            d.dpi = [];
            if (d.dpi_temp) {
                for (var i=0;i<d.dpi_temp.length;i++){
                    if (d.dpi_temp[i].admin_level == $scope.admlevel) {
                        d.dpi[0] = d.dpi_temp[i];
                    }
                }
            }
		  
            // 4. Variable-metadata
            d.Metadata_full = pgData.usp_data.meta_indicators; //dashboard.sources.Metadata.data;
            d.Metadata = $.grep(d.Metadata_full, function(e){return e.view_code == 'CRA' && $scope.replace_null(e.country_code).indexOf($scope.country_code) > -1 && e.admin_level >= $scope.admlevel && e.admin_level_min <= $scope.admlevel;}) 
		  
            // 5. Country-metadata
            d.Country_meta_full = pgData.usp_data.meta_country; //dashboard.sources.Country_meta.data;
            d.Country_meta = $.grep(d.Country_meta_full,function(e){return e.country_code == $scope.country_code;});
		  
            // Log to check when needed
            console.log(d);
          
            //Clean up some styling (mainly for if you change to new country when you are at a lower zoom-level already)	
            document.getElementsByClassName('sidebar-wrapper')[0].setAttribute('style',''); 
			document.getElementById('mapPopup').style.visibility = 'hidden';
			document.getElementsByClassName('reset-button')[0].style.visibility = 'hidden';
			if (document.getElementById('level2')) {document.getElementById('level2').setAttribute('class','btn btn-secondary');};
			if (document.getElementById('level3')) {document.getElementById('level3').setAttribute('class','btn btn-secondary');};
            $(".sidebar-wrapper").addClass("in");
            $(document).ready(function () {
                if($(window).width() < 768) {
                   $(".sidebar-wrapper").removeClass("in");
                }
            });
            for (var i=0;i<$('#menu-buttons.in').length;i++){ $('#menu-buttons.in')[i].classList.remove('in'); };
            
		  
            //Load actual content
            $scope.generateCharts(d);
		    
            
            // end loading bar
            $scope.complete();
		  
            //Check if browser is IE (L_PREFER_CANVAS is a result from an earlier IE-check in layout.server.view.html)	
            if ($rootScope.loadCount == 0 && typeof L_PREFER_CANVAS !== 'undefined') {
                $('#IEmodal').modal('show');
                $rootScope.loadCount += 1;
            }	

		};
        
        /////////////////////
		// REINITIATE DATA //
		/////////////////////
		$scope.reinitiate = function(d) {	    
				
			// start loading bar
		    $scope.start();
			
			$scope.parent_codes_input = "{" + $scope.parent_codes.join(",") + "}";
			$scope.data_input = $scope.admlevel + ',\'' + $scope.country_code + '\',\'' + $scope.parent_codes_input + '\',\'' + $scope.view_code + '\',\'' + $scope.disaster_type + '\',\'' + $scope.disaster_name + '\'';
			//console.log($scope.data_input);
			
			Data.get({adminLevel: $scope.data_input}, 
				function(pgData){
					$scope.reload_data(d,pgData);
			});	
		
		};
        
        /////////////////
		// RELOAD DATA //
		/////////////////
        
		//Slightly adjusted version of prepare function upon reload. Needed because the d.Metadata could not be loaded again when the dashboard itself was not re-initiated.
		//Therefore the d-object needed to be saved, instead of completely re-created.
		$scope.reload_data = function(d,pgData) {
		  
            // load data (metadata does not have to be reloaded)
            d.Districts = pgData.usp_data.geo;
            $scope.geom = pgData.usp_data.geo;
            d.Rapportage = pgData.usp_data.ind;
            d.dpi = [];
            if (d.dpi_temp) {
                for (var i=0;i<d.dpi_temp.length;i++){
                    if (d.dpi_temp[i].admin_level == $scope.admlevel) {
                        d.dpi[0] = d.dpi_temp[i];
                    }
                }
            }
            d.Metadata = $.grep(d.Metadata_full, function(e){ return e.view_code == 'CRA' && $scope.replace_null(e.country_code).indexOf($scope.country_code) > -1 && e.admin_level >= $scope.admlevel && e.admin_level_min <= $scope.admlevel;})
		  
            //console.log(d);
            
            //Load actual content
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
				lookup_meta[e.variable] = $scope.replace_null(String(e[field]));
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
		
		
		///////////////////////////////////////////
		// MAIN FUNCTION TO GENERATE ALL CONTENT //
		///////////////////////////////////////////
		
		$scope.generateCharts = function (d){
			
			// Clear the charts
			dc.chartRegistry.clear();
			if (map !== undefined) { map.remove(); }
			
			//define dc-charts (the name-tag following the # is how you refer to these charts in html with id-tag)
			var mapChart = dc.leafletChoroplethChart('#map-chart');
			
			//////////////////////////
			// SETUP META VARIABLES //
			//////////////////////////

			//set up country metadata
			var country_name = $scope.genLookup_country_meta(d,'country_name');
			var country_level = $scope.genLookup_country_meta(d,'level' + $scope.admlevel + '_name');
			var country_zoom_min = $scope.genLookup_country_meta(d,'zoomlevel_min');
			var country_zoom_max = $scope.genLookup_country_meta(d,'zoomlevel_max');
			var country_default_metric = $scope.genLookup_country_meta(d,'default_metric');

			$scope.country_selection = country_name[$scope.country_code];
			var zoom_min = Number(country_zoom_min[$scope.country_code]); 
			var zoom_max = Number(country_zoom_max[$scope.country_code]); 
			$scope.inform_admlevel = Number($scope.genLookup_country_meta(d,'inform_admlevel')[$scope.country_code]);
			
			if (!$scope.directURLload) {
				if ($scope.metric === '') { 
					$scope.metric = country_default_metric[$scope.country_code]; 
				} else if (typeof(d.Rapportage[0][$scope.metric]) == 'undefined'){
					$scope.metric = 'population';
				};
			}
			if ($scope.admlevel === zoom_min) { 
				$scope.name_selection = country_name[$scope.country_code]; 
			}
			if (zoom_max - zoom_min < 2) {
				document.getElementById('level3').style.visibility = 'hidden'; 
			} else if (document.getElementById('level3')){
				document.getElementById('level3').style.visibility = 'visible'; 
			}			
			
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
			$scope.type_selection = ($scope.admlevel == zoom_min) ? 'Country' : $scope.genLookup_country_meta(d,'level' + ($scope.admlevel - 1) + '_name')[$scope.country_code];
			$scope.subtype_selection = $scope.genLookup_country_meta(d,'level' + $scope.admlevel + '_name')[$scope.country_code];
			
			//Changes to be able to show ALL lower-level districts, for now only applied to Malawi
			if (zoom_min == 1 || $scope.country_code == 'MWI' || $scope.country_code == 'MOZ') {
				if ($scope.admlevel == zoom_min) {
					$scope.levelB_selection = 'All ' + $scope.genLookup_country_meta(d,'level' + (zoom_min + 1) + '_name')[$scope.country_code]; //undefined;
					$scope.levelB_code = '';
					$scope.levelB_codes = [];
				} else if ($scope.admlevel < zoom_max && $scope.parent_codes.length > 0) { //$scope.levelB_selection == undefined) {
					$scope.levelB_selection = $scope.name_selection;
					//$scope.levelB_code = $scope.parent_code;
					$scope.levelB_codes = $scope.parent_codes;
				}
				if ($scope.admlevel < zoom_max) { 
					$scope.levelC_selection = $scope.parent_codes.length == 0 ? 'All ' + $scope.genLookup_country_meta(d,'level' + (zoom_min + 2) + '_name')[$scope.country_code]
																		: undefined;
					$scope.levelC_code = '';
				} else if ($scope.parent_codes.length > 0) {
					$scope.levelC_selection = $scope.name_selection;
					$scope.levelC_code = $scope.parent_code;
				}
			} else {
				if ($scope.admlevel == zoom_min) {
					$scope.levelB_selection = undefined;
					//$scope.levelB_code = '';
					$scope.levelB_codes = [];
				} else if ($scope.admlevel <= zoom_max && $scope.levelB_selection == undefined) {
					$scope.levelB_selection = $scope.name_selection;
					//$scope.levelB_code = $scope.parent_code;
					$scope.levelB_codes = $scope.parent_codes;
				}				
				$scope.levelC_selection = $scope.admlevel < zoom_max ? undefined : $scope.name_selection;
				$scope.levelC_code 		= $scope.admlevel < zoom_max ? '' : $scope.parent_code;
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
			
            //////////////////////
			// SETUP INDICATORS //
			//////////////////////
            
			$scope.tables = [];
			var j=0;
			for (var i=0; i < d.Metadata.length; i++) {
				var record = {};
				var record_temp = d.Metadata[i];
				if (record_temp.group !== 'admin') {
					record.id = 'data-table' + [i+1];
					record.name = record_temp.variable;
					record.group = record_temp.group;
					record.propertyPath = record_temp.agg_method === 'sum' ? 'value' : 'value.finalVal';
					record.dimension = undefined;
					record.weight_var = record_temp.weight_var;
					record.scorevar_name = record_temp.scorevar_name;
					record.view = record_temp.view_code;
					$scope.tables[j] = record;
					j=j+1;					
				}
			}
			//console.log($scope.tables);
			
            
			///////////////////////
			// CROSSFILTER SETUP //
			///////////////////////
			
			//var cf = crossfilter(d3.range(0, data.Districts.features.length));
			var cf = crossfilter(d.Rapportage);
			
			// The wheredimension returns the unique identifier of the geo area
			var whereDimension = cf.dimension(function(d) { return d.pcode; });
			
			// Create the groups for these two dimensions (i.e. sum the metric)
			var whereGroupSum = whereDimension.group().reduceSum(function(d) { return d[$scope.metric];});
			
			var cf_scores_metric = !meta_scorevar[$scope.metric] ? $scope.metric : meta_scorevar[$scope.metric];
			var whereGroupSum_scores = whereDimension.group().reduce(
				function(p,v) {p.count = v[cf_scores_metric] !== null ? p.count + 1 : p.count; p.sum = p.sum + v[cf_scores_metric]; return p; }, 
				function(p,v) {p.count = v[cf_scores_metric] !== null ? p.count - 1 : p.count; p.sum = p.sum - v[cf_scores_metric]; return p; }, 
				function() { return { count: 0, sum: 0 }; }
			);	
			
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
			for (i=0; i < $scope.tables.length; i++) {
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
					if (t.group == 'dpi') {
						keyvalue[key] = dec2Format(d.dpi[0][t.name]);
					} else if ($scope.admlevel == zoom_max && $scope.filters.length == 0 && !isNaN(d_prev[t.name])) {
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
		
			//Pool all values for all 0-10 score value together to determine quantile_range (so that quantile thresholds will not differ between indicators)
			if ($scope.admlevel == zoom_min || $scope.directURLload) {
				var quantile_range_scores = [];
				var j=0;
				for (i=0;i<d.Rapportage.length;i++) {
					Object.keys(d.Rapportage[i]).forEach(function(key,index) {
						if (meta_scorevar[key] && (d.Rapportage[i][meta_scorevar[key]] || d.Rapportage[i][meta_scorevar[key]] == 0)) {
							quantile_range_scores[j] = d.Rapportage[i][meta_scorevar[key]];
							j+=1;
						}
					});
				};
				quantile_range_scores.sort(function (a, b) {  return a - b;  });
				d.quantile_range_scores = quantile_range_scores;
				
				//Establish threshold-values for quantile-range (formula taken exactly from d3-library to mimic the way the thrsholds are established in the map, which happens automatically)
				var quantile = function(values,p) {
					var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
					return e ? v + e * (values[h] - v) : v;
				};
				var k = 0, q = 5;
				var thresholds = [];
				while (++k < q) thresholds[k - 1] = Math.round(quantile(quantile_range_scores, k / q)*100)/100;		
				d.thresholds = thresholds;
			}
			
			
			//Function for determining color of indicator-bars and -numbers in sidebar
			var high_med_low = function(ind,ind_score,group) {
				
				if (dimensions_scores[ind]) {
					if (group == 'dpi') {
						var width = 10 * (1 - d.dpi[0][ind]);
					} else if ($scope.admlevel == zoom_max && $scope.filters.length == 0 && !isNaN(d_prev[ind_score])) {
						var width = d_prev[ind_score];
					} else {
						var width = dimensions_scores[ind].top(1)[0].value.finalVal;
					}
					if (ind == 'dpi_score') {
						//This reflects that DPI < 0.1 is considered too low
						if (1-width/10<0.1) { return 'bad';} else {return 'good';};
					}
					
					//Assign categories to each value (categories relate through colors via CSS)
					if (isNaN(width)) {return 'notavailable';}
					else if (width < d.thresholds[0]) { return 'good';} 
					else if (width <= d.thresholds[1])  {return 'medium-good';}
					else if (width <= d.thresholds[2])  {return 'medium';}
					else if (width <= d.thresholds[3])  {return 'medium-bad';}
					else if (width > d.thresholds[3])  { return 'bad';} 
				}				
			};	

			$scope.createHTML = function(keyvalue) {
				
				var dpi_score = document.getElementById('dpi_score_main');
				if (dpi_score) {
					dpi_score.textContent = keyvalue.dpi_score;
					dpi_score.setAttribute('class','component-score ' + high_med_low('dpi_score','dpi_score','dpi'));					
				}
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
				var dpi = document.getElementById('dpi');
				var scores = document.getElementById('scores');
				var vulnerability = document.getElementById('vulnerability');
				var hazard = document.getElementById('hazard');
				var coping = document.getElementById('coping_capacity');
				var other = document.getElementById('other');
				if (general) {while (general.firstChild) { general.removeChild(general.firstChild); };}
				if (dpi) {while (dpi.firstChild) { dpi.removeChild(dpi.firstChild); };}
				if (scores) {while (scores.firstChild) { scores.removeChild(scores.firstChild); };}
				if (vulnerability) {while (vulnerability.firstChild) { vulnerability.removeChild(vulnerability.firstChild); };}
				if (hazard) {while (hazard.firstChild) { hazard.removeChild(hazard.firstChild); };}
				if (coping) {while (coping.firstChild) { coping.removeChild(coping.firstChild); };}
				if (other) {while (other.firstChild) { other.removeChild(other.firstChild); };}
				
				for (var i=0;i<$scope.tables.length;i++) {
					var record = $scope.tables[i];
                    					
                    if (!meta_icon[record.name]) {var icon = 'modules/dashboards/img/undefined.png';}
					else {var icon = 'modules/dashboards/img/'+meta_icon[record.name];}
					
					if (meta_unit[record.name] === 'null') {var unit = '';} else {var unit = meta_unit[record.name];}
					
					if (record.group === 'general') {
						
						var div = document.createElement('div');
						div.setAttribute('class','row profile-item');
						div.setAttribute('id','section-'+record.name);
						var parent = document.getElementById(record.group);
						parent.appendChild(div);
						var div0 = document.createElement('div');
						div0.setAttribute('class','col col-md-1 col-sm-1 col-xs-1');
						div.appendChild(div0);	
						var img = document.createElement('img');
						img.setAttribute('class','community-icon');
						img.setAttribute('src',icon);
						div0.appendChild(img);
						var div1 = document.createElement('div');
						div1.setAttribute('class','col col-md-5 col-sm-5 col-xs-5 general-component-label');
						div1.setAttribute('ng-click','map_coloring(\''+record.name+'\')');
						div1.innerHTML = meta_label[record.name];
						div.appendChild(div1);	
						$compile(div1)($scope);
						var div2 = document.createElement('div');
						div2.setAttribute('class','col col-md-5 col-sm-5 col-xs-5');
						div2.setAttribute('id',record.name);
						div2.innerHTML = keyvalue[record.name] + ' ' + unit;
						div.appendChild(div2);
						var div3 = document.createElement('div');
						div3.setAttribute('class','col col-md-1 col-sm-1 col-xs-1');
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
					
					} else if (record.group === 'other') {
						
						if ($scope.admlevel == zoom_max && $scope.filters.length == 0 && !isNaN(d_prev[record.scorevar_name])) {
							var width = d_prev[record.scorevar_name]*10;
						} else {
							var width = dimensions[record.name].top(1)[0].value.finalVal*10;
						}
						
						if (!($scope.predictions == 'no' && record.group == 'predictions') && !($scope.actuals == 'no' && record.group == 'damage') && !(($scope.predictions == 'no' || $scope.actuals == 'no') && record.group == 'pred_error')) {
							
							var div = document.createElement('div');
							div.setAttribute('class','component-section');
							div.setAttribute('id','section-'+record.name);
							var parent = document.getElementById(record.group);
							parent.appendChild(div);
							var div0 = document.createElement('div');
							div0.setAttribute('class','col-md-2 col-sm-2 col-xs-2');
							div.appendChild(div0);	
							var img1 = document.createElement('img');
							img1.setAttribute('style','height:20px');
							img1.setAttribute('src',icon);
							div0.appendChild(img1);
							var div1 = document.createElement('div');
							div1.setAttribute('class','col-md-9 col-sm-9 col-xs-9 component-label');
							div1.setAttribute('ng-click','map_coloring(\''+record.name+'\')');
							div1.innerHTML = meta_label[record.name];
							$compile(div1)($scope);
							div.appendChild(div1);	
							var div1a = document.createElement('div');
							div1a.setAttribute('class','component-score ' + high_med_low(record.name,record.scorevar_name));
							div1a.setAttribute('id',record.name);
							div1a.innerHTML = keyvalue[record.name] + ' ' + unit;
							div1.appendChild(div1a);
							var div3 = document.createElement('div');
							div3.setAttribute('class','col-md-1 col-sm-1 col-xs-1 no-padding');
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
					
					else if (record.group !== 'hide') {
						
						if (record.group == 'dpi') {
							var width = d.dpi[0][record.name]*100;
						} else if ($scope.admlevel == zoom_max && $scope.filters.length == 0 && !isNaN(d_prev[record.scorevar_name])) {
							var width = d_prev[record.scorevar_name]*10;
						} else {
							var width = dimensions_scores[record.name].top(1)[0].value.finalVal*10;
						}
						
						var div = document.createElement('div');
						div.setAttribute('class','component-section');
						div.setAttribute('id','section-'+record.name);
						var parent = document.getElementById(record.group);
						parent.appendChild(div);
						var div0 = document.createElement('div');
						div0.setAttribute('class','col-md-2 col-sm-2 col-xs-2');
						div.appendChild(div0);	
						var img1 = document.createElement('img');
						img1.setAttribute('style','height:20px');
						img1.setAttribute('src',icon);
						div0.appendChild(img1);
						var div1 = document.createElement('div');
						div1.setAttribute('class','col-md-4 col-sm-4 col-xs-4 component-label');
						if(record.group !== 'dpi') {div1.setAttribute('ng-click','map_coloring(\''+record.name+'\')');};
						div1.innerHTML = meta_label[record.name];
						$compile(div1)($scope);
						div.appendChild(div1);	
						var div1a = document.createElement('div');
						div1a.setAttribute('class','component-score ' + high_med_low(record.name,record.scorevar_name,record.group));
						div1a.setAttribute('id',record.name);
						div1a.innerHTML = keyvalue[record.name] + ' ' + unit;
						div1.appendChild(div1a);
						var div2 = document.createElement('div');
						div2.setAttribute('class','col-md-5 col-sm-5 col-xs-5');
						div.appendChild(div2);
						var div2a = document.createElement('div');
						div2a.setAttribute('class','component-scale');
						div2.appendChild(div2a);
						var div2a1 = document.createElement('div');
						div2a1.setAttribute('class','score-bar ' + high_med_low(record.name,record.scorevar_name,record.group));
						div2a1.setAttribute('id','bar-'+record.name);
						div2a1.setAttribute('style','width:'+ width + '%');
						div2a.appendChild(div2a1);
						var div3 = document.createElement('div');
						div3.setAttribute('class','col-md-1 col-sm-1 col-xs-1 no-padding');
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
			var section_id = document.getElementById('section-'+$scope.metric);
			if (section_id) {section_id.classList.add('section-active');}; 
						
			$scope.updateHTML = function(keyvalue) {
				
				var dpi_score = document.getElementById('dpi_score_main');
				if (dpi_score) {
					dpi_score.textContent = keyvalue.dpi_score;
					dpi_score.setAttribute('class','component-score ' + high_med_low('dpi_score','dpi_score','dpi'));					
				}
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
					
					if (meta_unit[record.name] === 'null') {var unit = '';} else {var unit = meta_unit[record.name];}
						
					if (record.group === 'general') {
						
						var div2 = document.getElementById(record.name);
						div2.innerHTML = keyvalue[record.name] + ' ' + unit;
					
					} else if (record.group === 'other') {
						
						if ($scope.admlevel == zoom_max && $scope.filters.length == 0 && !isNaN(d_prev[record.scorevar_name])) {
							var width = d_prev[record.scorevar_name]*10;
						} else {
							var width = dimensions[record.name].top(1)[0].value.finalVal*10;
						}
						
						if (!($scope.predictions == 'no' && record.group == 'predictions') && !($scope.actuals == 'no' && record.group == 'damage') && !(($scope.predictions == 'no' || $scope.actuals == 'no') && record.group == 'pred_error')) {

							var div1a = document.getElementById(record.name);
							div1a.setAttribute('class','component-score ' + high_med_low(record.name,record.scorevar_name));
							div1a.innerHTML = keyvalue[record.name] + ' ' + unit;
						}
						
					}
					
					else if (record.group !== 'hide') {
						
						if (record.group == 'dpi') {
							var width = d.dpi[0][record.name]*100;
						} else if ($scope.admlevel == zoom_max && $scope.filters.length == 0 && !isNaN(d_prev[record.scorevar_name])) {
							var width = d_prev[record.scorevar_name]*10;
						} else {
							var width = dimensions_scores[record.name].top(1)[0].value.finalVal*10;
						}
						
						var div1a = document.getElementById(record.name);
						div1a.setAttribute('class','component-score ' + high_med_low(record.name,record.scorevar_name,record.group));
						div1a.innerHTML = keyvalue[record.name] + ' ' + unit;
						var div2a1 = document.getElementById('bar-'+record.name);
						div2a1.setAttribute('class','score-bar ' + high_med_low(record.name,record.scorevar_name,record.group));
						div2a1.setAttribute('style','width:'+ width + '%');
					}
				}
			};
			
			
            
			/////////////////
			// COLOR SETUP //
			/////////////////
			
            //Define the range of all values for current metric (to be used for quantile coloring)
			//Define the color-quantiles based on this range
			$scope.mapchartColors = function() {
                var quantile_range = [];
                if (meta_scorevar[$scope.metric]) {
                    quantile_range = d.quantile_range_scores;
                } else {
                    for (i=0;i<d.Rapportage.length;i++) {
                        quantile_range[i] = !meta_scorevar[$scope.metric] ? d.Rapportage[i][$scope.metric] : d.Rapportage[i][meta_scorevar[$scope.metric]];
                        quantile_range.sort();
                    };
                };
                var colorDomain;
                if ($scope.view_code == 'CRA') {
                    if (!meta_scorevar[$scope.metric]) { 
                        colorDomain = $scope.quantileColorDomain_CRA_std; 
                    } else {
                        colorDomain = $scope.quantileColorDomain_CRA_scores;
                    }
                } else if ($scope.genLookup_meta(d,'group')[$scope.metric] == 'pred_error') {
                    colorDomain = $scope.quantileColorDomain_PI_error;
                } else {
                    colorDomain = $scope.quantileColorDomain_PI_std;
                }
                return d3.scale.quantile()
                        .domain(quantile_range)
                        .range(colorDomain);
			};
			var mapchartColors = $scope.mapchartColors();		
            
            
            
            /////////////////////
			// MAP CHART SETUP //
			/////////////////////
            
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
					return !d.count ? '#cccccc' : mapChart.colors()(d.sum);
				})
				.featureKeyAccessor(function(feature){
					return feature.properties.pcode;
				})
				.popup(function(d){
					if (!meta_scorevar[$scope.metric]){
						return lookup[d.key].concat(' - ',meta_label[$scope.metric],': ',currentFormat(d.value.sum), ' ',meta_unit[$scope.metric]);
					} else {
						return lookup[d.key].concat(' - ',meta_label[$scope.metric],' (0-10): ',dec2Format(d.value.sum));
					}
				})
				.renderPopup(true)
				.turnOnControls(true)
				.legend(dc.leafletLegend().position('topright'))
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
									$scope.value_popup_unit = $scope.replace_null(meta_unit[$scope.metric]);
									break;
								};
							}
							$scope.metric_label = meta_label[$scope.metric];
						})
						//In Firefox event is not a global variable >> Not figured out how to fix this, so gave the popup a fixed position in FF only
						if($(window).width() < 768) {
                                popup.style.left = '5px';	
                                popup.style.bottom = '5px';
                        } else if (typeof event !== 'undefined') {
							popup.style.left = Math.min($(window).width()-210,event.pageX) + 'px';	
							popup.style.top = Math.min($(window).height()-210,event.pageY) + 'px';
						} else {
                            popup.style.left = '390px';	
                            popup.style.top = '110px';
                        }
                        popup.style.visibility = 'visible';
                        if ($scope.admlevel < zoom_max && $scope.view_code !== 'PI') { document.getElementById('zoomin_icon').style.visibility = 'visible'; }
					} 
					mapfilters_length = $scope.filters.length;
					//Recalculate all community-profile figures
					var keyvalue = fill_keyvalues();
					$scope.updateHTML(keyvalue);
					document.getElementById('section-'+$scope.metric).classList.add('section-active'); //style = 'background:#4C8293;color:#ffffff';
					//let reset-button (dis)appear
					var resetbutton = document.getElementsByClassName('reset-button')[0];	
					if ($scope.filters.length > 0) {
						resetbutton.style.visibility = 'visible';
					} else {
						resetbutton.style.visibility = 'hidden';
					}
					
				})
			;
            
            /* $('.leaflet-interactive').on('click', function(e) {
                if (typeof event === 'undefined') {
                    e = e.originalEvent; 
                    var popup = document.getElementById('mapPopup');
                    popup.style.left = Math.min($(window).width()-210,e.pageX) + 'px';	
                    popup.style.top = Math.min($(window).height()-210,e.pageY) + 'px';
                    popup.style.visibility = 'visible';
                    if ($scope.admlevel < zoom_max && $scope.view_code !== 'PI') { document.getElementById('zoomin_icon').style.visibility = 'visible'; }
                }
            }); */			
            
		
				
			///////////////////////////
			// MAP RELATED FUNCTIONS //
			///////////////////////////
			
			$scope.zoom_in = function() {
				
				if ($scope.filters.length > 0 && $scope.admlevel < zoom_max) {
					$scope.admlevel = $scope.admlevel + 1;
					$scope.parent_code_prev = $scope.parent_code;
					$scope.name_selection_prev = $scope.name_selection;
					$scope.parent_codes = $scope.filters;
					$scope.name_selection = $scope.filters.length > 1 ? 'Multiple ' + $scope.genLookup_country_meta(d,'level' + ($scope.admlevel - 1) + '_name')[$scope.country_code]
																	  : lookup[$scope.parent_codes[0]]; //$scope.parent_code];
					if ($scope.admlevel == zoom_max) {
						for (var i=0;i<d.Rapportage.length;i++) {
							var record = d.Rapportage[i];
							if (record.pcode === $scope.filters[0]) {d_prev = record; break;}
						}
					}
					$scope.filters = [];
					$scope.reinitiate(d);
					document.getElementById('level' + ($scope.admlevel - zoom_min + 1)).setAttribute('class','btn btn-secondary btn-active');
					document.getElementById('mapPopup').style.visibility = 'hidden';
					document.getElementById('zoomin_icon').style.visibility = 'hidden';
					document.getElementsByClassName('reset-button')[0].style.visibility = 'hidden';
					mapfilters_length = 0;
				}
				
			}

			//Functions for zooming out
			$scope.zoom_out = function(dest_level) {
				var admlevel_old = $scope.admlevel;
				if (zoom_min == 1 || $scope.country_code == 'MWI' || $scope.country_code == 'MOZ') {
					if (dest_level === 1 && $scope.admlevel > zoom_min) {
						$scope.admlevel = zoom_min; 
						$scope.parent_codes = [];
						$scope.levelB_selection = 'All ' + $scope.genLookup_country_meta(d,'level' + (zoom_min + 1) + '_name')[$scope.country_code];
						$scope.reinitiate(d);
					} else if (dest_level === 2 && $scope.admlevel > zoom_min + 1) {
						$scope.admlevel = zoom_min + 1;
						$scope.parent_codes = $scope.levelB_codes;
						$scope.name_selection = $scope.name_selection_prev;
						$scope.levelC_selection = 'All ' + $scope.genLookup_country_meta(d,'level' + (zoom_min + 2) + '_name')[$scope.country_code];
						$scope.reinitiate(d);
					} else if (dest_level === 2 && $scope.admlevel < zoom_min + 1) {
						$scope.admlevel = zoom_min + 1;
						$scope.parent_codes = [];
						$scope.name_selection = $scope.levelB_selection;
						document.getElementById('level2').setAttribute('class','btn btn-secondary btn-active');		
						$scope.reinitiate(d);		
					} else if (dest_level === 3 && $scope.admlevel < zoom_min + 2 && $scope.parent_codes.length == 0) {
						$scope.admlevel = zoom_min + 2;
						$scope.parent_codes = [];
						$scope.name_selection = $scope.levelC_selection;
						document.getElementById('level2').setAttribute('class','btn btn-secondary btn-active');	
						document.getElementById('level3').setAttribute('class','btn btn-secondary btn-active');		
						$scope.reinitiate(d);		
					}
				} else {
					if (dest_level === 1 && $scope.admlevel > zoom_min) {
						$scope.admlevel = zoom_min; 
						$scope.parent_codes = [];
						$scope.reinitiate(d);
					} else if (dest_level === 2 && $scope.admlevel > zoom_min + 1) {
						$scope.admlevel = zoom_min + 1;
						$scope.parent_codes = $scope.levelB_codes;
						$scope.name_selection = $scope.name_selection_prev;
						$scope.reinitiate(d);
					}
				}
				
				while (admlevel_old - zoom_min > dest_level - 1) {
					document.getElementById('level' + (admlevel_old - zoom_min + 1)).setAttribute('class','btn btn-secondary');
					admlevel_old = admlevel_old-1;
				} 
				document.getElementById('mapPopup').style.visibility = 'hidden';
				document.getElementById('zoomin_icon').style.visibility = 'hidden';
			};

			$scope.map_coloring = function(id) {
				
				var section_id = document.getElementById('section-'+$scope.metric);
				if (section_id) {section_id.classList.remove('section-active');};
				$scope.metric = id;	
				$scope.metric_label = meta_label[id];
				var mapchartColors = $scope.mapchartColors();	
				whereGroupSum_scores.dispose();
				cf_scores_metric = !meta_scorevar[$scope.metric] ? $scope.metric : meta_scorevar[$scope.metric];
				whereGroupSum_scores = whereDimension.group().reduce(
					function(p,v) {p.count = v[cf_scores_metric] !== null ? p.count + 1 : p.count; p.sum = p.sum + v[cf_scores_metric]; return p; }, 
					function(p,v) {p.count = v[cf_scores_metric] !== null ? p.count - 1 : p.count; p.sum = p.sum - v[cf_scores_metric]; return p; }, 
					function() { return { count: 0, sum: 0 }; }
				);
				mapChart
					.group(whereGroupSum_scores)
					.colors(mapchartColors)
					.colorCalculator(function(d){
							return !d.count ? '#cccccc' : mapChart.colors()(d.sum);
					})
					.popup(function(d){
						if (!meta_scorevar[$scope.metric]){
							return lookup[d.key].concat(' - ',meta_label[$scope.metric],': ',currentFormat(d.value.sum), ' ',meta_unit[$scope.metric]);
						} else {
							return lookup[d.key].concat(' - ',meta_label[$scope.metric],' (0-10): ',dec2Format(d.value.sum));
						}
					})
					;
				dc.filterAll();
				dc.redrawAll();
				document.getElementById('mapPopup').style.visibility = 'hidden';
				document.getElementById('zoomin_icon').style.visibility = 'hidden';
				document.getElementById('section-'+id).classList.add('section-active');
			};
			
			//Go to tutorial
			$scope.tutorial = function() {
				if($scope.view_code = 'PI'){
					window.open('#!/#walkthrough_PI','_blank');
				} else {
					window.open('#!/#walkthrough','_blank');
				}
			}
			
			
			//Make sure that when opening another accordion-panel, the current one collapses
			var acc = document.getElementsByClassName('card-header level1');
			var panel = document.getElementsByClassName('collapse level1');
			var active = document.getElementsByClassName('collapse level1 in')[0];
			
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
				//var metric_old = $scope.metric;
				//$scope.metric = id;
				if (id !== 'admin') {$scope.metric_label = meta_label[id];};
				$scope.metric_label_popup = meta_label[id];
				$scope.metric_year = meta_year[id];
				$scope.metric_source = meta_source[id];
				$scope.metric_desc = meta_desc[id];
				if (!meta_icon[id]) {$scope.metric_icon = 'modules/dashboards/img/undefined.png';}
				else {$scope.metric_icon = 'modules/dashboards/img/' + meta_icon[id];}
				$('#infoModal').modal('show');
				//$scope.metric = metric_old;
			};
			
			//Export to GEOJSON
			$scope.export_geojson = function() {
				var myWindow = window.open('','','_blank');
				myWindow.document.write(JSON.stringify(d.Districts))
				myWindow.focus();
			}
			
			//Export to CSV function
			$scope.export_csv = function() {
				var content = d.Rapportage;

				var finalVal = '';
				
				for (var i = 0; i < content.length; i++) {
					var value = content[i];
					var key,innerValue,result;
					if (i === 0) {
						for (key in value) {
							if (value.hasOwnProperty(key)) {
								if (meta_label[key]) {innerValue = meta_label[key];}
								else if (meta_label[key.replace('_score','')]) {innerValue = meta_label[key.replace('_score','')] + ' (0-10)';}
								else {innerValue = key;};
								result = innerValue.replace(/"/g, '');
								if (result.search(/("|,|\n)/g) >= 0)
									result = '' + result + '';
								if (key !== 'name') finalVal += ';';
								finalVal += result;
							}
						}
					finalVal += '\n';	
					}

					for (key in value) { 
						if (value.hasOwnProperty(key)) {
							innerValue =  JSON.stringify(value[key]);
							result = innerValue.replace(/"/g, '');
							if (result.search(/("|,|\n)/g) >= 0)
								result = '' + result + '';
							if (key !== 'name') finalVal += ';';
							finalVal += result;
						}
					}

					finalVal += '\n';
				}
				
				var download = document.getElementById('download');
				download.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
				download.setAttribute('download','export.csv');
				//download.click();
			};
			
			//Create parameter-specific URL and show it in popup to copy
			function addParameterToURL(view,country,admlevel,metric,parent_codes,disaster_type,disaster_name){
				var _url = location.href;
				_url = _url.split('?')[0];
				_url += (_url.split('?')[1] ? '&':'?') + 'country='+country+'&admlevel='+admlevel+'&metric='+metric+'&parent_code='+parent_codes;
				//console.log(_url);
				return _url;
			}
			$scope.share_URL = function() {
				$scope.shareable_URL = addParameterToURL($scope.view_code,$scope.country_code,$scope.admlevel,$scope.metric,$scope.parent_codes,$scope.disaster_type,$scope.disaster_name);
				$('#URLModal').modal('show');
			}
            
            $scope.copyToClipboard = function(element) {
                var $temp = $("<input>");
                $("body").append($temp);
                $temp.val($(element).text()).select();
                document.execCommand("copy");
                $temp.remove();
            }
			
			
			
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
			
			var zoom_child = $('.leaflet-control-zoom')[0];
			var zoom_parent = $('.leaflet-bottom.leaflet-right')[0];
			zoom_parent.insertBefore(zoom_child,zoom_parent.childNodes[0])
			
			//Automatically fill country-dropdown menu
            //First sort country-items in right order
            var sort_by;
            (function() {
                // utility functions
                var default_cmp = function(a, b) {
                        if (a == b) return 0;
                        return a < b ? -1 : 1;
                    },
                    getCmpFunc = function(primer, reverse) {
                        var dfc = default_cmp, // closer in scope
                            cmp = default_cmp;
                        if (primer) {
                            cmp = function(a, b) {
                                return dfc(primer(a), primer(b));
                            };
                        }
                        if (reverse) {
                            return function(a, b) {
                                return -1 * cmp(a, b);
                            };
                        }
                        return cmp;
                    };
                // actual implementation
                sort_by = function() {
                    var fields = [],
                        n_fields = arguments.length,
                        field, name, reverse, cmp;

                    // preprocess sorting options
                    for (var i = 0; i < n_fields; i++) {
                        field = arguments[i];
                        if (typeof field === 'string') {
                            name = field;
                            cmp = default_cmp;
                        }
                        else {
                            name = field.name;
                            cmp = getCmpFunc(field.primer, field.reverse);
                        }
                        fields.push({
                            name: name,
                            cmp: cmp
                        });
                    }
                    // final comparison function
                    return function(A, B) {
                        var a, b, name, result;
                        for (var i = 0; i < n_fields; i++) {
                            result = 0;
                            field = fields[i];
                            name = field.name;

                            result = field.cmp(A[name], B[name]);
                            if (result !== 0) break;
                        }
                        return result;
                    }
                }
            }());
            d.Country_meta_full.sort(sort_by('format', {name:'country_code', reverse: false}));
                
            //Create HTML
            if ($scope.view_code == 'CRA') {
                var ul = document.getElementById('country-items');
                while (ul.childElementCount > 0) { ul.removeChild(ul.lastChild);};
                var formats = [];
                for (var i=0;i<d.Country_meta_full.length;i++) {
                    
                    var record = d.Country_meta_full[i];
                    
                    if (formats.indexOf(record.format) <= -1 && formats.length > 0) {
                        var li2 = document.createElement('li');
                        li2.setAttribute('class','divider');
                        ul.appendChild(li2);
                    }
                    var li = document.createElement('li');
                    ul.appendChild(li);
                    var a = document.createElement('a');
                    a.setAttribute('class','submenu-item');
                    a.setAttribute('ng-click','change_country(\'' + record.country_code + '\')');
                    a.setAttribute('role','button');
                    a.innerHTML = record.format == 'all' ? record.country_name : record.country_name + ' (' + record.format + ')';
                    $compile(a)($scope);
                    li.appendChild(a);
                    
                    formats.push(record.format);
                
                };
            }
            
			
			
		};
        
        // Function for handling sub-dropdown-menus in Navigation bar
		// $(document).ready(function(){
		  // $('.dropdown-submenu a.menu-item').on("click", function(e){
			// $('.submenu-items.open').toggle().removeClass('open');
			// $(this).next('ul').toggle().addClass('open');
			// e.stopPropagation();
			// e.preventDefault();
		  // });
		// });
        
        //Final CSS
        // $(".sidebar-wrapper").addClass("in");
        // $(document).ready(function () {
            // if($(window).width() < 768) {
               // $(".sidebar-wrapper").removeClass("in");
            // }
        // });
        
        
		


	}
])



;

