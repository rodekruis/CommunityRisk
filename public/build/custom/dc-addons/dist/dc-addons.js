/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
if (!dc.utils.getAllFilters) {
    dc.utils.getAllFilters = function () {
        var result = {};
        var list = dc.chartRegistry.list();

        for (var e in list) {
            var chart = list[e];
            result[chart.chartID()] = chart.filters();
        }

        return result;
    };
}

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

(function () {
    'use strict';

    if (dc.leafletChoroplethChart) {
        return false;
    }

    dc.leafletChoroplethChart = function (parent, chartGroup) {
        var _chart = dc.colorChart(dc.baseLeafletChart({}));

        var _geojsonLayer = false;
        var _dataMap = [];

        var _geojson = false;
        var _featureOptions = {
            fillColor: 'black',
            color: 'gray',
            opacity: 0.4,
            fillOpacity: 0.6,
            weight: 1
        };

        var _featureKey = function (feature) {
            return feature.key;
        };

        var _featureStyle = function (feature) {
            var v = _dataMap[_chart.featureKeyAccessor()(feature)];

            var options = _chart.featureOptions();
            var optionsIsFunction = options instanceof Function;

            if (optionsIsFunction) {
                options = options(feature, v);
            }
            options = JSON.parse(JSON.stringify(options));

            if (v && v.d && !optionsIsFunction) {
                options.fillColor = _chart.getColor(v.d, v.i);
                if (_chart.filters().indexOf(v.d.key) !== -1) {
                    options.opacity = 0.8;
                    options.fillOpacity = 1;
                }
            }
            return options;
        };

        _chart._postRender = function () {
            _geojsonLayer = L.geoJson(_chart.geojson(), {
                style: _chart.featureStyle(),
                onEachFeature: processFeatures
            });
            _chart.map().addLayer(_geojsonLayer);
        };

        _chart._doRedraw = function () {
            _geojsonLayer.clearLayers();
            _dataMap = [];
            _chart._computeOrderedGroups(_chart.data()).forEach(function (d, i) {
                _dataMap[_chart.keyAccessor()(d)] = {d: d, i: i};
            });
            _geojsonLayer.addData(_chart.geojson());
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
            var v = _dataMap[_chart.featureKeyAccessor()(feature)];
            if (v && v.d) {
                layer.key = v.d.key;

                if (_chart.renderPopup()) {
                    layer.bindPopup(_chart.popup()(v.d, feature));
                }

                if (_chart.brushOn()) {
                    layer.on('click', selectFilter);
                }
            }
        };

        var selectFilter = function (e) {
            if (!e.target) {
                return;
            }

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

    if (dc.leafletMarkerChart) {
        return false;
    }

    dc.leafletMarkerChart = function (parent, chartGroup) {
        var _chart = dc.baseLeafletChart({});

        var _cluster = false; // requires leaflet.markerCluster
        var _clusterOptions = false;
        var _rebuildMarkers = false;
        var _brushOn = true;
        var _filterByArea = false;

        var _innerFilter = false;
        var _zooming = false;
        var _layerGroup = false;
        var _markerList = {};

        var _fitOnRender = true;
        var _fitOnRedraw = false;
        var _disableFitOnRedraw = false;

        var _renderPopup = true;
        var _popupOnHover = false;

        _chart.renderTitle(true);

        var _location = function (d) {
            return _chart.keyAccessor()(d);
        };

        var _marker = function (d) {
            var marker = new L.Marker(_chart.toLocArray(_chart.locationAccessor()(d)),{
                title: _chart.renderTitle() ? _chart.title()(d) : '',
                alt: _chart.renderTitle() ? _chart.title()(d) : '',
                icon: _icon(d, _chart.map()),
                clickable: _chart.renderPopup() || (_chart.brushOn() && !_filterByArea),
                draggable: false
            });
            return marker;
        };

        var _icon = function (d,map) {
            return new L.Icon.Default();
        };

        var _popup = function (d,marker) {
            return _chart.title()(d);
        };

        _chart._postRender = function () {
            if (_chart.brushOn()) {
                if (_filterByArea) {
                    _chart.filterHandler(doFilterByArea);
                }

                _chart.map().on('zoomend moveend', zoomFilter, this);
                if (!_filterByArea) {
                    _chart.map().on('click', zoomFilter, this);
                }
                _chart.map().on('zoomstart', zoomStart, this);
            }

            if (_cluster) {
                _layerGroup = new L.MarkerClusterGroup(_clusterOptions ? _clusterOptions : null);
            }
            else {
                _layerGroup = new L.LayerGroup();
            }
            _chart.map().addLayer(_layerGroup);
        };

        _chart._doRedraw = function () {
            var groups = _chart._computeOrderedGroups(_chart.data()).filter(function (d) {
                return _chart.valueAccessor()(d) !== 0;
            });

            if (_rebuildMarkers) {
                _markerList = {};
            }
            _layerGroup.clearLayers();

            var addList = [];
            groups.forEach(function (v,i) {
                var key = _chart.keyAccessor()(v);
                var marker = null;
                if (!_rebuildMarkers && key in _markerList) {
                    marker = _markerList[key];
                }
                else {
                    marker = createmarker(v,key);
                }

                var curFilters = _chart.filters();
                var markerOpacity = curFilters.length ? 0.3 : 1.0;
                curFilters.forEach(function (filter) {
                    if (key === filter) {
                        markerOpacity = 1.0;
                    }
                });
                marker.setOpacity(markerOpacity);

                if (!_chart.cluster()) {
                    _layerGroup.addLayer(marker);
                }
                else {
                    addList.push(marker);
                }
            });

            if (_chart.cluster() && addList.length > 0) {
                _layerGroup.addLayers(addList);
            }

            if (addList.length > 0) {
                if (_fitOnRender || (_fitOnRedraw && !_disableFitOnRedraw)) {
                    var featureGroup = new L.featureGroup(addList);
                    _chart.map().fitBounds(featureGroup.getBounds());//.pad(0.5));
                }
            }

            _disableFitOnRedraw = false;
            _fitOnRender = false;
        };

        _chart.locationAccessor = function (_) {
            if (!arguments.length) {
                return _location;
            }
            _location = _;
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

        _chart.popupOnHover = function (_) {
            if (!arguments.length) {
                return _popupOnHover;
            }
            _popupOnHover = _;
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

        var createmarker = function (v,k) {
            var marker = _marker(v);
            marker.key = k;
            if (_chart.renderPopup()) {
                marker.bindPopup(_chart.popup()(v,marker));

                if (_chart.popupOnHover()) {
                    marker.on('mouseover', function () {
                        marker.openPopup();
                    });

                    marker.on('mouseout', function () {
                        marker.closePopup();
                    });
                }
            }

            if (_chart.brushOn() && !_filterByArea) {
                marker.on('click',selectFilter);
            }
            _markerList[k] = marker;
            return marker;
        };

        var zoomStart = function (e) {
            _zooming = true;
        };

        var zoomFilter = function (e) {
            if (e.type === 'moveend' && (_zooming || e.hard)) {
                return;
            }
            _zooming = false;

            _disableFitOnRedraw = true;

            if (_filterByArea) {
                var filter;
                if (_chart.map().getCenter().equals(_chart.center()) && _chart.map().getZoom() === _chart.zoom()) {
                    filter = null;
                }
                else {
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
            } else if (_chart.filter() && (e.type === 'click' ||
                                           (_markerList.hasOwnProperty(_chart.filter()) &&
                                            !_chart.map().getBounds().contains(_markerList[_chart.filter()].getLatLng())))) {
                dc.events.trigger(function () {
                    _chart.filter(null);
                    if (_renderPopup) {
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
                _chart.dimension().filterFunction(function (d) {
                    if (!(d in _markerList)) {
                        return false;
                    }
                    var locO = _markerList[d].getLatLng();
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

    if (dc.leafletCustomChart) {
        return false;
    }

    dc.leafletCustomChart = function (parent, chartGroup) {
        var _chart = dc.baseLeafletChart({});

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

//Legend code adapted from http://leafletjs.com/examples/choropleth.html
dc.leafletLegend = function () {
    var _parent, _legend = {};
    var _leafletLegend = null;
    var _position = 'bottomleft';

    _legend.parent = function (parent) {
        if (!arguments.length) {
            return _parent;
        }
        _parent = parent;
        return this;
    };

    var _LegendClass = function () {
        return L.Control.extend({
            options: {position: _position},
            onAdd: function (map) {
                this._div = L.DomUtil.create('div', 'info legend');
                map.on('moveend',this._update,this);
                this._update();
                return this._div;
            },
            _update: function () {
                if (_parent.colorDomain()) { // check because undefined for marker charts
                    var minValue = _parent.colorDomain()[0],
                        maxValue = _parent.colorDomain()[1],
                        palette = _parent.colors().range(),
                        colorLength = _parent.colors().range().length,
                        delta = (maxValue - minValue) / colorLength,
                        i;

                    // define grades for legend colours
                    // based on equation in dc.js colorCalculator (before version based on colorMixin)
                    var grades = [];
                    grades[0] = Math.round(minValue);
                    for (i = 1; i < colorLength; i++) {
                        grades[i] = Math.round((0.5 + (i - 1)) * delta + minValue);
                    }

                    // var div = L.DomUtil.create('div', 'info legend');
                    // loop through our density intervals and generate a label with a colored
                    // square for each interval
                    this._div.innerHTML = ''; //reset so that legend is not plotted multiple times
                    for (i = 0; i < grades.length; i++) {
                        this._div.innerHTML +=
                            '<i style="background:' + palette[i] + '"></i> ' +
                            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
                    }
                }
            }
        });
    };

    _legend.LegendClass = function (LegendClass) {
        if (!arguments.length) {
            return _LegendClass;
        }

        _LegendClass = LegendClass;
        return _legend;
    };

    _legend.render = function () {
        // unfortunately the dc.js legend has no concept of redraw, it's always render
        if (!_leafletLegend) {
            // fetch the legend class creator, invoke it
            var Legend = _legend.LegendClass()();
            // and constuct that class
            _leafletLegend = new Legend();
            _leafletLegend.addTo(_parent.map());
        }

        return _legend.redraw();
    };

    _legend.redraw = function () {
        _leafletLegend._update();
        return _legend;
    };

    _legend.leafletLegend = function () {
        return _leafletLegend;
    };

    _legend.position = function (position) {
        if (!arguments.length) {
            return _position;
        }
        _position = position;
        return _legend;
    };

    return _legend;
};

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

(function () {
    'use strict';

    if (dc.tooltipMixin) {
        return false;
    }

    dc.tooltipMixin = function (_chart) {

        if (_chart) {
            _chart.tip = {};
            _chart.tip.tooltip = null;

            _chart.tip.init = function () {
                if (_chart.tip.tooltip === null) {
                    var wrapper = _chart.svg().selectAll('g.sub'); // if the chart has sub grouping (e.g. composite or series)

                    // if no sub grouping then just use the chart svg
                    if (wrapper.empty()) {
                        wrapper = _chart.svg();
                    }

                    // get all elements that want a tooltip
                    _chart.tip.elements = wrapper.selectAll('rect.bar,circle.dot,g.pie-slice,circle.bubble,g.row rect');

                    // nothing to tip so exit
                    if (_chart.tip.elements.empty()) {
                        return false;
                    }

                    // create the tip object
                    _chart.tip.tooltip = d3.tip()
                        .attr('class', 'tip')
                        .html(function (d, i, subI) {
                            var title = _chart.title();

                            // if the chart is a composite chart
                            if (_chart.children) {
                                title = _chart.children()[subI].title();
                            }

                            // if the chart is a paired row chart
                            if (typeof title !== 'function') {
                                title = title[subI];
                            }

                            // if a stackable chart
                            if (_chart.stack) {
                                title = _chart.title(d.layer);
                            }

                            var data = d;
                            if (d.data) {
                                data = d.data;
                            }

                            return title(data);
                        });

                    _chart.tip.tooltip.offset([-10, 0]);

                    // add the tip to the elements
                    _chart.tip.elements.call(_chart.tip.tooltip);
                    _chart.tip.elements.on('mouseover', _chart.tip.tooltip.show).on('mouseleave', _chart.tip.tooltip.hide);

                    // remove standard tooltips
                    _chart.tip.elements.each(function () {
                        var el = d3.select(this);
                        var title = el.select('title');

                        if (title.empty()) {
                            return false;
                        }

                        el.attr('data-title', title.text());
                        title.remove();
                    });
                }

                return _chart;
            };

            _chart.tip.destroy = function () {
                if (_chart.tip.tooltip !== null) {
                    _chart.tip.elements.on('mouseover', null).on('mouseleave', null); // remove mouse events
                    _chart.tip.tooltip.destroy(); // destroy the tip
                    _chart.tip.tooltip = null; // and set it to null

                    // add the standard tooltips back in
                    _chart.tip.elements.each(function () {
                        var el = d3.select(this);
                        el.append('title').text(el.attr('data-title'));
                    });
                }

                return _chart;
            };

            _chart.tip.reinit = function () {
                _chart.tip.destroy();
                _chart.tip.init();
            };

            _chart.tip.init();
        }

        return _chart;
    };
})();

// Code copied and changed from https://github.com/vlandham/gates_bubbles

(function () {
    'use strict';

    if (dc.bubbleCloud) {
        return false;
    }

    dc.bubbleCloud = function (parent, chartGroup) {
        var _chart = dc.bubbleMixin(dc.capMixin(dc.bubbleChart(parent)));

        var LAYOUT_GRAVITY = 0.2;
        var RADIUS_TRANSITION = 1500;
        var FRICTION = 0.25;
        var PADDING = 5;

        var _force = null;
        var _circles = [];
        var _g = null;
        var _gs = null;

        _chart._doRender = function () {
            _chart.resetSvg();

            _g = _chart.svg().append('g');

            _circles = [];

            drawChart();

            return _chart;
        };

        _chart._doRedraw = function () {
            drawChart();

            return _chart;
        };

        function drawChart() {

            if (_chart.elasticRadius()) {
                _chart.r().domain([_chart.rMin(), _chart.rMax()]);
            }

            _chart.r().range([_chart.MIN_RADIUS, _chart.xAxisLength() * _chart.maxBubbleRelativeSize()]);

            if (_circles.length === 0) {
                createBubbles();
            } else {
                updateBubbles();
            }

            highlightFilter();

            _force = d3.layout.force()
                .nodes(_chart.data())
                .size([_chart.width(), _chart.height()]);

            _force
                .gravity(LAYOUT_GRAVITY)
                .charge(charge)
                .friction(FRICTION)
                .on('tick', function (e) {
                    _circles
                        .each(moveTowardsCenter(e.alpha))
                        .attr('cx', function (d) {
                            if (d.x && d.y) {
                                d3.select(this.parentNode).attr('transform', 'translate(' + d.x + ',' + d.y + ')');
                            }
                            // return d.x;
                            return 0;
                        })
                        .attr('cy', function (d) {
                            // return d.y;
                            return 0;
                        });
                });

            _force.start();
        }

        function createBubbles() {
            _gs = _g
                .selectAll('g')
                .data(_chart.data())
                .enter()
                .append('g')
                .attr('class', _chart.BUBBLE_NODE_CLASS);

            _circles = _gs
                .append('circle')
                .attr('class', _chart.BUBBLE_CLASS)
                .attr('r', 0)
                .attr('fill-opacity', 1)
                .attr('fill', function (d, i) {
                    return _chart.getColor(d, i);
                })
                .attr('stroke-width', 2)
                .on('click', _chart.onClick)
                .on('mouseenter', function (d, i) {
                    d3.select(this).attr('stroke', '#303030');
                })
                .on('mouseout', function (d, i) {
                    d3.select(this).attr('stroke', 'none');
                });

            _chart._doRenderLabel(_gs);
            _chart._doRenderTitles(_gs);

            _circles.transition().duration(RADIUS_TRANSITION).attr('r', function (d) {
                d.radius = _chart.bubbleR(d);
                return d.radius;
            });
        }

        function updateBubbles() {
            _circles.data(_chart.data())
                .attr('r', function (d) {
                    d.radius = _chart.bubbleR(d);
                    return d.radius;
                });

            _chart.doUpdateLabels(_gs);
            _chart.doUpdateTitles(_gs);
        }

        function moveTowardsCenter(alpha) {
            var quadtree = d3.geom.quadtree(_chart.data());

            return function (d) {
                var r = d.radius + d3.max(_chart.data().map(function (d) { return d.radius; })) + PADDING,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;

                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.point.radius + PADDING;

                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }

                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        function charge(d) {
            return -Math.pow(d.radius, 2.0) / 8;
        }

        function highlightFilter() {
            if (_chart.hasFilter()) {
                _gs.each(function (d) {
                    if (_chart.hasFilter(_chart.keyAccessor()(d))) {
                        _chart.highlightSelected(this);
                    } else {
                        _chart.fadeDeselected(this);
                    }
                });
            } else {
                _gs.each(function () {
                    _chart.resetHighlight(this);
                });
            }
        }

        return _chart.anchor(parent, chartGroup);
    };
})();

(function () {
    'use strict';

    if (dc.pairedRowChart) {
        return false;
    }

    /**
    ## Paired Row Chart
    Includes: [Cap Mixin](#cap-mixin), [Margin Mixin](#margin-mixin), [Color Mixin](#color-mixin), [Base Mixin](#base-mixin)

    Concrete paired row chart implementation.
    #### dc.pairedRowChart(parent[, chartGroup])
    Create a paired row chart instance and attach it to the given parent element.

    Parameters:

    * parent : string | node | selection - any valid
     [d3 single selector](https://github.com/mbostock/d3/wiki/Selections#selecting-elements) specifying
     a dom block element such as a div; or a dom element or d3 selection.

    * chartGroup : string (optional) - name of the chart group this chart instance should be placed in.
     Interaction with a chart will only trigger events and redraws within the chart's group.

    Returns:
    A newly created paired row chart instance

    ```js
    // create a paired row chart under #chart-container1 element using the default global chart group
    var chart1 = dc.pairedRowChart('#chart-container1');
    // create a paired row chart under #chart-container2 element using chart group A
    var chart2 = dc.pairedRowChart('#chart-container2', 'chartGroupA');
    ```
    **/
    dc.pairedRowChart = function (parent, chartGroup) {
        var _chart = dc.capMixin(dc.marginMixin(dc.colorMixin(dc.baseMixin({}))));

        var _leftChartWrapper = d3.select(parent).append('div');
        var _rightChartWrapper = d3.select(parent).append('div');

        var _leftChart = dc.rowChart(_leftChartWrapper[0][0], chartGroup);
        var _rightChart = dc.rowChart(_rightChartWrapper[0][0], chartGroup);

        if (_leftChart.useRightYAxis) {
            _leftChart.useRightYAxis(true);
        }

        // data filtering

        // we need a way to know which data belongs on the left chart and which data belongs on the right
        var _leftKeyFilter = function (d) {
            return d.key[0];
        };

        var _rightKeyFilter = function (d) {
            return d.key[0];
        };

        /**
        #### .leftKeyFilter([value]) - **mandatory**
        Set or get the left key filter attribute of a chart.

        For example
        function (d) {
            return d.key[0] === 'Male';
        }

        If a value is given, then it will be used as the new left key filter. If no value is specified then
        the current left key filter will be returned.

        **/
        _chart.leftKeyFilter = function (_) {
            if (!arguments.length) {
                return _leftKeyFilter;
            }

            _leftKeyFilter = _;
            return _chart;
        };

        /**
        #### .rightKeyFilter([value]) - **mandatory**
        Set or get the right key filter attribute of a chart.

        For example
        function (d) {
            return d.key[0] === 'Female';
        }

        If a value is given, then it will be used as the new right key filter. If no value is specified then
        the current right key filter will be returned.

        **/
        _chart.rightKeyFilter = function (_) {
            if (!arguments.length) {
                return _rightKeyFilter;
            }

            _rightKeyFilter = _;
            return _chart;
        };

        // when trying to get the data for the left chart then filter all data using the leftKeyFilter function
        _leftChart.data(function (data) {
            var cap = _leftChart.cap(),
                d = data.all().filter(function (d) {
                return _chart.leftKeyFilter()(d);
            });

            if (cap === Infinity) {
                return d;
            }

            return d.slice(0, cap);
        });

        // when trying to get the data for the right chart then filter all data using the rightKeyFilter function
        _rightChart.data(function (data) {
            var cap = _rightChart.cap(),
                d = data.all().filter(function (d) {
                return _chart.rightKeyFilter()(d);
            });

            if (cap === Infinity) {
                return d;
            }

            return d.slice(0, cap);
        });

        // chart filtering
        // on clicking either chart then filter both

        _leftChart.onClick = _rightChart.onClick = function (d) {
            var filter = _leftChart.keyAccessor()(d);
            dc.events.trigger(function () {
                _leftChart.filter(filter);
                _rightChart.filter(filter);
                _leftChart.redrawGroup();
            });
        };

        // width and margins

        // the margins between the charts need to be set to 0 so that they sit together
        var _margins = _chart.margins(); // get the default margins
        _margins.right = _margins.left;

        _chart.margins = function (_) {
            if (!arguments.length) {
                return _margins;
            }
            _margins = _;

            // set left chart margins
            _leftChart.margins({
                top: _.top,
                right: 0,
                bottom: _.bottom,
                left: _.left,
            });

            // set right chart margins
            _rightChart.margins({
                top: _.top,
                right: _.right,
                bottom: _.bottom,
                left: 0,
            });

            return _chart;
        };

        _chart.margins(_margins); // set the new margins

        // the width needs to be halved
        var _width = 0; // get the default width

        _chart.width = function (_) {
            if (!arguments.length) {
                return _width;
            }
            _width = _;

            // set left chart width
            _leftChart.width(dc.utils.isNumber(_) ? _ / 2 : _);

            // set right chart width
            _rightChart.width(dc.utils.isNumber(_) ? _ / 2 : _);

            return _chart;
        };

        // the minWidth needs to be halved
        var _minWidth = _chart.minWidth(); // get the default minWidth

        _chart.minWidth = function (_) {
            if (!arguments.length) {
                return _minWidth;
            }
            _minWidth = _;

            // set left chart minWidth
            _leftChart.minWidth(dc.utils.isNumber(_) ? _ / 2 : _);

            // set right chart minWidth
            _rightChart.minWidth(dc.utils.isNumber(_) ? _ / 2 : _);

            return _chart;
        };

        _chart.minWidth(_minWidth); // set the new minWidth

        // svg
        // return an array of both the sub chart svgs

        _chart.svg = function () {
            return d3.selectAll([_leftChart.svg()[0][0], _rightChart.svg()[0][0]]);
        };

        // data - we need to make sure that the extent is the same for both charts

        // this way we need a new function that is overridable
        if (_leftChart.calculateAxisScaleData) {
            _leftChart.calculateAxisScaleData = _rightChart.calculateAxisScaleData = function () {
                return _leftChart.data().concat(_rightChart.data());
            };
        // this way we can use the current dc.js library but we can't use elasticX
        } else {
            _chart.group = function (_) {
                if (!arguments.length) {
                    return _leftChart.group();
                }
                _leftChart.group(_);
                _rightChart.group(_);

                // set the new x axis scale
                var extent = d3.extent(_.all(), _chart.cappedValueAccessor);
                if (extent[0] > 0) {
                    extent[0] = 0;
                }
                _leftChart.x(d3.scale.linear().domain(extent).range([_leftChart.effectiveWidth(), 0]));
                _rightChart.x(d3.scale.linear().domain(extent).range([0, _rightChart.effectiveWidth()]));

                return _chart;
            };
        }

        // get the charts - mainly used for testing
        _chart.leftChart = function () {
            return _leftChart;
        };

        _chart.rightChart = function () {
            return _rightChart;
        };

        // functions that we just want to pass on to both sub charts

        var _getterSetterPassOn = [
            // display
            'height', 'minHeight', 'renderTitleLabel', 'fixedBarHeight', 'gap', 'othersLabel',
            'transitionDuration', 'label', 'renderLabel', 'title', 'renderTitle', 'chartGroup', 'legend',
            //colors
            'colors', 'ordinalColors', 'linearColors', 'colorAccessor', 'colorDomain', 'getColor', 'colorCalculator',
            // x axis
            'x', 'elasticX', 'valueAccessor', 'labelOffsetX', 'titleLabelOffsetx', 'xAxis',
            // y axis
            'keyAccessor', 'labelOffsetY', 'yAxis',
            // data
            'cap', 'ordering' , 'dimension', 'group', 'othersGrouper', 'data'
        ];

        function addGetterSetterfunction (functionName) {
            _chart[functionName] = function (_) {
                if (!arguments.length) {
                    return [_leftChart[functionName](), _rightChart[functionName]()];
                }
                _leftChart[functionName](_);
                _rightChart[functionName](_);
                return _chart;
            };
        }

        for (var i = 0; i < _getterSetterPassOn.length; i++) {
            addGetterSetterfunction (_getterSetterPassOn[i]);
        }

        var _passOnFunctions = [
            '_doRedraw', 'redraw', '_doRender', 'render', 'calculateColorDomain', 'filterAll', 'resetSvg', 'expireCache'
        ];

        function addPassOnFunctions(functionName) {
            _chart[functionName] = function () {
                _leftChart[functionName]();
                _rightChart[functionName]();
                return _chart;
            };
        }

        for (i = 0; i < _passOnFunctions.length; i++) {
            addPassOnFunctions(_passOnFunctions[i]);
        }

        return _chart.anchor(parent, chartGroup);
    };
})();

(function () {
    'use strict';

    if (dc.serverChart) {
        return false;
    }

    if (!('dc' in window)) {
        window.dc = {};
    }

    dc.serverChart = function (parent) {
        var _chart = {},
            socket = null,
            hasInit = false,
            connected = false,
            element = d3.select(parent),
            _options = {
                name: null,
                server: 'http://127.0.0.1:3000/',
                errorMessage: 'A problem occurred creating the charts. Please try again later',
                loadingMessage: 'Loading',
                reconnectingMessage: 'There appears to be a problem connecting to the server. Retyring...',
                connectionErrorMessage: 'Could not connect to the server.',
            },
            _conditions = null,
            mouseDownCoords = null,
            east = null,
            west = null,
            prevEast = null,
            prevWest = null,
            extentMouse = false,
            resizeEastMouse = false,
            resizeWestMouse = false,
            chartWrapperClass = '.dc-server-chart';

        //---------------------
        // Browser Events
        //---------------------

        function attachEvents () {
            element.selectAll(chartWrapperClass).each(function (chartData, chartIndex) {
                var chartWrapper = d3.select(this),
                    chartType = getChartType(chartWrapper);

                if (typeof dc.serverChart['attachEvents' + chartType] === 'function') {
                    dc.serverChart['attachEvents' + chartType](chartIndex, chartWrapper);
                }
            });
        }

        dc.serverChart.attachEventsBarChart  = function (chartIndex, chartWrapper) {
            chartWrapper
                .selectAll('rect.bar')
                .on('click', function (barData, barIndex) {
                    sendFilter(chartIndex, barIndex);
                });

            attachEventsBrush(chartIndex, chartWrapper);
        };

        dc.serverChart.attachEventsPieChart = function (chartIndex, chartWrapper) {
            chartWrapper
                .selectAll('g.pie-slice')
                .on('click', function (sliceData, sliceIndex) {
                    sendFilter(chartIndex, sliceIndex);
                });
        };

        dc.serverChart.attachEventsRowChart = function (chartIndex, chartWrapper) {
            chartWrapper
                .selectAll('rect')
                .on('click', function (rowData, rowIndex) {
                    sendFilter(chartIndex, rowIndex);
                });
        };

        dc.serverChart.attachEventsPairedRowChart = function (chartIndex, chartWrapper) {
            chartWrapper
                .selectAll('svg')
                .selectAll('rect')
                .on('click', function (rowData, rowIndex, svgIndex) {
                    sendFilter(chartIndex, rowIndex * 2 - svgIndex);
                });
        };

        dc.serverChart.attachEventsLineChart = function (chartIndex, chartWrapper) {
            chartWrapper
                .selectAll('circle.dot')
                .on('mousemove', function () {
                    var dot = d3.select(this);
                    dot.style('fill-opacity', 0.8);
                    dot.style('stroke-opacity', 0.8);
                })
                .on('mouseout', function () {
                    var dot = d3.select(this);
                    dot.style('fill-opacity', 0.01);
                    dot.style('stroke-opacity', 0.01);
                });

            attachEventsBrush(chartIndex, chartWrapper);
        };

        function attachEventsBrush(chartIndex, chartWrapper) {
            if (chartWrapper.select('g.brush').size() > 0) {
                var maxEast = chartWrapper
                    .select('g.brush')
                    .select('.background')
                    .attr('width');

                chartWrapper
                    .select('g.brush')
                    .on('mousedown', function () {
                        mouseDownCoords = d3.mouse(this);
                        prevWest = west;
                        prevEast = east;
                    })
                    .on('mousemove', function () {
                        if (mouseDownCoords !== null) {
                            var coords = d3.mouse(this),
                                el = d3.select(this),
                                tmp = null;

                            if (extentMouse) {
                                var diff = coords[0] - mouseDownCoords[0];

                                west = prevWest + diff;
                                east = prevEast + diff;

                                if (west < 0) {
                                    west = 0;
                                    east = prevEast - prevWest;
                                }

                                if (east > maxEast) {
                                    east = maxEast;
                                    west = maxEast - (prevEast - prevWest);
                                }

                            } else if (resizeEastMouse) {
                                west = west;
                                east = coords[0];

                                if (east < west) {
                                    tmp = west;
                                    west = east;
                                    east = tmp;
                                    resizeEastMouse = false;
                                    resizeWestMouse = true;
                                }

                                if (west < 0) {
                                    west = 0;
                                }

                                if (east > maxEast) {
                                    east = maxEast;
                                }
                            } else if (resizeWestMouse) {
                                west = coords[0];
                                east = east;

                                if (east < west) {
                                    tmp = west;
                                    west = east;
                                    east = tmp;
                                    resizeEastMouse = true;
                                    resizeWestMouse = false;
                                }

                                if (west < 0) {
                                    west = 0;
                                }

                                if (east > maxEast) {
                                    east = maxEast;
                                }
                            } else {
                                west = d3.min([coords[0], mouseDownCoords[0]]);
                                east = d3.max([coords[0], mouseDownCoords[0]]);

                                if (west < 0) {
                                    west = 0;
                                }

                                if (east > maxEast) {
                                    east = maxEast;
                                }
                            }

                            el
                                .select('.extent')
                                .attr('x', west)
                                .attr('width', east - west);

                            el
                                .selectAll('g.resize')
                                .style('display', 'inline');

                            el
                                .select('g.resize.e')
                                .attr('transform', 'translate(' + east + ', 0)');

                            el
                                .select('g.resize.w')
                                .attr('transform', 'translate(' + west + ', 0)');
                        }
                    })
                    .on('mouseup', function () {
                        var coords = d3.mouse(this),
                            el = d3.select(this);

                        if (mouseDownCoords === null || coords[0] === mouseDownCoords[0]) {
                            el
                                .select('.extent')
                                .attr('width', 0);

                            el
                                .selectAll('g.resize')
                                .style('display', 'none');

                            sendFilter(chartIndex, [null, null]);
                        } else {
                            // somehow calculate what was selected
                            sendFilter(chartIndex, [west, east]);
                        }

                        mouseDownCoords = null;
                    });

                chartWrapper
                    .select('g.brush')
                    .select('.extent')
                    .on('mousedown', function () {
                        extentMouse = true;
                    })
                    .on('mouseup', function () {
                        extentMouse = false;
                    });

                chartWrapper
                    .select('g.brush')
                    .select('g.resize.e')
                    .on('mousedown', function () {
                        resizeEastMouse = true;
                    })
                    .on('mouseup', function () {
                        resizeEastMouse = false;
                    });

                chartWrapper
                    .select('g.brush')
                    .select('g.resize.w')
                    .on('mousedown', function () {
                        resizeWestMouse = true;
                    })
                    .on('mouseup', function () {
                        resizeWestMouse = false;
                    });
            }
        }

        //---------------------
        // Chart Events
        //---------------------

        _chart.render = function () {
            init();
            sendRender();
            return _chart;
        };

        _chart.options = function (_) {
            if (arguments.length === 0) {
                return _options;
            }

            for (var key in _) {
                if (_.hasOwnProperty(key)) {
                    _options[key] = _[key];
                }
            }

            return _chart;
        };

        _chart.conditions = function (_) {
            if (arguments.length === 0) {
                return _conditions;
            }

            _conditions = _;
            updateConditions();

            return _chart;
        };

        //---------------------
        // Socket Events
        //---------------------

        function sendFilter (chartIndex, index) {
            socket.emit('filter', [chartIndex, index]);
        }

        function sendRender () {
            onRefresh();

            if (!_options.name) {
                throw Error('Name is a required option');
            }

            socket.emit('render', _options.name);
        }

        function preRender (charts) {
            element.selectAll('*').remove();

            for (var i = 0; i < charts.length; i++) {
                element
                    .append('div')
                    .style('width', charts[i].width + 'px')
                    .style('height', charts[i].height + 'px')
                    .style('float', 'left')
                    .style('text-align', 'center')
                    .style('line-height', charts[i].height + 'px')
                    .html(_options.loadingMessage);

            }
        }

        function render (response) {
            element.html(response);
            attachEvents();
        }

        function renderError (response) {
            element.html(_options.errorMessage);
            console.warn(response);
        }

        function redraw (response) {
            var next = document.createElement('div');
            next.innerHTML = response;
            next = d3.select(next);

            element.selectAll(chartWrapperClass).each(function (el, chartIndex) {
                var chartWrapper = d3.select(this),
                    nextWrapper = next.selectAll(chartWrapperClass).filter(function (d, j) {
                        return j === chartIndex;
                    }),
                    chartType = getChartType(chartWrapper);

                if (chartType) {
                    if (typeof dc.serverChart['redraw' + chartType] === 'function') {
                        dc.serverChart['redraw' + chartType](chartIndex, chartWrapper, nextWrapper);
                    } else {
                        chartWrapper.html(nextWrapper.html());
                        attachEvents();
                    }
                }
            });
        }

        function updateConditions () {
            if (hasInit) {
                socket.emit('updateConditions', _conditions);
            }
        }

        //---------------------
        // Helper Functions
        //---------------------

        function onRefresh () {
            element.html(_options.loadingMessage);
        }

        function init () {
            socket = io(_options.server, {
                reconnectionDelay: 500,
                reconnectionDelayMax: 2000,
                reconnectionAttempts: 4,
            });

            // socket events
            socket.io.on('open', function () {
                connected = true;
            });

            socket.io.on('reconnecting', function () {
                if (!connected) {
                    element.html(_options.reconnectingMessage);
                }
            });

            socket.io.on('reconnect_failed', function () {
                if (!connected) {
                    element.html(_options.connectionErrorMessage);
                }
            });

            // custom events
            socket.on('preRender', preRender);
            socket.on('afterRender', render);
            socket.on('afterRenderError', renderError);
            socket.on('afterFilter', redraw);
            socket.on('afterFilterError', renderError);

            hasInit = true;
        }

        function getChartType (chartWrapper) {
            try {
                var chartType = chartWrapper.attr('data-type').split('');
                chartType[0] = chartType[0].toUpperCase();
                return chartType.join('');
            } catch (ex) {
                return null;
            }
        }

        //---------------------
        // Init
        //---------------------

        onRefresh();

        return _chart;
    };

})();

(function () {
    'use strict';

    if (dc.serverChart.redrawPieChart) {
        return false;
    }

    var duration = 5000;
    var ease = 'quad-in-out';
    var pieRegEx = new RegExp([
        'M ?([\\d\\.e-]+) ?, ?([\\d\\.e-]+) ?', // move to starting point
        // see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Arcs
        'A ?', // start arc
            '[\\d\\.e-]+ ?, ?[\\d\\.e-]+ ?,? ', // arc x radius and y radius
            '\\d ,? ?', // arc x-axis-rotation
            '\\d ?,? ?', // arc large-arc-flag
            '\\d ?,? ?', // arc sweep-flag
            '([\\d\\.e-]+) ?,? ?([\\d\\.e-]+) ?', // arc finishing points
        'L ?([\\d\\.e-]+) ?,? ?([\\d\\.e-]+)', // draw line too
        'Z', // close off
    ].join(''));

    dc.serverChart.redrawPieChart = function (chartIndex, chartWrapper, nextWrapper) {
        var svg = chartWrapper.select('svg'),
            currentSlices = chartWrapper.selectAll('g.pie-slice'),
            nextSlices = nextWrapper.selectAll('g.pie-slice');

        chartWrapper
            .select('g')
            .attr('class', nextWrapper.select('g').attr('class'));

        chartWrapper
            .selectAll('text')
            .each(function (textData, textIndex) {
                var textElement = d3.select(this),
                    nextText = filterNextItem(nextWrapper.selectAll('text'), textIndex);

                if (nextText.empty()) {
                    textElement
                        .text('');
                } else {
                    textElement
                        .text(nextText.text())
                        .transition()
                            .duration(duration)
                            .ease(ease)
                            .attr('transform', nextText.attr('transform'));
                }
            });

        currentSlices
            .each(function (sliceData, sliceIndex) {
                var sliceElement = d3.select(this),
                    nextSlice = filterNextItem(nextSlices, sliceIndex);

                if (!nextSlice.empty()) {
                    sliceElement
                        .attr('class', nextSlice.attr('class'));

                    var nextText = nextSlice.select('text');

                    if (!nextText.empty()) {
                        sliceElement
                            .select('title')
                            .text(nextText.text());
                    }
                }
            });

        currentSlices
            .select('path')
            .each(function (sliceData, sliceIndex) {
                var sliceElement = d3.select(this),
                    nextSlice = filterNextItem(nextSlices, sliceIndex).select('path');

                if (!nextSlice.empty()) {
                    sliceElement
                        .attr('class', nextSlice.attr('class'))
                        .attr('fill', nextSlice.attr('fill'));
                }
            })
            .transition()
                .duration(duration)
                .ease(ease)
                .attrTween('d', function (pathData, pathIndex, attrValue) {
                    var radius = d3.min([svg.attr('width'), svg.attr('height')]) / 2,
                        arc = d3.svg.arc().outerRadius(radius).innerRadius(0),
                        nextSlice = filterNextItem(nextSlices, pathIndex),
                        nextD = '';

                    if (!nextSlice.empty()) {
                        nextD = nextSlice.select('path').attr('d');
                    }

                    var interpolate = d3.interpolate(
                            pathToInterpolateAngles(attrValue),
                            pathToInterpolateAngles(nextD)
                        );

                    return function (t) {
                        return arc(interpolate(t));
                    };
                });
    };

    dc.serverChart.redrawBarChart = function (chartIndex, chartWrapper, nextWrapper) {
        var currentBars = chartWrapper.selectAll('rect.bar'),
            nextBars = nextWrapper.selectAll('rect.bar');

        currentBars
            .each(function (barData, barIndex) {
                var barElement = d3.select(this),
                    nextBar = filterNextItem(nextBars, barIndex);

                barElement
                    .attr('class', nextBar.attr('class'))
                    .attr('fill', nextBar.attr('fill'))
                    .transition()
                        .duration(duration)
                        .ease(ease)
                        .attr('x', nextBar.attr('x'))
                        .attr('y', nextBar.attr('y'))
                        .attr('width', nextBar.attr('width'))
                        .attr('height', nextBar.attr('height'));
            });

        currentBars
            .select('title')
            .each(function (titleData, titleIndex) {
                var titleElement = d3.select(this),
                    nextTitle = filterNextItem(nextBars, titleIndex).select('title');

                titleElement
                    .text(nextTitle.text());
            });

        redrawAxis(chartIndex, chartWrapper, nextWrapper);
    };

    dc.serverChart.redrawRowChart = dc.serverChart.redrawPairedRowChart = function (chartIndex, chartWrapper, nextWrapper) {
        chartWrapper
            .selectAll('g.row')
            .each(function (rowData, rowIndex) {
                var rowElement = d3.select(this),
                    nextRow = filterNextItem(nextWrapper.selectAll('g.row'), rowIndex),
                    nextRect = nextRow.select('rect'),
                    nextText = nextRow.select('text'),
                    nextTitle = nextRow.select('title');

                rowElement
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr('transform', nextRow.attr('transform'));

                rowElement
                    .select('rect')
                    .attr('class', nextRect.attr('class'))
                    .transition()
                        .duration(duration)
                        .ease(ease)
                        .attr('width', nextRect.attr('width'))
                        .attr('height', nextRect.attr('height'))
                        .attr('fill', nextRect.attr('fill'))
                        .attr('transform', nextRect.attr('transform'));

                rowElement
                    .select('text')
                    .text(nextText.text())
                    .transition()
                        .duration(duration)
                        .ease(ease)
                        .attr('x', nextText.attr('x'))
                        .attr('y', nextText.attr('y'))
                        .attr('dy', nextText.attr('dy'))
                        .attr('transform', nextText.attr('transform'));

                rowElement
                    .select('title')
                    .text(nextTitle.text());
            });

        redrawAxis(chartIndex, chartWrapper, nextWrapper);
    };

    dc.serverChart.redrawLineChart = function (chartIndex, chartWrapper, nextWrapper) {
        chartWrapper
            .selectAll('g.stack')
            .each(function (stackData, stackIndex) {
                var stackElement = d3.select(this),
                    nextStack = filterNextItem(nextWrapper.selectAll('g.stack'), stackIndex);

                stackElement
                    .selectAll('path')
                    .each(function (pathData, pathIndex) {
                        var pathElement = d3.select(this),
                            nextPath = filterNextItem(nextStack.selectAll('path'), pathIndex);

                        pathElement
                            .transition()
                                .duration(duration)
                                .ease(ease)
                                .attr('stroke', nextPath.attr('stroke'))
                                .attr('d', nextPath.attr('d'));
                    });
            });

        redrawAxis(chartIndex, chartWrapper, nextWrapper);
    };

    dc.serverChart.redrawNumberDisplay = function (chartIndex, chartWrapper, nextWrapper) {
        var spanElement = chartWrapper.select('span.number-display'),
            spanText = spanElement.text(),
            textParts = spanText.match(/([^\d]*)([\d\.]+)([^\d]*)/i),
            currentNumber = textParts === null ? 0 : parseFloat(textParts[2]),
            nextSpan = nextWrapper.select('span.number-display'),
            nextText = nextSpan.text(),
            nextParts = nextText.match(/([^\d]*)([\d\.]+)([^\d]*)/i),
            nextNumber = nextParts === null ? 0 : parseFloat(nextParts[2]);

        spanElement.transition()
            .duration(duration)
            .ease(ease)
            .tween('text', function () {
                var interp = d3.interpolateNumber(currentNumber, nextNumber);
                return function (t) {
                    var num = d3.format('.2s')(interp(t));
                    this.innerHTML = nextParts[1] + num + nextParts[3];
                };
            });
    };

    function redrawAxis (chartIndex, chartWrapper, nextWrapper) {
        chartWrapper
            .selectAll('.axis')
            .each(function (axisData, axisIndex) {
                var axisElement = d3.select(this),
                    axisBBox = axisElement.select('path.domain').node().getBBox(),
                    axisTicks = axisElement.selectAll('g.tick'),
                    isHorizontal = axisTicks.empty() ? null : /translate\([\d.]+,0\)/i.exec(d3.select(axisTicks[0][1]).attr('transform')) !== null,
                    firstRow = d3.select(axisElement[0][0].nextElementSibling),
                    isRightYAxis = firstRow.empty() ? null : /translate\(0,[\d.]+\)/i.exec(firstRow.attr('transform')) === null,
                    nextAxis = filterNextItem(nextWrapper.selectAll('.axis'), axisIndex),
                    nextTicks = nextAxis.selectAll('g.tick'),
                    minTickValue = nextTicks.empty() ? 0 : parseFloat(d3.select(nextTicks[0][0]).select('text').text()),
                    maxTickValue = nextTicks.empty() ? 1 : parseFloat(d3.select(nextTicks[0][nextTicks[0].length - 1]).select('text').text()),
                    grid = chartWrapper.select(isHorizontal ? '.grid-line.vertical' : '.grid-line.horizontal'),
                    nextGrid = nextWrapper.select(isHorizontal ? '.grid-line.vertical' : '.grid-line.horizontal');

                axisElement
                    .transition()
                        .duration(duration)
                        .ease(ease)
                        .attr('transform', nextAxis.attr('transform'));

                if (!grid.empty()) {
                    grid
                        .transition()
                            .duration(duration)
                            .ease(ease)
                            .attr('transform', nextGrid.attr('transform'));
                }

                axisTicks
                    .each(function (tickData, tickIndex) {
                        var tickElement = d3.select(this),
                            tickText = tickElement.select('text'),
                            tickValue = parseFloat(tickText.text()),
                            tickPercentage = (tickValue - minTickValue) / (maxTickValue - minTickValue) * 100,
                            matched = false;

                        nextTicks
                            .each(function (nextData, nextIndex) {
                                var nextTick = d3.select(this),
                                    nextText = nextTick.select('text');

                                if (parseFloat(nextText.text()) === tickValue) {
                                    matched = true;

                                    tickElement
                                        .transition()
                                            .duration(duration)
                                            .ease(ease)
                                            .attr('transform', nextTick.attr('transform'))
                                            .attr('opacity', null)
                                            .style('opacity', nextTick.attr('opacity'))
                                        .each('end', function () {
                                            tickElement
                                                .select('text')
                                                .text(nextTick.select('text').text());
                                        });

                                    if (!grid.empty()) {
                                        var gridLine = filterNextItem(grid.selectAll('line'), tickIndex),
                                            nextGridLine = filterNextItem(nextGrid.selectAll('line'), nextIndex);

                                        gridLine
                                            .transition()
                                                .duration(duration)
                                                .ease(ease)
                                                .attr('x1', nextGridLine.attr('x1'))
                                                .attr('y1', nextGridLine.attr('y1'))
                                                .attr('x2', nextGridLine.attr('x2'))
                                                .attr('y2', nextGridLine.attr('y2'))
                                                .attr('transform', null)
                                                .style('opacity', nextGridLine.attr('opacity'));
                                    }

                                }
                            });

                        if (!matched) {
                            var transform = '';

                            if (isHorizontal) {
                                var translate = (axisBBox.width * tickPercentage / 100);
                                if (isRightYAxis) {
                                    transform = 'translate(-' + translate + ', 0)';
                                } else {
                                    transform = 'translate(' + translate + ', 0)';
                                }
                            } else {
                                transform = 'translate(0, ' +
                                    (axisBBox.height - (axisBBox.height * tickPercentage / 100)) +
                                ')';
                            }

                            tickElement
                                .transition()
                                    .duration(duration)
                                    .ease(ease)
                                    .attr('transform', transform)
                                    .style('opacity', 0)
                                .each('end', function () {
                                    tickElement.remove();
                                });

                            if (!grid.empty()) {
                                var gridLine = filterNextItem(grid.selectAll('line'), tickIndex);

                                gridLine
                                    .transition()
                                        .duration(duration)
                                        .ease(ease)
                                        .attr('transform', transform)
                                        .style('opacity', 0)
                                    .each('end', function () {
                                        gridLine.remove();
                                    });
                            }
                        }
                    });
            });

        nextWrapper
            .selectAll('.axis')
            .each(function (d, axisIndex, tickIndex) {
                var nextAxis = d3.select(this),
                    nextTicks = nextAxis.selectAll('g.tick');

                if (!nextTicks.empty()) {
                    var isHorizontal = /translate\([\d.]+,0\)/i.exec(d3.select(nextTicks[0][1]).attr('transform')) !== null,
                        firstRow = d3.select(nextAxis[0][0].nextElementSibling),
                        isRightYAxis = firstRow.empty() ? null : /translate\(0,[\d.]+\)/i.exec(firstRow.attr('transform')) === null,
                        axisElement = filterNextItem(chartWrapper.selectAll('.axis'), axisIndex),
                        axisBBox = axisElement.select('path.domain').node().getBBox(),
                        axisTicks = axisElement.selectAll('g.tick'),
                        minTickValue = axisTicks.empty() ? 0 : parseFloat(d3.select(axisTicks[0][0]).select('text').text()),
                        maxTickValue = axisTicks.empty() ? 1 : parseFloat(d3.select(axisTicks[0][axisTicks[0].length - 1]).select('text').text()),
                        grid = chartWrapper.select(isHorizontal ? '.grid-line.vertical' : '.grid-line.horizontal'),
                        nextGrid = nextWrapper.select(isHorizontal ? '.grid-line.vertical' : '.grid-line.horizontal');

                    nextTicks
                        .each(function (nextData, nextIndex) {
                            var nextTick = d3.select(this),
                                nextText = nextTick.select('text'),
                                nextLine = nextTick.select('line'),
                                nextValue = parseFloat(nextText.text()),
                                tickPercentage = (nextValue - minTickValue) / (maxTickValue - minTickValue) * 100,
                                matched = false;

                            axisTicks
                                .each(function (tickData, tickIndex) {
                                    var tickElement = d3.select(this),
                                        tickText = tickElement.select('text');

                                    if (parseFloat(tickText.text()) === nextValue) {
                                        matched = true;
                                    }
                                });

                            if (!matched) {
                                var translate = 0,
                                    transform = '',
                                    gridLineTransform = '',
                                    nextGridLine = null;

                                if (grid.empty()) {
                                    nextGridLine = nextTick.select('line.grid-line');
                                } else {
                                    nextGridLine = filterNextItem(nextGrid.selectAll('line'), nextIndex);
                                }

                                if (isHorizontal) {
                                    translate = axisBBox.width * tickPercentage / 100;

                                    if (isRightYAxis) {
                                        transform = 'translate(-' + translate + ', 0)';
                                    } else {
                                        transform = 'translate(' + translate + ', 0)';
                                    }

                                    if (!nextGridLine.empty()) {
                                        gridLineTransform = 'translate(' + (translate - nextGridLine.attr('x1')) + ', 0)';
                                    }
                                } else {
                                    translate = axisBBox.height - (axisBBox.height * tickPercentage / 100);
                                    transform = 'translate(0, ' + translate + ')';

                                    if (!nextGridLine.empty()) {
                                        gridLineTransform = 'translate(0, ' + (translate - nextGridLine.attr('y1')) + ')';
                                    }
                                }

                                var addedTick = axisElement
                                    .append('g')
                                    .attr('class', 'tick')
                                    .attr('transform', transform)
                                    .attr('opacity', 0);

                                addedTick
                                    .transition()
                                        .duration(duration)
                                        .ease(ease)
                                        .attr('transform', nextTick.attr('transform'))
                                        .style('opacity', 1);

                                addedTick
                                    .append('text')
                                    .attr('x', nextText.attr('x'))
                                    .attr('y', nextText.attr('y'))
                                    .attr('dy', nextText.attr('dy'))
                                    .attr('style', nextText.attr('style'))
                                    .text(nextText.text());

                                addedTick
                                    .append('line')
                                    .attr('x1', nextLine.attr('x1'))
                                    .attr('y1', nextLine.attr('y1'))
                                    .attr('x2', nextLine.attr('x2'))
                                    .attr('y2', nextLine.attr('y2'));

                                if (!nextGridLine.empty()) {
                                    if (grid.empty()) {
                                        addedTick
                                            .append('line')
                                            .attr('class', nextGridLine.attr('class'))
                                            .attr('x1', nextGridLine.attr('x1'))
                                            .attr('y1', nextGridLine.attr('y1'))
                                            .attr('x2', nextGridLine.attr('x2'))
                                            .attr('y2', nextGridLine.attr('y2'));
                                    } else {
                                        grid
                                            .append('line')
                                            .attr('x1', nextGridLine.attr('x1'))
                                            .attr('y1', nextGridLine.attr('y1'))
                                            .attr('x2', nextGridLine.attr('x2'))
                                            .attr('y2', nextGridLine.attr('y2'))
                                            .attr('transform', gridLineTransform)
                                            .attr('opacity', 0)
                                            .transition()
                                                .duration(duration)
                                                .ease(ease)
                                                .attr('transform', 'translate(0, 0)')
                                                .style('opacity', 1);
                                    }
                                }
                            }
                        });
                }
            });
    }

    function filterNextItem (next, i) {
        return next.filter(function (d, j) {
            return j === i;
        });
    }

    function pathToInterpolateAngles(path) {
        // get the points of the pie slice
        var p = path.match(pieRegEx);

        if (!p) {
            return {
                startAngle: 0,
                endAngle: Math.PI * 2,
            };
        }

        var coords = {
            x1: parseFloat(p[5]),
            y1: parseFloat(p[6]),
            x2: parseFloat(p[1]),
            y2: parseFloat(p[2]),
            x3: parseFloat(p[3]),
            y3: parseFloat(p[4]),
        };

        // convert the points into angles
        var angles = {
            startAngle: switchRadians(Math.atan2((coords.y2 - coords.y1), (coords.x2 - coords.x1))),
            endAngle:   switchRadians(Math.atan2((coords.y3 - coords.y1), (coords.x3 - coords.x1))),
        };

        if (angles.startAngle < 0) {
            angles.startAngle = 0;
        }

        if (angles.endAngle > (Math.PI * 2) || angles.endAngle < angles.startAngle) {
            angles.endAngle = Math.PI * 2;
        }

        return angles;
    }

    // since silly maths makes the following angles we have to convert it from
    //      -90               -(PI / 2)
    // -180     0   or    -PI             0
    //       90                  PI / 2
    //
    // to
    //
    //     360                   PI * 2
    // 270     90   or    PI * 1.5     PI / 2
    //     180                      PI
    function switchRadians(angle) {
        var quarter     = Math.PI * 0.5;

        if (angle >= 0) {
            return quarter + angle;
        } else if (angle >= -quarter) {
            return quarter - Math.abs(angle);
        }

        return (Math.PI * 2.5) - Math.abs(angle);
    }
})();

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

(function () {
    'use strict';

    if (dc.paginationMixin) {
        return false;
    }

    dc.paginationMixin = function (_chart) {

        if (_chart) {
            // chart does not have a y axis if it is a row chart, so don't make it elastic
            if (_chart.y) {
                // chart is a bar chart so we need it to be elastic for it to work
                _chart.elasticX(true);
            }

            _chart.pagination = {};
            // data information
            _chart.pagination.allData = _chart.group().all();
            // page information
            _chart.pagination.currentPage = 1;
            _chart.pagination.pageSize = 5;
            _chart.pagination.pageCount = Math.ceil(_chart.pagination.allData.length / _chart.pagination.pageSize);
            // page controls
            _chart.pagination.setPage = function (page) {
                if (page < 1) {
                    page = 1;
                }

                if (page > _chart.pagination.pageCount) {
                    page = _chart.pagination.pageCount;
                }

                if (page !== _chart.pagination.currentPage) {
                    _chart.pagination.currentPage = page;
                    _chart.redraw();

                    if (_chart.tip) {
                        _chart.tip.reinit();
                    }
                }
            };
            _chart.pagination.previous = function () {
                _chart.pagination.setPage(_chart.pagination.currentPage - 1);
            };
            _chart.pagination.next = function () {
                _chart.pagination.setPage(_chart.pagination.currentPage + 1);
            };
            _chart.pagination.first = function () {
                _chart.pagination.setPage(1);
            };
            _chart.pagination.last = function () {
                _chart.pagination.setPage(_chart.pagination.pageCount);
            };

            _chart.group().all = function () {
                var pageStart = (_chart.pagination.currentPage - 1) * _chart.pagination.pageSize;
                var pageEnd = _chart.pagination.currentPage * _chart.pagination.pageSize;
                return _chart._computeOrderedGroups(_chart.pagination.allData).slice(pageStart, pageEnd);
            };

            _chart.redraw();
        }

        return _chart;
    };
})();

(function () {
    'use strict';

    if (dc.hexbinChart) {
        return false;
    }

    dc.hexbinChart = function (parent, chartGroup) {
        var _chart = dc.marginMixin(dc.colorMixin(dc.baseMixin({})));

        var _g;

        _chart._doRender = function () {
            _chart.resetSvg();

            _g = _chart.svg().append('g');

            drawChart();

            return _chart;
        };

        _chart._doRedraw = function () {
            drawChart();

            return _chart;
        };

        function drawChart() {
            var width = _chart.effectiveWidth();
            var height = _chart.effectiveHeight();
            var data = _chart.data();

            var radius = d3.scale.sqrt()
                .domain([0, 50])
                .range([0, 20]);

            var hexbin = d3.hexbin()
                .size([width, height])
                .radius(20);

            hexbin.x(function (d) {
                return Math.abs(d.key[0]);
            });
            hexbin.y(function (d) {
                return Math.abs(d.key[1]);
            });

            var x = d3.scale.identity()
                .domain([0, width]);

            var y = d3.scale.linear()
                .domain([0, height])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .tickSize(6, -height);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .tickSize(6, -width);

            _g.append('clipPath')
                .attr('id', 'clip')
                .append('rect')
                .attr('class', 'mesh')
                .attr('width', width)
                .attr('height', height);

            _g.append('g')
                .attr('clip-path', 'url(#clip)')
                .selectAll('.hexagon')
                .data(hexbin(data))
                .enter().append('path')
                .attr('class', 'hexagon')
                .attr('d', function (d) {
                    return hexbin.hexagon(radius(d.length));
                })
                .attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });

            _g.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(30, 10)')
                .call(yAxis);

            _g.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);
        }

        return _chart.anchor(parent, chartGroup);
    };
})();
