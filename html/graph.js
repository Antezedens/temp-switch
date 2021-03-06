var series = [];
var myChart;
var avgChart;
var app = angular.module('myApp', []);
var visible = [false, true, true, false, false, true];
var veryfirstavgday;
let perday = 24 * 3600 * 1000;

app.controller('myCtrl', function($scope, $http) {
    function round2(input) {
        return Math.round(input * 100) / 100.0;
    }

    function makediff(avgdata) {
        if (avgdata.length < 2) {
            return [];
        }
        var result = [];
        var day = veryfirstavgday + perday;
        while (avgdata[0][0] > day) {
            day += perday;
            result.push(0);
        }
        for (let i = 1; i < avgdata.length; ++i) {
            result.push(round2(avgdata[i][1] - avgdata[i - 1][1]));
        }
        return result;
    }

    function adjustTimezone(day) {
        return day + (new Date(day).getTimezoneOffset()) * 60 * 1000;
    }

    function toggleVisible(i) {
        visible[i] = !visible[i];
        updateSeries();
        return false;
    }

    function updateSeries() {
        var seriesNew = [];
        var avgSeriesNew = [];
        if ($scope.selected_temp != null) {
            for (let i = 0; i < series.length; ++i) {
                if (series[i].name == $scope.selected_temp) {
                    seriesNew.push({
                        name: series[i].name,
                        data: $scope.showAbs ? series[i].avg : series[i].data,
                        type: 'area',
                        visible: true
                    });
                    avgSeriesNew.push({
                        name: series[i].name,
                        data: makediff(series[i].avg),
                        visible: true
                    });
                }
            }
        } else {
            for (let i = 0; i < 6; ++i) {
                seriesNew.push({
                    name: series[i].name,
                    data: $scope.showAbs ? series[i].avg : series[i].data,
                    visible: visible[i],
                    events: {
                        legendItemClick: function(event) {
                            return toggleVisible(i);
                        }
                    }
                });
                avgSeriesNew.push({
                    name: series[i].name,
                    data: makediff(series[i].avg),
                    visible: visible[i],
                    events: {
                        legendItemClick: function(event) {
                            return toggleVisible(i);
                        }
                    }
                });
            }
        }
        seriesNew.push({
            name: "Hum in",
            yAxis: 1,
            data: $scope.showAbs ? series[7].avg : series[7].data
        });

        seriesNew.push({
            name: "Temp Out",
            yAxis: 0,
            data: $scope.showAbs ? series[8].avg : series[8].data
        });

        seriesNew.push({
            name: "Hum out",
            yAxis: 1,
            data: $scope.showAbs ? series[9].avg : series[9].data
        });

        for (x in $scope.relais) {
            if ($scope.relais[x].shown) {
                seriesNew.push({
                    name: $scope.relais[x].name,
                    yAxis: 2,
                    data: $scope.relaisHistory[$scope.relais[x].gpio]
                });
            }
        }
        myChart.update({
            series: seriesNew
        }, true, true);
        avgChart.update({
            series: avgSeriesNew
        }, true, true)
    }

    $scope.updateRelais = function() {
        $http.get("/relais")
            .then(function(response) {
                $scope.resp = response;
                $scope.relais = response.data;
                for (i = 0; i < $scope.relais.length; ++i) {
                    $scope.relais[i].checked = $scope.relais[i].on
                    $scope.relais[i].switching = "";
                    var ton = "";
                    if (parseInt($scope.relais[i].turnon) > 0) {
                        let d = new Date($scope.relais[i].turnon);
                        ton = d.format('dd.mm. HH:MM');
                    }
                    if (parseInt($scope.relais[i].turnoff) > 0) {
                        let d = new Date($scope.relais[i].turnoff);
                        var toff = d.format('dd.mm. HH:MM');
                        if (ton != "") {
                            if (toff.substring(0, 5) == ton.substring(0, 5)) {
                                $scope.relais[i].switching = ton + " " + d.format('HH:MM');
                            } else {
                                $scope.relais[i].switching = ton + " " + toff;
                            }
                        } else {
                            $scope.relais[i].switching = toff;
                        }
                    } else {
                        $scope.relais[i].switching = ton;
                    }
                    if ($scope.relais[i].switching.startsWith(new Date().format('dd.mm. '))) {
                        $scope.relais[i].switching = $scope.relais[i].switching.substring(7);
                    }
                }
            }, function(err) {
                $scope.resp = err;
            });
    };

    $scope.updateRelais();

    $scope.selected_temp = null;
    $scope.setRelais = function(name, checked) {
        $http.post("/relais", {
            "name": name,
            "state": checked,
            "turnon": "",
            "turnoff": ""
        }).then(function(response) {
            $scope.updateRelais();
        });
    };
    $scope.setRelais24 = function(name) {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        $http.post("/relais", {
            "name": name,
            "state": true,
            "turnon": "",
            "turnoff": tomorrow
        }).then(function(response) {
            $scope.updateRelais();
        });
    }
    $scope.setRelaisExtraTime = function(name) {
        var now = new Date();
        var turnon = new Date();
        turnon.setUTCHours(18, 55, 0, 0);
        if (turnon < now) {
            turnon.setUTCHours(turnon.getHours() + 24);
        }
        var turnoff = new Date(turnon.getTime());
        turnoff.setUTCHours(turnoff.getUTCHours() + 3);
        $http.post("/relais", {
            "name": name,
            "turnon": turnon,
            "turnoff": turnoff,
            "extra": true
        }).then(function(response) {
            $scope.updateRelais();
        });
    }
    $scope.toggle = function(name) {
        if ($scope.selected_temp == name) {
            $scope.selected_temp = null;
        } else {
            $scope.selected_temp = name;
        }
        updateSeries();
    }
    $scope.zoom = function(range) {
        let n = range[0];
        var now = new Date();
        var from;
        switch (range[1]) {
            case 'm':
                from = now - 24 * 3600 * 1000 * 31 * n;
                break;
            case 'w':
                from = now - 24 * 3600 * 1000 * 7 * n;
                break;
            case 'd':
                from = now - 24 * 3600 * 1000 * n;
                break;
            case 'r':
                myChart.xAxis[0].setExtremes(null, null);
                return;
        }

        myChart.xAxis[0].setExtremes(from, now);
    }
    $scope.toggleAbsDiff = function() {
        $scope.showAbs = !$scope.showAbs;
        updateSeries();
    }
    $scope.toggleRelais = function(x) {
        x.shown = !x.shown;
        updateSeries();
    }
    //$http.get("http://private-699939-technikschacht.apiary-mock.com/relais")

    $http.get("/sensors")
        .then(function(response) {
            $scope.tempdata = new Date().format('dd.mm. HH:MM');
            $scope.sensors = response.data;
        });

    if (CHARTS == "disabled") {
        return;
    }
    //indexedDB.deleteDatabase('sensors');
    var request = indexedDB.open('sensors', 4);
    request.onupgradeneeded = function(event) {
        var db = this.result;
        if (event.oldVersion < 3) {

            for (let i = 0; i < 10; ++i) {
                let objName = 'data' + i;
                if (db.objectStoreNames.contains(objName)) {
                    db.deleteObjectStore(objName);
                }
                db.createObjectStore(objName, {
                    keyPath: "date"
                });
            }
        } else {
            db.deleteObjectStore("data3");
            db.createObjectStore("data3", {
                keyPath: "date"
            });
        }
    }
    request.onsuccess = function() {
        var db = this.result;
        var fetchts = [];
        for (let i = 0; i < 10; ++i) {
            fetchts.push(new Promise(function(fulfill, reject) {
                var readtrans = db.transaction(['data' + i], 'readonly');
                var readStore = readtrans.objectStore('data' + i);
                readStore.openCursor(null, 'prev').onsuccess = function(event) {
                    var cur = event.target.result;
                    if (cur) {
                        fulfill(cur.key / (1000 * 60));
                    } else {
                        fulfill(0);
                    }
                };
            }));
        }
        Promise.all(fetchts).then(latesttimestamps => {
            $http.get("/temperatures", {
                    params: {
                        ts: latesttimestamps
                    }
                })
                .then(function(response) {
                    $scope.datasize = response.headers('Content-Length');
                    let t = response.data.data;
                    let names = response.data.names;
                    var promises = [];
                    var verylastts = response.data.lastts * 1000 * 60;
                    var veryfirstts = 1513454400 * 1000.0; // 16.12.2017
                    // var veryfirstts = 1512086400 * 1000.0; // 1.12.2017
                    veryfirstts = Math.ceil(veryfirstts / perday) * perday;
                    console.log(names);

                    for (let i = 0; i < names.length; ++i) {

                        promises.push(new Promise(function(fulfill, reject) {
                            var serdata = [];
                            var avgTemps = [];
                            var lastentry = [];
                            var lastday;
                            console.log('store: data' + i);
                            var trans = db.transaction(['data' + i], 'readwrite');
                            var store = trans.objectStore('data' + i);
                            var avg = 0;
                            for (let j = 0; j < t[i].length; ++j) {
                                store.put({
                                    date: t[i][j][0] * (1000 * 60),
                                    value: t[i][j][1]
                                });
                            }
                            var myIDBKeyRange = IDBKeyRange.lowerBound(veryfirstts);
                            var read = store.openCursor(myIDBKeyRange);

                            function processEntry(entry) {
                                let currentday = Math.floor(entry[0] / perday);

                                if (currentday > lastday) {
                                    let midnight = (lastday + 1) * perday;
                                    let timeTillMidnight = midnight - lastentry[0];
                                    let middle = (entry[1] + lastentry[1]) / 2;

                                    avg += timeTillMidnight * middle;
                                    avgTemps.push([adjustTimezone(lastday * perday + perday / 2), round2(avg / perday)]);

                                    lastday += 1;
                                    while (lastday < currentday) {
                                        avgTemps.push([adjustTimezone(lastday * perday + perday / 2), round2(middle)]);
                                        lastday += 1;
                                    }

                                    let timeAfterMidnight = entry[0] - (currentday) * perday;
                                    avg = timeAfterMidnight * middle;
                                } else {
                                    avg += (entry[0] - lastentry[0]) * (entry[1] + lastentry[1]) / 2;
                                }
                                return currentday;
                            }

                            read.onsuccess = function(event) {
                                var cursor = event.target.result;
                                if (cursor) {
                                    if (serdata.length == 0) {
                                        let before = cursor.value.date - 1000;
                                        lastentry = [before, cursor.value.value];
                                        lastday = Math.floor(before / perday);
                                        avg = cursor.value.value * (before - lastday * perday);
                                        serdata.push(lastentry);
                                    }
                                    let entry = [cursor.value.date, cursor.value.value];
                                    lastday = processEntry(entry);
                                    lastentry = entry;

                                    serdata.push(entry);
                                    cursor.continue();
                                } else {
                                    if (serdata.length > 0) {
                                        processEntry([verylastts, lastentry[1]]);
                                        serdata.push([verylastts, lastentry[1]]);

                                        let lasttime = Math.floor(verylastts / perday) * perday + perday / 2;
                                        avgTemps.push([adjustTimezone(lasttime), round2(avg / (verylastts % perday))]);
                                    }
                                    fulfill([serdata, avgTemps]);
                                }
                            }
                        }));
                    }
                    $http.get("/relaisHistory")
                        .then(function(response) {
                            Promise.all(promises).then(values => {
                                var categories = [];
                                let firstday = Math.floor(veryfirstts / perday) * perday;
                                let lastday = Math.floor(verylastts / perday) * perday;
                                veryfirstavgday = firstday;

                                let lastfmt = new Date(firstday).format('dd.mm.yy');
                                for (let day = firstday + perday; day < verylastts; day += perday) {
                                    let fmt = new Date(day).format('dd.mm.yy');
                                    if (fmt.substring(6) != lastfmt.substring(6)) {
                                        categories.push(lastfmt + "-" + fmt);
                                    } else if (fmt.substring(3) != lastfmt.substring(3)) {
                                        categories.push(lastfmt.substring(0, 6) + "-" + fmt.substring(0, 6) + fmt.substring(6))
                                    } else {
                                        categories.push(lastfmt.substring(0, 3) + "-" + fmt.substring(0, 3) + fmt.substring(3))
                                    }
                                    lastfmt = fmt;
                                }


                                for (let i = 0; i < values.length; ++i) {
                                    series.push({
                                        name: names[i],
                                        data: values[i][0],
                                        avg: values[i][1]
                                    });
                                }
                                for (gpio in response.data.data) {
                                    let gp = response.data.data[gpio];
                                    let gpNew = [];
                                    for (let i = 0; i < gp.length; ++i) {
                                        if (i > 0 && gp[i][1] != gp[i - 1][1]) {
                                            gpNew.push([(gp[i][0] - 1) * 1000, gp[i - 1][1]]);
                                        }
                                        gpNew.push([gp[i][0] * 1000, gp[i][1]]);
                                    }
                                    gpNew.push([verylastts, gp[gp.length - 1][1]]);
                                    response.data.data[gpio] = gpNew;
                                }
                                $scope.relaisHistory = response.data.data;
                                createCharts(categories);

                                let firstband = Math.ceil((veryfirstts + 1000) / perday) * perday;
                                for (let day = firstband; day < verylastts; day += perday * 2) {
                                    let newday = adjustTimezone(day);
                                    myChart.xAxis[0].addPlotBand({
                                        from: newday,
                                        to: newday + perday,
                                        color: 'rgba(220, 220, 220, .2)',
                                        id: day
                                    })
                                }

                                updateSeries();
                            })
                        });

                }, function(err) {
                    console.log(err);
                });
        });
    };

    function createCharts(categories) {

        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        myChart = Highcharts.chart('container', {
            chart: {
                zoomType: 'x',
                events: {
                    click: $scope.toggleAbsDiff
                }
            },
            title: {
                text: ''
            },
            subtitle: {
                //text: document.ontouchstart === undefined ?
                //        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: [{
                    labels: {
                        format: '{value}°C'
                    },
                    title: {
                        text: 'Temperature'
                    },
                }, {
                    opposite: true,
                    ceiling: 100,
                    floor: 0,
                    labels: {
                        format: '{value}%'
                    },
                    title: {
                        text: 'Humidity'
                    }
                },

                {
                    ceiling: 1,
                    opposite: true,
                    title: {
                        text: ''
                    }
                }
            ],
            legend: {
                enabled: true
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }

            }
        });

        avgChart = Highcharts.chart('avgcontainer', {
            chart: {
                zoomType: 'x',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories
            },
            yAxis: {
                labels: {
                    format: '{value}°C'
                },
                title: {
                    text: 'Temperature'
                },
            },
            legend: {
                enabled: true
            }
        });

    }
    //$http.get("http://private-699939-technikschacht.apiary-mock.com/sensors")
});