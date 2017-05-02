/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
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

(function () {
    'use strict';

    if (dc.baseGoogleChart) {
        return false;
    }

    dc.baseGoogleChart = function (_chart) {
        _chart = dc.baseMapChart(_chart);

        _chart._doRender = function () {
            var _map = new google.maps.Map(_chart.root().node(), _chart.mapOptions());

            if (_chart.center() && _chart.zoom()) {
                _map.setCenter(_chart.toLocArray(_chart.center()));
                _map.setZoom(_chart.zoom());
            }

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
            return new google.maps.LatLng(value[0], value[1]);
        };

        return _chart;
    };
})();

(function () {
    'use strict';

    if (dc.googleChoroplethChart) {
        return false;
    }

    dc.googleChoroplethChart = function (parent, chartGroup) {
        var _chart = dc.colorChart(dc.baseGoogleChart({}));

        var _dataMap = [];

        var _geojson = false;
        var _feature = false;
        var _featureOptions = {
            fillColor: 'black',
            color: 'gray',
            opacity: 0.4,
            fillOpacity: 0.6,
            weight: 1
        };
        var _infoWindow = null;

        var _featureKey = function (feature) {
            return feature.key;
        };

        var _featureStyle = function (feature) {
            var options = _chart.featureOptions();
            if (options instanceof Function) {
                options = options(feature);
            }
            options = JSON.parse(JSON.stringify(options));
            var v = _dataMap[_chart.featureKeyAccessor()(feature)];
            if (v && v.d) {
                options.fillColor = _chart.getColor(v.d, v.i);
                if (_chart.filters().indexOf(v.d.key) !== -1) {
                    options.opacity = 0.8;
                    options.fillOpacity = 1;
                }
            }
            return options;
        };

        _chart._postRender = function () {
            if (typeof _geojson === 'string') {
                _feature = _chart.map().data.loadGeoJson(_geojson);
            } else {
                _feature = _chart.map().data.addGeoJson(_geojson);
            }

            _chart.map().data.setStyle(_chart.featureStyle());
            processFeatures();
        };

        _chart._doRedraw = function () {
            _dataMap = [];
            _chart._computeOrderedGroups(_chart.data()).forEach(function (d, i) {
                _dataMap[_chart.keyAccessor()(d)] = {d: d, i: i};
            });
            _chart.map().data.setStyle(_chart.featureStyle());
        };

        _chart.geojson = function (_) {
            if (!arguments.length) {
                return _geojson;
            }

            _geojson = _;
            return _chart;
        };

        _chart.featureOptions = function (_) {
            if (!arguments.length) {
                return _featureOptions;
            }

            _featureOptions = _;
            return _chart;
        };

        _chart.featureKeyAccessor = function (_) {
            if (!arguments.length) {
                return _featureKey;
            }

            _featureKey = _;
            return _chart;
        };

        _chart.featureStyle = function (_) {
            if (!arguments.length) {
                return _featureStyle;
            }

            _featureStyle = _;
            return _chart;
        };

        var processFeatures = function (feature, layer) {
            if (_chart.renderPopup()) {
                _chart.map().data.addListener('click', function (event) {
                    var anchor = new google.maps.MVCObject(),
                        data = _dataMap[_chart.featureKeyAccessor()(event.feature)];

                    if (_infoWindow) {
                        _infoWindow.close();
                    }

                    if (!data) {
                        data = {};
                    }

                    if (!data.d) {
                        data.d = {};
                    }

                    _infoWindow = new google.maps.InfoWindow({
                        content: _chart.popup()(data.d, event.feature)
                    });

                    anchor.set('position', event.latLng);
                    _infoWindow.open(_chart.map(), anchor);
                });
            }

            if (_chart.brushOn()) {
                _chart.map().data.addListener('click', selectFilter);
            }
        };

        var selectFilter = function (event) {
            if (!event.feature) {
                return;
            }

            var filter = _chart.featureKeyAccessor()(event.feature);

            dc.events.trigger(function () {
                _chart.filter(filter);
                dc.redrawAll(_chart.chartGroup());
            });
        };

        return _chart.anchor(parent, chartGroup);
    };
})();

(function () {
    'use strict';

    if (dc.googleMarkerChart) {
        return false;
    }

    dc.googleMarkerChart = function (parent, chartGroup) {
        var _chart = dc.baseGoogleChart({});

        var _cluster = false; // requires js-marker-clusterer
        var _clusterOptions = false;
        var _rebuildMarkers = false;
        var _brushOn = true;
        var _filterByArea = false;
        var _fitOnRender = true;
        var _fitOnRedraw = false;
        var _disableFitOnRedraw = false;

        var _innerFilter = false;
        var _layerGroup = false;
        var _markerList = {};
        var _markerListFilterd = [];
        var _icon = false;
        var _infoWindow = null;
        var _zoom = null;

        _chart.renderTitle(true);

        var _location = function (d) {
            return _chart.keyAccessor()(d);
        };

        var _marker = function (d) {
            var marker = new google.maps.Marker({
                position: _chart.toLocArray(_chart.locationAccessor()(d)),
                map: _chart.map(),
                title: _chart.renderTitle() ? _chart.title()(d) : '',
                clickable: _chart.renderPopup() || (_chart.brushOn() && !_filterByArea),
                draggable: false
            });

            return marker;
        };

        _chart._postRender = function () {
            if (_chart.brushOn()) {
                if (_filterByArea) {
                    _chart.filterHandler(doFilterByArea);
                }

                google.maps.event.addListener(_chart.map(), 'zoom_changed', function () {
                    if (_chart.map().getZoom() !== _zoom) {
                        _zoom = _chart.map().getZoom();
                        zoomFilter('zoom');
                    }
                }, this);
                google.maps.event.addListener(_chart.map(), 'dragend', function () {
                    zoomFilter('drag');
                }, this);

                if (!_filterByArea) {
                    google.maps.event.addListener(_chart.map(), 'click', function () {
                        zoomFilter('click');
                    }, this);
                }

                // if (google.maps.drawing) {
                //     var drawingManager = new google.maps.drawing.DrawingManager({
                //         drawingControl: true,
                //         drawingControlOptions: {
                //             position: google.maps.ControlPosition.TOP_CENTER,
                //             drawingModes: [
                //                 google.maps.drawing.OverlayType.CIRCLE,
                //                 google.maps.drawing.OverlayType.POLYGON,
                //                 google.maps.drawing.OverlayType.RECTANGLE
                //             ]
                //         },
                //     });
                //
                //     drawingManager.setMap(_chart.map());
                //
                //     google.maps.event.addListener(drawingManager, 'overlaycomplete', function (OverlayCompleteEvent) {
                //         console.log(OverlayCompleteEvent.overlay);
                //     });
                // }
            }

            if (_cluster) {
                _layerGroup = new MarkerClusterer(_chart.map());
            }
        };

        _chart._doRedraw = function () {
            var groups = _chart._computeOrderedGroups(_chart.data()).filter(function (d) {
                return _chart.valueAccessor()(d) !== 0;
            });

            if (_rebuildMarkers) {
                _markerList = {};
            } else {
                for (var key in _markerList) {
                    _markerList[key].setVisible(false);
                }
            }

            if (_cluster) {
                _layerGroup.clearMarkers();
            }

            var addList = [];
            var featureGroup = [];
            var bounds = new google.maps.LatLngBounds();
            _markerListFilterd = [];

            groups.forEach(function (v) {
                var key = _chart.keyAccessor()(v);
                var marker = null;

                if (!_rebuildMarkers && key in _markerList) {
                    marker = _markerList[key];
                }

                if (v.value) {
                    if (marker === null) {
                        marker = createmarker(v, key);
                    } else {
                        marker.setVisible(true);
                    }

                    bounds.extend(marker.getPosition());
                    featureGroup.push(marker);

                    if (!_cluster) {
                        marker.setMap(_chart.map());
                    } else {
                        addList.push(marker);
                    }

                    _markerListFilterd.push(marker);
                } else {
                    if (marker !== null) {
                        marker.setVisible(false);
                    }
                }
            });

            if (_cluster && addList.length > 0) {
                _layerGroup.addMarkers(addList);

            }

            if (featureGroup.length) {
                if (_fitOnRender || (_fitOnRedraw && !_disableFitOnRedraw)) {
                    _chart.map().fitBounds(bounds);
                }
            }

            _disableFitOnRedraw = false;
            _fitOnRender = false;
        };

        _chart.destroy = function () {
            // clear markers and their events
            for (var marker in _markerList) {
                if (_markerList.hasOwnProperty(marker)) {
                    google.maps.event.clearInstanceListeners(_markerList[marker]);
                    _markerList[marker].setMap(null);
                    delete _markerList[marker];
                }
            }

            // clear map and it's events
            google.maps.event.clearInstanceListeners(_chart.map());
            _chart.map(null);
        };

        _chart.locationAccessor = function (_) {
            if (!arguments.length) {
                return _location;
            }

            _location =  _;
            return _chart;
        };

        _chart.marker = function (_) {
            if (!arguments.length) {
                return _marker;
            }

            _marker = _;
            return _chart;
        };

        _chart.icon = function (_) {
            if (!arguments.length) {
                return _icon;
            }

            _icon = _;
            return _chart;
        };

        _chart.cluster = function (_) {
            if (!arguments.length) {
                return _cluster;
            }

            _cluster = _;
            return _chart;
        };

        _chart.clusterOptions = function (_) {
            if (!arguments.length) {
                return _clusterOptions;
            }

            _clusterOptions = _;
            return _chart;
        };

        _chart.rebuildMarkers = function (_) {
            if (!arguments.length) {
                return _rebuildMarkers;
            }

            _rebuildMarkers = _;
            return _chart;
        };

        _chart.brushOn = function (_) {
            if (!arguments.length) {
                return _brushOn;
            }

            _brushOn = _;
            return _chart;
        };

        _chart.filterByArea = function (_) {
            if (!arguments.length) {
                return _filterByArea;
            }

            _filterByArea = _;
            return _chart;
        };

        _chart.fitOnRender = function (_) {
            if (!arguments.length) {
                return _fitOnRender;
            }

            _fitOnRender = _;
            return _chart;
        };

        _chart.fitOnRedraw = function (_) {
            if (!arguments.length) {
                return _fitOnRedraw;
            }

            _fitOnRedraw = _;
            return _chart;
        };

        _chart.markerGroup = function () {
            return _layerGroup;
        };

        _chart.markers = function (filtered) {
            if (filtered) {
                return _markerListFilterd;
            }

            return _markerList;
        };

        var createmarker = function (v, k) {
            var marker = _marker(v);
            marker.key = k;

            if (_chart.renderPopup()) {
                google.maps.event.addListener(marker, 'click', function () {
                    if (_infoWindow) {
                        _infoWindow.close();
                    }

                    _infoWindow = new google.maps.InfoWindow({
                        content: _chart.popup()(v, marker)
                    });

                    _infoWindow.open(_chart.map(), marker);
                });
            }

            if (_chart.brushOn() && !_filterByArea) {
                google.maps.event.addListener(marker, 'click', selectFilter);
            }

            _markerList[k] = marker;

            return marker;
        };

        var zoomFilter = function (type) {
            _disableFitOnRedraw = true;
            if (_filterByArea) {
                var filter;
                if (
                    _chart.map().getCenter().equals(_chart.toLocArray(_chart.center())) &&
                    _chart.map().getZoom() === _chart.zoom()
                ) {
                    filter = null;
                } else {
                    filter = _chart.map().getBounds();
                }

                dc.events.trigger(function () {
                    _chart.filter(null);

                    if (filter) {
                        _innerFilter = true;
                        _chart.filter(filter);
                        _innerFilter = false;
                    }

                    dc.redrawAll(_chart.chartGroup());
                });
            } else if (
                _chart.filter() &&
                (
                    type === 'click' ||
                    (
                        _chart.filter() in _markerList &&
                        !_chart.map().getBounds().contains(_markerList[_chart.filter()].getLatLng())
                    )
                )
            ) {
                dc.events.trigger(function () {
                    _chart.filter(null);
                    if (_chart.renderPopup()) {
                        _chart.map().closePopup();
                    }

                    dc.redrawAll(_chart.chartGroup());
                });
            }
        };

        var doFilterByArea = function (dimension, filters) {
            _disableFitOnRedraw = true;
            _chart.dimension().filter(null);

            if (filters && filters.length > 0) {
                _chart.dimension().filter(function (d) {
                    if (!(d in _markerList)) {
                        return false;
                    }
                    var locO = _markerList[d].position;
                    return locO && filters[0].contains(locO);
                });

                if (!_innerFilter && _chart.map().getBounds().toString !== filters[0].toString()) {
                    _chart.map().fitBounds(filters[0]);
                }
            }
        };

        var selectFilter = function (e) {
            if (!e.target) {
                return;
            }

            _disableFitOnRedraw = true;
            var filter = e.target.key;

            dc.events.trigger(function () {
                _chart.filter(filter);
                dc.redrawAll(_chart.chartGroup());
            });
        };

        return _chart.anchor(parent, chartGroup);
    };
})();

(function () {
    'use strict';

    if (dc.googleCustomChart) {
        return false;
    }

    dc.googleCustomChart = function (parent, chartGroup) {
        var _chart = dc.baseGoogleChart({});

        var _redrawItem = null;
        var _renderItem = null;

        _chart.renderTitle(true);

        _chart._postRender = function () {
            var data = _chart._computeOrderedGroups(_chart.data());

            data.forEach(function (d, i) {
                _chart.renderItem()(_chart, _chart.map(), d, i);
            });
        };

        _chart._doRedraw = function () {
            var data = _chart._computeOrderedGroups(_chart.data());

            var accessor = _chart.valueAccessor();

            data.forEach(function (d, i) {
                d.filtered = accessor(d) === 0;
                _chart.redrawItem()(_chart, _chart.map(), d, i);
            });
        };

        _chart.redrawItem = function (_) {
            if (!arguments.length) {
                return _redrawItem;
            }

            _redrawItem = _;
            return _chart;
        };

        _chart.renderItem = function (_) {
            if (!arguments.length) {
                return _renderItem;
            }

            _renderItem = _;
            return _chart;
        };

        return _chart.anchor(parent, chartGroup);
    };
})();
