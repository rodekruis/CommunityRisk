/*!
 * dc-addons v0.12.0
 *
 * 2016-02-18 16:19:52
 *
 */
(function () {
    'use strict';

    angular.module('AngularDc', []);
})();

(function () {
    'use strict';

    var dcChart = function ($timeout, $compile) {
        return {
            restrict: 'E',
            scope: {
                chart: '=',
                type: '=',
                group: '=',
                options: '=',
                filters: '=',
                reset: '=',
            },
            link: function ($scope, element) {
                $scope.drawChart = function () {
                    var i;

                    if (typeof $scope.type === 'string' && typeof $scope.options === 'object') {
                        $scope.cleanup();

                        if ($scope.reset) {
                            $scope.resetChart = function () {
                                $scope.chart.filterAll();
                                dc.redrawAll();
                            };
                            element.append('<span class="reset" style="visibility:hidden;">Current filter: <span class="filter"></span></span>');
                            element.append($compile('<a class="reset" style="visibility:hidden;" ng-click="resetChart()">reset</a>')($scope));
                        }

                        $scope.chart = dc[$scope.type](element[0], $scope.group || undefined);

                        if ($scope.type === 'compositeChart') {
                            for (i = 0; i < $scope.options.compose.length; i++) {
                                if ($scope.options.compose[i].type && typeof $scope.options.compose[i].useRightYAxis !== 'function') {
                                    $scope.options.compose[i] =
                                        dc[$scope.options.compose[i].type]($scope.chart)
                                            .options($scope.options.compose[i]);
                                }
                            }
                        }

                        $scope.chart.options($scope.options);
                        $scope.chart.render();

                        if ($scope.filters) {
                            for (i = 0; i < $scope.filters.length; i++) {
                                $scope.chart.filter($scope.filters[i]);
                            }
                        }

                        // set the model for custom use
                        $scope.chart = $scope.chart;

                        $scope.resize();
                    }
                };

                $scope.resize = function () {
                    try {
                        if ($scope.chart.data().length > 0) {
                            $scope.chart.root().select('svg').attr('width', '100%');
                            $timeout(function () {
                                if ($scope.chart.hasOwnProperty('rescale')) {
                                    $scope.chart.rescale();
                                }
                                dc.redrawAll();
                            }, 100);
                        }
                    } catch (err) {

                    }
                };

                $scope.cleanup = function () {
                    if ($scope.chart) {
                        if ($scope.chart && $scope.chart.destroy) {
                            $scope.chart.destroy();
                        }

                        dc.deregisterChart($scope.chart);
                    }
                };

                //--------------------
                // watchers
                //--------------------

                $scope.$watch('type', function () {
                    if ($scope.type) {
                        $scope.drawChart();
                    }
                });

                $scope.$watch('options', function () {
                    if ($scope.options) {
                        $scope.drawChart();
                    }
                });

                $scope.$watch('filters', function () {
                    if ($scope.filters) {
                        $scope.drawChart();
                    }
                });

                //--------------------
                // destroy
                //--------------------

                $scope.$on('$destroy', function () {
                    $scope.cleanup();
                });
            }
        };
    };

    dcChart.$inject = ['$timeout', '$compile'];

    angular.module('AngularDc').directive('dcChart', dcChart);

})();

(function () {
    'use strict';

    var dcServerChart = function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                conditions: '=',
            },
            link: function ($scope, element) {
                var chart = dc.serverChart(element[0]),
                    hasInit = false;

                $scope.$watch('options', function () {
                    if (!hasInit && $scope.options) {
                        chart.options($scope.options).render();
                        hasInit = true;
                    }
                });

                $scope.$watch('conditions', function () {
                    if ($scope.conditions) {
                        chart.conditions($scope.conditions);
                    }
                });
            }
        };
    };

    dcServerChart.$inject = [];

    angular.module('AngularDc').directive('dcServerChart', dcServerChart);

})();
