'use strict';

angular.module('dashboards')
	.controller('DistrictDashboardsController', ['$scope', '$q', 'Authentication', 'Dashboards', 'Sources', '$window', '$stateParams', 'cfpLoadingBar', '_',
	function($scope, $q, Authentication, Dashboards, Sources, $window, $stateParams, cfpLoadingBar, _) {

		$scope.authentication = Authentication;
		$scope.geom = null;
		//Specify which metric is filling the row-chart when opening the dashboard
		$scope.metric = 'R2HaantalActief';

		$scope.config =  {
							whereFieldName:'districtcode',
							joinAttribute:'tdn_code',
							nameAttribute:'naam',
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
		  
			Dashboards.get({dashboardId: $stateParams.dashboardId},
			    function(data) {		
					// get the data
					$scope.prepare(data);
			    },
			    function(error) {
					console.log(error);
				//$scope.addAlert('danger', error.data.message);
			    });
				
					
		};  

		/**
		 * compare district report month by month
		 * dataset has 25 districts
		 * compare all properties except (DistrictNummer, District, Jaar, Maand, date)
		 * assumes that the data is in a ordered list, with each district in exactly the same position in the list every month
		 */
		$scope.compareMonthlyDistrictData = function(report){
			var size = 25;
			for(var i = 0; i < report.length; i++){
				for(var propt in report[i]){
					// Do not calculate for these properties
					if(['DistrictNummer', 'District', 'Jaar', 'Maand', 'date'].indexOf(propt) > -1){
						continue;
					}
					
					// skip the first batch as these cannot be compared to the previous month
					if(i < size){
						report[i][propt + 'Comparison'] = 0;
					}
					else {
						// Double check that we are comparing the right district
						if(report[i].District === report[i-size].District){
							report[i][propt + 'Comparison'] =  report[i][propt] - report[i-size][propt];
						}
						else {
							report[i][propt + 'Comparison'] = null;
						}
					}
				}
			}
			
			return report;
		};
		
		/**
		 * get the data from the files as defined in the config.
		 * load  them with ajax and if both are finished, generate the charts
		 */
		$scope.prepare = function(dashboard) {
		  // set the title
		  $scope.title = $scope.config.title;
				
		  // create the map chart (NOTE: this has to be done before the ajax call)
		  $scope.mapChartType = 'leafletChoroplethChart';	
		  
		  // The resp returns the data in another array, so use index 0 		  
		  var d = {};
		  $scope.geom = dashboard.sources.DistrictsLocal.data;
		
		  d.Districts = dashboard.sources.DistrictsLocal.data;
		  d.Rapportage = dashboard.sources.DistrictsRapportage.data;
		   
		  // turn month and day to date
		  d.Rapportage.forEach(function(d) {
				d.date = new Date(d.Jaar,d.Maand);
		  });
		  
		  // compare data between months for each district
		  d.Rapportage = $scope.compareMonthlyDistrictData(d.Rapportage);
					
		  $scope.generateCharts(d);
		  
		  // end loading bar
		  $scope.complete();	   

		};

		// fill the lookup table with the name attributes
		$scope.genLookup = function (){
			var lookup = {};
			$scope.geom.features.forEach(function(e){
				lookup[e.properties[$scope.config.joinAttribute]] = String(e.properties[$scope.config.nameAttribute]);
			});
			return lookup;
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
	
			//define dc-charts (the name-tag following the # is how you refer to these charts in html with id-tag)
			var districtChart = dc.rowChart('#row-chart');
			var mapChart = dc.leafletChoroplethChart('#map-chart');
						
			// get the lookup table
			var lookup = $scope.genLookup();
			
			// get month and year from last available in dataset
			var monthAccessor = function (d) { return d.Maand; };
			var yearAccessor = function (d) { return d.Jaar; };
			var monthExtent = d3.extent(d.Rapportage, monthAccessor);
			var yearExtent = d3.extent(d.Rapportage, yearAccessor);
			var maxMonth = monthExtent[1];
			var maxYear = yearExtent[1];
			
			/* create a crossfilter object from the data
			 * Data arrays are of same length
			 * tell crossfilter that  data is just a set of keys
			 * and then define your dimension and group functions to actually do the table lookup.
			 // Edit Jannis: I ended op including all the data in the crossfilter, because I ran into problems otherwise. 
			 // Edit Jannis: Maybe this make it a little bit slower, but not much
			 */
			 
			//var cf = crossfilter(d3.range(0, data.Districts.features.length));
			var cf = crossfilter(d.Rapportage);
		
			// The wheredimension returns the unique identifier of the geo area
			var whereDimension = cf.dimension(function(d) { return d.DistrictNummer; });
			// Create the same dimension again with another name for the row-chart, because two charts cannot have the same dimension
			var districtDimension = cf.dimension(function(d) { return d.DistrictNummer; });
			var monthDimension = cf.dimension(function(d) { return d.Maand; });
			var yearDimension = cf.dimension(function(d) { return d.Jaar; });
			
			// set the filters
			monthDimension.filter(maxMonth);
			yearDimension.filter(maxYear);
					
			// Create the groups for these two dimensions (i.e. sum the metric)
			var whereGroupSum = whereDimension.group().reduceSum(function(d) { return d.R2HaantalActief;});
			var districtGroupSum = districtDimension.group().reduceSum(function(d) { return d.R2HaantalActief;});
				
			// Create customized reduce-functions to be able to calculated percentages over all or multiple districts (i.e. the % of male volunteers))
			var reduceAddAvg = function(metric) {
				return function(p,v) {
					p.sumOfSub += v[metric];
					p.sumOfTotal += v.TotaalaantalVW;
					p.finalVal = p.sumOfSub / p.sumOfTotal;
					return p;
				};
			};
			var reduceRemoveAvg = function(metric) {
				return function(p,v) {
					p.sumOfSub -= v[metric];
					p.sumOfTotal -= v.TotaalaantalVW;
					p.finalVal = p.sumOfSub / p.sumOfTotal;
					return p;
				};
			};
			var reduceInitialAvg = function() {
				return {sumOfSub:0, sumOfTotal:0, finalVal:0 };
			}; 
			
			
			//All data-tables are not split up in dimensions. The metric is always the sum of all selected records. Therefore we create one total-dimension
			var totaalDim = cf.dimension(function(i) { return 'Totaal'; });

			//For this total-dimension we create a group for each metric to calculate the sum
			//For the age-groups and sex-groups, we calculate the number of volunteers as a percentage of total volunteers (with the custom reduce functions)
			var TotaalaantalVWGroup = totaalDim.group().reduceSum(function(d) {return d.TotaalaantalVW;});
			var VWinstroomGroup = totaalDim.group().reduceSum(function(d) {return d.VWinstroom;});
			var VWuitstroomGroup = totaalDim.group().reduceSum(function(d) {return d.VWuitstroom;});
			var LeeftijdOnbekendGroup = totaalDim.group().reduceSum(function(d) {return d.LeeftijdOnbekend;});
			var LeeftijdOnder18Group = totaalDim.group().reduce(reduceAddAvg('LeeftijdOnder18'),reduceRemoveAvg('LeeftijdOnder18'),reduceInitialAvg);
			var Leeftijd18tot30Group = totaalDim.group().reduce(reduceAddAvg('Leeftijd18tot30'),reduceRemoveAvg('Leeftijd18tot30'),reduceInitialAvg);
			var Leeftijd30tot50Group = totaalDim.group().reduce(reduceAddAvg('Leeftijd30tot50'),reduceRemoveAvg('Leeftijd30tot50'),reduceInitialAvg);
			var Leeftijd50tot65Group = totaalDim.group().reduce(reduceAddAvg('Leeftijd50tot65'),reduceRemoveAvg('Leeftijd50tot65'),reduceInitialAvg);
			var Leeftijd65tot85Group = totaalDim.group().reduce(reduceAddAvg('Leeftijd65tot85'),reduceRemoveAvg('Leeftijd65tot85'),reduceInitialAvg);
			var LeeftijdOnder85Group = totaalDim.group().reduce(reduceAddAvg('LeeftijdOnder85'),reduceRemoveAvg('LeeftijdOnder85'),reduceInitialAvg);
			var GeslachtManGroup = totaalDim.group().reduce(reduceAddAvg('GeslachtMan'),reduceRemoveAvg('GeslachtMan'),reduceInitialAvg);
			var GeslachtVrouwGroup = totaalDim.group().reduce(reduceAddAvg('GeslachtVrouw'),reduceRemoveAvg('GeslachtVrouw'),reduceInitialAvg);
			var GeslachtOnbekendGroup = totaalDim.group().reduce(reduceAddAvg('GeslachtOnbekend'),reduceRemoveAvg('GeslachtOnbekend'),reduceInitialAvg);
			var ALGaantalinwonersGroup = totaalDim.group().reduceSum(function(d) {return d.ALGaantalinwoners;});
			var ALGaantalgemeentenGroup = totaalDim.group().reduceSum(function(d) {return d.ALGaantalgemeenten;});
			var R2HaantalActiefGroup = totaalDim.group().reduceSum(function(d) {return d.R2HaantalActief;});
			var ALGaantalbestuursledenGroup = totaalDim.group().reduceSum(function(d) {return d.ALGaantalbestuursleden;});
			var NHTotaalGroup = totaalDim.group().reduceSum(function(d) {return d.NHTotaal;});
			var NHBZOGroup = totaalDim.group().reduceSum(function(d) {return d.NHBZO;});
			var NHEVHGroup = totaalDim.group().reduceSum(function(d) {return d.NHEVH;});
			var NHNHTGroup = totaalDim.group().reduceSum(function(d) {return d.NHNHT;});
			var NHOverigGroup = totaalDim.group().reduceSum(function(d) {return d.NHOverig;});
			var NHOverlapGroup = totaalDim.group().reduceSum(function(d) {return d.NHOverlap;});
			var NHBestuurGroup = totaalDim.group().reduceSum(function(d) {return d.NHBestuur;});
			var NHCoordinatorGroup = totaalDim.group().reduceSum(function(d) {return d.NHCoordinator;});
			var COMTotaalGroup = totaalDim.group().reduceSum(function(d) {return d.COMTotaal;});
			var COMBestuurGroup = totaalDim.group().reduceSum(function(d) {return d.COMBestuur;});
			var COMCoordinatorGroup = totaalDim.group().reduceSum(function(d) {return d.COMCoordinator;});
			var FWTotaalGroup = totaalDim.group().reduceSum(function(d) {return d.FWTotaal;});
			var FWBestuurGroup = totaalDim.group().reduceSum(function(d) {return d.FWBestuur;});
			var FWCoordinatorGroup = totaalDim.group().reduceSum(function(d) {return d.FWCoordinator;});
			var RHTotaalGroup = totaalDim.group().reduceSum(function(d) {return d.RHTotaal;});
			var RHBestuurGroup = totaalDim.group().reduceSum(function(d) {return d.RHBestuur;});
			var RHCoordinatorGroup = totaalDim.group().reduceSum(function(d) {return d.RHCoordinator;});
			var ZELFTotaalGroup = totaalDim.group().reduceSum(function(d) {return d.ZELFTotaal;});
			var ZELFBestuurGroup = totaalDim.group().reduceSum(function(d) {return d.ZELFBestuur;});
			var ZELFCoordinatorGroup = totaalDim.group().reduceSum(function(d) {return d.ZELFCoordinator;});

			// group with all, needed for data-count
			var all = cf.groupAll();

			// get the count of the number of rows in the dataset (total and filtered)
			dc.dataCount('#count-info')
					.dimension(cf)
					.group(all);
			
			//Define number formats for absolute numbers and for percentage metrics
			var numberFormat = d3.format(',');
			var numberFormatPerc = d3.format(',.1%');
			
			// set month selector
			d3.select('#yearselector')
				.on('change', function () {
						var year = Number(d3.select(this).property('value'));
						yearDimension.filter(year);
						dc.redrawAll();
					})
				
				.selectAll('option')
				.data(d3.map(d.Rapportage, function(da){return da.Jaar;}).keys())
				.enter().append('option')
				.property('selected', function(d) { return Number(d) === maxYear;})
				.text(function(d) { return d; })
				.attr('value',  function(d) { return d; });
				
			// set month selector
			d3.select('#monthselector')
				.on('change', function () {
						var month = Number(d3.select(this).property('value'));
						monthDimension.filter(month);
						dc.redrawAll();
					})
				
				.selectAll('option')
				.data(d3.map(d.Rapportage, function(da){return da.Maand;}).keys())
				.enter().append('option')
				.property('selected', function(d) { return Number(d) === maxMonth;})
				.text(function(d) { return d; })
				.attr('value',  function(d) { return d; });
				
			//Create the map-chart
			mapChart
				.width($('#map-chart').width())
				.height(360)
				.dimension(whereDimension)
				.group(whereGroupSum)
				.center([0,0])
				.zoom(0)    
				.geojson(d.Districts)
				.colors(['#CCCCCC', $scope.config.color])
				.colorDomain([0, 1])
				.colorAccessor(function (d) {if(d>0){return 1;} else {return 0;}})           
				.featureKeyAccessor(function(feature){
					return feature.properties.tdn_code;
				})
				.popup(function(d){
					return lookup[d.key];
				})
				.renderPopup(true)
				.turnOnControls(true)
				;
	
			//Create the row-chart 
			districtChart
				.width(350)
				.height(450)
				.margins({top: 0, left: 10, right: 50, bottom: 20})
				.dimension(districtDimension)
				.group(districtGroupSum)
				.colors(['#CCCCCC', $scope.config.color])
				.colorDomain([0, 1])
				.colorAccessor(function (d) {if(d.value > 0){return 1;} else {return 0;}})           
				.ordering(function(d) { return -d.value; })
				.label(function (d) { return lookup[d.key]; })
				.title(function (d) { return numberFormat(d.value); })
				.renderLabel(true)
				.renderTitleLabel(true)
				.titleLabelOffsetX(-50)
				.elasticX(true)
				.xAxis().ticks(4)
				;
			
			//Function that initiates ng-click event for changing the metric in the row-chart when clicking on a metric
			//It differentiates on type of metric (percentage or absolute count)
			$scope.go = function(id) {
			  $scope.metric = id;	
			  districtGroupSum.dispose();
			  if (id.indexOf('Leeftijd') >= 0 || id.indexOf('Geslacht') >= 0) {
			    districtGroupSum = districtDimension.group().reduce(reduceAddAvg(id),reduceRemoveAvg(id),reduceInitialAvg);
			    districtChart
					.group(districtGroupSum)
					.valueAccessor(function(d) {return d.value.finalVal;})
					.colorAccessor(function (d) {if(d.value.finalVal > 0){return 1;} else {return 0;}})            
					.ordering(function(d) { return -d.value.finalVal; })
					.title(function(d) { if (d.value.sumOfTotal === 0) {return 0;} else {return numberFormatPerc(d.value.finalVal);}});
			  } else {
			    districtGroupSum = districtDimension.group().reduceSum(function(d) { return d[id];});	
				districtChart
					.group(districtGroupSum)
					.valueAccessor(function(d) {return d.value;})
					.colorAccessor(function (d) {if(d.value > 0){return 1;} else {return 0;}})           
					.ordering(function(d) { return -d.value; })
					.title(function(d) {return numberFormat(d.value);});  
			  }
			  dc.filterAll();
			  dc.redrawAll();
			};
			
			//This is needed for changing the metric of the row-chart when using the carousel arrows
			//NOTE: this does not work yet at the moment
			$scope.go_left = function() {
				if ($('div.active').index() === 0) {$scope.go('ALGaantalinwoners');}
				else if ($('div.active').index() === 1) {$scope.go('R2HaantalActief');}
				else if ($('div.active').index() === 2) {$scope.go('NHTotaal');}
				else if ($('div.active').index() === 3) {$scope.go('FWTotaal');}
				else if ($('div.active').index() === 4) {$scope.go('RHTotaal');}
			};
			$scope.go_right = function() {
				if ($('div.active').index() === 3) {$scope.go('ALGaantalinwoners');}
				else if ($('div.active').index() === 4) {$scope.go('R2HaantalActief');}
				else if ($('div.active').index() === 0) {$scope.go('NHTotaal');}
				else if ($('div.active').index() === 1) {$scope.go('FWTotaal');}
				else if ($('div.active').index() === 2) {$scope.go('RHTotaal');}
			};
			
			var tables = [
							{id: '#data-table2', name: 'Aantal inwoners', datatype: 'number', group: 'algemeen', propertyPath: 'value', dimension: ALGaantalinwonersGroup},
							{id: '#data-table3', name: 'Aantal gemeenten', datatype: 'number', group: 'algemeen', propertyPath: 'value', dimension: ALGaantalgemeentenGroup},
							{id: '#data-table4', name: 'Aantal vrijwilligers', datatype: 'number', group: 'vrijwilligersmanagement', propertyPath: 'value', dimension: TotaalaantalVWGroup},
							{id: '#data-table5', name: 'Aantal Ready2Helpers', datatype: 'number', group: 'vrijwilligersmanagement', propertyPath: 'value', dimension: R2HaantalActiefGroup},
							{id: '#data-table6', name: 'Aantal bestuursleden', datatype: 'number', group: 'vrijwilligersmanagement', propertyPath: 'value', dimension: ALGaantalbestuursledenGroup},
							{id: '#data-table7', name: 'Mannen', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: GeslachtManGroup},
							{id: '#data-table8', name: 'Vrouwen', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: GeslachtVrouwGroup},
							{id: '#data-table9', name: 'Leeftijd: <18', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: LeeftijdOnder18Group},
							{id: '#data-table10', name: 'Leeftijd: 18-30', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: Leeftijd18tot30Group},
							{id: '#data-table11', name: 'Leeftijd: 30-50', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: Leeftijd30tot50Group},
							{id: '#data-table12', name: 'Leeftijd: 50-65', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: Leeftijd50tot65Group},
							{id: '#data-table13', name: 'Leeftijd: 65-85', datatype: 'percentage', group: 'vrijwilligersmanagement', propertyPath: 'value.finalVal', dimension: Leeftijd65tot85Group},
							{id: '#data-table14', name: 'Aantal vrijwilligers totaal', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHTotaalGroup},
							{id: '#data-table15', name: 'Aantal bestuursleden', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: ALGaantalbestuursledenGroup},
							{id: '#data-table16', name: 'Aantal coördinatoren', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHCoordinatorGroup},
							{id: '#data-table17', name: 'Aantal vrijwilligers BZO', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHBZOGroup},
							{id: '#data-table18', name: 'Aantal vrijwilligers EHV', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHEVHGroup},
							{id: '#data-table19', name: 'Aantal vrijwilliger NHT', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHNHTGroup},
							{id: '#data-table20', name: 'Aantal vrijwilligers overig', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHOverigGroup},
							{id: '#data-table21', name: 'Aantal overlap', datatype: 'number', group: 'noodhulp', propertyPath: 'value', dimension: NHOverlapGroup},
							{id: '#data-table22', name: 'Aantal vrijwilligers', datatype: 'number', group: 'fondsenwerving', propertyPath: 'value', dimension: FWTotaalGroup},
							{id: '#data-table23', name: 'Aantal bestuursleden', datatype: 'number', group: 'fondsenwerving', propertyPath: 'value', dimension: FWBestuurGroup},
							{id: '#data-table24', name: 'Aantal coördinatoren', datatype: 'number', group: 'fondsenwerving', propertyPath: 'value', dimension: FWCoordinatorGroup},
							{id: '#data-table25', name: 'Aantal vrijwilligers', datatype: 'number', group: 'communicatie', propertyPath: 'value', dimension: COMTotaalGroup},
							{id: '#data-table26', name: 'Aantal bestuursleden', datatype: 'number', group: 'communicatie', propertyPath: 'value', dimension: COMBestuurGroup},
							{id: '#data-table27', name: 'Aantal coördinatoren', datatype: 'number', group: 'communicatie', propertyPath: 'value', dimension: COMCoordinatorGroup},
							{id: '#data-table28', name: 'Aantal vrijwilligers', datatype: 'number', group: 'respect en hulpbereidheid', propertyPath: 'value', dimension: RHTotaalGroup},
							{id: '#data-table29', name: 'Aantal bestuursleden', datatype: 'number', group: 'respect en hulpbereidheid', propertyPath: 'value', dimension: RHBestuurGroup},
							{id: '#data-table30', name: 'Aantal coördinatoren', datatype: 'number', group: 'respect en hulpbereidheid', propertyPath: 'value', dimension: RHCoordinatorGroup},
							{id: '#data-table31', name: 'Aantal vrijwilligers', datatype: 'number', group: 'respect en hulpbereidheid', propertyPath: 'value', dimension: ZELFTotaalGroup},
							{id: '#data-table32', name: 'Aantal bestuursleden', datatype: 'number', group: 'respect en hulpbereidheid', propertyPath: 'value', dimension: ZELFBestuurGroup},
							{id: '#data-table33', name: 'Aantal coördinatoren', datatype: 'number', group: 'respect en hulpbereidheid', propertyPath: 'value', dimension: ZELFCoordinatorGroup}
	
						 ];
						 
			// create the data tables: because metrics are in columns in the data set and not in rows, we need one data-table per metric
			tables.forEach(function(t) {
				dc.dataTable(t.id)
						.dimension(t.dimension)                
						.group(function (i) {return ''; })
						.width(200)
						.columns([
									// name of variable
									function(d){return t.name;}, 
									// the value
									function(d){
										if(t.datatype === 'number'){
											return numberFormat($scope.deepFind(d, t.propertyPath));
										} else if(t.datatype === 'percentage'){
											return numberFormatPerc($scope.deepFind(d, t.propertyPath));
										}
									},
									// if the value is lower, equal or higher then the previous period
									function(d){
										return '';
									}
									
							])
						.order(d3.descending);
			});												
						
			//Render all dc-charts and -tables
			dc.renderAll();

			var map = mapChart.map();
			function zoomToGeom(geom){
				var bounds = d3.geo.bounds(geom);
				map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
			}
			zoomToGeom($scope.geom);
					
			
			
		};
	
	}
])

;
