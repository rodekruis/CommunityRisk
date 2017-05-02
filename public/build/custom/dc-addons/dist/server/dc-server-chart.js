/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
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
