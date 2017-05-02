/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
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
