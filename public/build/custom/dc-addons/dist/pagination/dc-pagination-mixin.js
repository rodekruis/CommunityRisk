/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
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
