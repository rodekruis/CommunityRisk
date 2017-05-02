/*!
 * dc-addons v0.13.5
 *
 * 2016-08-17 08:09:00
 *
 */
var moment = require('moment'),
    dc = require('dc');

module.exports = {
    'store-dashboard': {
        connection:  {
            host: '127.0.0.1',
            username: 'root',
            password: 'password',
            database: 'loyaltyone',
            sql: 'SELECT * FROM members LIMIT 100'
        },
        charts: [
            {
                type: 'pieChart',
                options: {
                    width: 250,
                    height: 250,
                    margins: {
                        top: 30,
                        right: 50,
                        bottom: 25,
                        left: 40
                    },
                    dimension: function (d) {
                        if (d.gender === 0) {
                            return 'Male';
                        } else if (d.gender === 1) {
                            return 'Female';
                        }

                        return 'Unknown';
                    },
                    group: function (dimension) {
                        return dimension.group().reduceCount();
                    }
                }
            },
            {
                type: 'barChart',
                options: {
                    // display
                    width: 500,
                    height: 250,
                    margins: {
                        top: 30,
                        right: 50,
                        bottom: 25,
                        left: 40
                    },
                    brushOn: false,
                    centerBar: true,
                    // x axis
                    x: d3.scale.linear(),
                    xUnits: dc.units.integers,
                    xAxisLabel: 'Age',
                    elasticX: true,
                    // y axis
                    yAxisLabel: 'Number of Members',
                    elasticY: true,
                    renderHorizontalGridLines: true,
                    // data
                    dimension: function (d) {
                        d.age = Math.abs(moment().diff(d.dob, 'years'));

                        return d.age;
                    },
                    group: function (dimension) {
                        return dimension.group().reduceCount();
                    }
                }
            },
            {
                type: 'rowChart',
                options: {
                    // display
                    width: 500,
                    height: 250,
                    margins: {
                        top: 30,
                        right: 50,
                        bottom: 25,
                        left: 40
                    },
                    elasticX: true,
                    // data
                    dimension: function (d) {
                        d.age = Math.abs(moment().diff(d.dob, 'years'));

                        if (!isNaN(d.age)) {
                            return Math.floor(d.age / 10) * 10;
                        }
                    },
                    group: function (dimension) {
                        return dimension.group().reduceCount();
                    }
                }
            },
            {
                type: 'lineChart',
                options: {
                    // display
                    width: 500,
                    height: 250,
                    margins: {
                        top: 30,
                        right: 50,
                        bottom: 25,
                        left: 40
                    },
                    //brushOn: false,
                    // x axis
                    x: d3.scale.linear(),
                    xUnits: dc.units.integers,
                    xAxisLabel: 'Age',
                    elasticX: true,
                    // y axis
                    yAxisLabel: 'Number of Members',
                    elasticY: true,
                    renderHorizontalGridLines: true,
                    // data
                    dimension: function (d) {
                        d.age = Math.abs(moment().diff(d.dob, 'years'));

                        if (!isNaN(d.age)) {
                            return Math.floor(d.age / 10) * 10;
                        }
                    },
                    group: function (dimension) {
                        return dimension.group().reduceCount();
                    }
                }
            },
            {
                type: 'lineChart',
                options: {
                    // display
                    width: 500,
                    height: 250,
                    margins: {
                        top: 30,
                        right: 50,
                        bottom: 25,
                        left: 40
                    },
                    //brushOn: false,
                    renderArea: true,
                    // x axis
                    x: d3.scale.linear(),
                    xUnits: dc.units.integers,
                    xAxisLabel: 'Age',
                    elasticX: true,
                    // y axis
                    yAxisLabel: 'Number of Members',
                    elasticY: true,
                    renderHorizontalGridLines: true,
                    // data
                    dimension: function (d) {
                        d.age = Math.abs(moment().diff(d.dob, 'years'));

                        if (!isNaN(d.age)) {
                            return Math.floor(d.age / 10) * 10;
                        }
                    },
                    group: function (dimension) {
                        return dimension.group().reduceCount();
                    }
                }
            },
        ]
    },
};
