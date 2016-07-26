(function () {
    'use strict';

    if (dc.baseLeafletChart) {
        return false;
    }

    dc.baseLeafletChart = function (_chart) {
        _chart = dc.baseMapChart(_chart);

        _chart._doRender = function () {
            var _map = L.map(_chart.root().node(), _chart.mapOptions());

            if (_chart.center() && _chart.zoom()) {
                _map.setView(_chart.toLocArray(_chart.center()), _chart.zoom());
            }

            _chart.tiles()(_map);

            _chart.map(_map);

            _chart._postRender();

            return _chart._doRedraw();
        };

        _chart.toLocArray = function (value) {
            if (typeof value === 'string') {
                // expects '11.111,1.111'
                value = value.split(',');
            }
            // else expects [11.111,1.111]
            return value;
        };

        return _chart;
    };
})();
