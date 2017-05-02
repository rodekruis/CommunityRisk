/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
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
