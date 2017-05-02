/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
(function () {
    'use strict';

    var crossfilter = {};

    //------------------------
    // dimension
    //------------------------

    function _filterChanged () {
        var list = dc.chartRegistry.list();

        for (var e in list) {
            var chart = list[e];
            var group = chart.group();

            if (group) {
                group._filterChanged = true;
            }
        }
    }

    crossfilter.dimension = {};
    crossfilter.dimension.filter = _filterChanged;
    crossfilter.dimension.filterExact = _filterChanged;
    crossfilter.dimension.filterRange = _filterChanged;
    crossfilter.dimension.filterFunction = _filterChanged;
    crossfilter.dimension.filterAll = _filterChanged;

    //------------------------
    // group
    //------------------------

    function _fetchData () {
        var filters = dc.utils.getAllFilters();
        var list = dc.chartRegistry.list();

        for (var chartId in filters) {
            for (var x in list) {
                if (list[x].chartID() === parseInt(chartId, 10)) {
                    var chart = list[x];
                    var group = chart.group();

                    if (group && group._filterChanged) {
                        _fetch(group, chart, filters, chartId);
                        group._filterChanged = false;
                    }
                    break;
                }
            }
        }
    }

    function _fetch (group, chart, filters, chartId) {
        var dummyGroup = group;
        group.fetch(filters, chartId, function (data) {
            dummyGroup._currentData = data;
            chart.redraw();
        });
    }

    crossfilter.group = function (fetch) {
        return {
            _filterChanged: true,
            _currentData: [],
            all: function () {
                _fetchData();
                return this._currentData;
            },
            top: function (e) {
                _fetchData();
                return this._currentData;
            },
            fetch: fetch,
        };
    };

    //------------------------
    // quicksort
    //------------------------

    crossfilter.quicksort = {};
    crossfilter.quicksort.by = function (sort) {
        return function (data) {
            return data;
        };
    };

    window.crossfilterServer = crossfilter;

    if (!window.crossfilter) {
        window.crossfilter = crossfilter;
    }
})();
