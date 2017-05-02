/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
(function () {
    'use strict';

    window.crossfilterServer.elasticSearch = {
        filter: function (filters, chartId, query, mapping) {
            var q = JSON.parse(JSON.stringify(query));

            if (!q.hasOwnProperty('query')) {
                q.query = {};
            }

            if (!q.query.hasOwnProperty('filtered')) {
                q.query.filtered = {};
            }

            if (!q.query.filtered.hasOwnProperty('filter')) {
                q.query.filtered.filter = {};
            }

            if (!q.query.filtered.filter.hasOwnProperty('bool')) {
                q.query.filtered.filter.bool = {};
            }

            if (!q.query.filtered.filter.bool.hasOwnProperty('must')) {
                q.query.filtered.filter.bool.must = [];
            }

            for (var f in filters) {
                if (f !== chartId && mapping[f]) {
                    if (filters[f].length > 0) {
                        var term = {};

                        if (Array.isArray(filters[f][0])) {
                            term.range = {};
                            term.range[mapping[f]] = {
                                gte: filters[f][0][0] instanceof Date ? d3.time.format('%Y-%m-%d %H:%M:%S')(filters[f][0][0]) : filters[f][0][0],
                                lte: filters[f][0][1] instanceof Date ? d3.time.format('%Y-%m-%d %H:%M:%S')(filters[f][0][1]) : filters[f][0][1],
                            };
                            q.query.filtered.filter.bool.must.push(term);
                        } else {
                            term.terms = {};
                            term.terms[mapping[f]] = filters[f];
                            q.query.filtered.filter.bool.must.push(term);
                        }
                    }
                }
            }

            return JSON.stringify(q);
        },

        send: function (filters, chartId, url, query, mapping, callback) {
            var q = this.filter(filters, chartId, query, mapping);
            d3.xhr(url).post(q, function (error, xhr) {
                var data = JSON.parse(xhr.responseText);
                callback(data);
            });
        },
    };
})();
