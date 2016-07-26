(function () {
    'use strict';

    if (dc.baseMapChart) {
        return false;
    }

    dc.baseMapChart = function (_chart) {
        _chart = dc.baseChart(_chart);

        var _map;

        var _renderPopup = true;
        var _mapOptions = false;
        var _defaultCenter = false;
        var _defaultZoom = false;
        var _brushOn = false;

        var _tiles = function (map) {
            L.tileLayer(
                'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
                {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }
            ).addTo(map);
        };

        var _popup = function (d) {
            return _chart.title()(d);
        };

        _chart._doRender = function () {
            // abstract
        };

        _chart._postRender = function () {
            // abstract
        };

        _chart.toLocArray = function () {
            // abstract
        };

        _chart.mapOptions = function (_) {
            if (!arguments.length) {
                return _mapOptions;
            }

            _mapOptions = _;
            return _chart;
        };

        _chart.center = function (_) {
            if (!arguments.length) {
                return _defaultCenter;
            }

            _defaultCenter = _;
            return _chart;
        };

        _chart.zoom = function (_) {
            if (!arguments.length) {
                return _defaultZoom;
            }

            _defaultZoom = _;
            return _chart;
        };

        _chart.tiles = function (_) {
            if (!arguments.length) {
                return _tiles;
            }

            _tiles = _;
            return _chart;
        };

        _chart.map = function (_) {
            if (!arguments.length) {
                return _map;
            }

            _map = _;
            return _map;
        };

        _chart.popup = function (_) {
            if (!arguments.length) {
                return _popup;
            }

            _popup = _;
            return _chart;
        };

        _chart.renderPopup = function (_) {
            if (!arguments.length) {
                return _renderPopup;
            }

            _renderPopup = _;
            return _chart;
        };

        _chart.brushOn = function (_) {
            if (!arguments.length) {
                return _brushOn;
            }

            _brushOn = _;
            return _chart;
        };

        return _chart;
    };
})();
