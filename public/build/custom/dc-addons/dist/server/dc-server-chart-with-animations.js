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
