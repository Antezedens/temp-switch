var series = [];
var myChart;
var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {
    function updateSeries() {
        var seriesNew = [];
        if ($scope.selected_temp != null) {
            for (let i = 0; i < series.length; ++i) {
                if (series[i].name == $scope.selected_temp) {
                    seriesNew.push({
                        name: series[i].name,
                        data: series[i].data,
                        type: 'area'
                    });
                }
            }
        } else {
            for (let i = 0; i < 6; ++i) {
                seriesNew.push(series[i]);
            }
        }
        for (x in $scope.relais) {
            if ($scope.relais[x].shown) {
                seriesNew.push({
                    name: $scope.relais[x].name,
                    yAxis: 1,
                    data: $scope.relaisHistory[$scope.relais[x].gpio]
                });
            }
        }
        myChart.update({
            series: seriesNew
        }, true, true);
    }

    $scope.updateRelais = function() {
        $http.get("/relais")
            .then(function(response) {
                $scope.resp = response;
                $scope.relais = response.data;
                for (i = 0; i < $scope.relais.length; ++i) {
                    $scope.relais[i].checked = $scope.relais[i].on
                    if ($scope.relais[i].switching != "") {
                        let d = new Date($scope.relais[i].switching);
                        //let d = $scope.relais[i].switching;
                        $scope.relais[i].switchingTime = d.format('dd.mm. HH:MM');
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
            "switching": ""
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
            "switching": tomorrow
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
    $scope.toggleRelais = function(x) {
        x.shown = !x.shown;
        updateSeries();
    }
    //$http.get("http://private-699939-technikschacht.apiary-mock.com/relais")

    $http.get("/sensors")
        .then(function(response) {
            $scope.sensors = response.data;
        });

    //indexedDB.deleteDatabase('sensors');
    var request = indexedDB.open('sensors', 3);
    request.onupgradeneeded = function() {
        var db = this.result;
        for (let i = 0; i < 10; ++i) {
            let objName = 'data' + i;
            if (db.objectStoreNames.contains(objName)) {
                db.deleteObjectStore(objName);
            }
            db.createObjectStore(objName, {
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
                        console.log(cur.key);
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
                    let perday = 24 * 3600 * 1000;
                    // var veryfirstts = 1512086400 * 1000.0; // 1.12.2017
                    veryfirstts = Math.ceil(veryfirstts / perday) * perday;

                    for (let i = 0; i < names.length; ++i) {

                        promises.push(new Promise(function(fulfill, reject) {
                            var serdata = [];
                            var avgTemps = [];
                            var lastentry = [];
                            var lastday;
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
                            read.onsuccess = function(event) {
                                var cursor = event.target.result;
                                if (cursor) {
                                    if (serdata.length == 0) {
                                        lastentry = [veryfirstts, cursor.value.value];
                                        lastday = Math.floor(veryfirstts / perday);
                                        serdata.push(lastentry);
                                    }
                                    let entry = [cursor.value.date, cursor.value.value];
                                    let currentday = Math.floor(veryfirstts / perday);

                                    if (currentday > lastday) {
                                        let midnight = (lastday + 1) * perday;
                                        let timeTillMidnight = midnight - lastentry[0];
                                        let middle = (entry[1] + lastentry[1]) / 2;

                                        avg += timeTillMidnight * middle;
                                        avgTemps.push(avg / perday);

                                        lastday += 1;
                                        while (lastday < currentday) {
                                            avgTemps.push(middle);
                                            lastday += 1;
                                        }

                                        let timeAfterMidnight = entry[0] - (currentday) * perday;
                                        avg = timeAfterMidnight * middle;
                                    } else {
                                        avg += (entry[0] - lastentry[0]) * (entry[1] + lastentry[1]) / 2;
                                    }

                                    lastentry = entry;
                                    lastday = currentday;

                                    serdata.push(entry);
                                    cursor.continue();
                                } else {
                                    if (serdata.length > 0) {
                                        serdata.push([verylastts, lastentry[1]]);
                                    }
                                    fulfill([serdata, avgTemps]);
                                }
                            }
                        }));
                    }
                    $http.get("/relaisHistory")
                        .then(function(response) {
                            Promise.all(promises).then(values => {
                                var firstband = Math.ceil((veryfirstts + 1000) / perday) * perday;
                                for (let day = firstband; day < verylastts; day += perday * 2) {
                                    let newday = day + (new Date(day).getTimezoneOffset()) * 60 * 1000;
                                    myChart.xAxis[0].addPlotBand({
                                        from: newday,
                                        to: newday + perday,
                                        color: 'rgba(220, 220, 220, .2)',
                                        id: day
                                    })
                                }

                                for (let i = 0; i < values.length; ++i) {
                                    series.push({
                                        name: names[i],
                                        data: values[i][0]
                                    });
                                }
                                for (gpio in response.data.data) {
                                    let gp = response.data.data[gpio];
                                    let gpNew = [];
                                    console.log(gp);
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
                                console.log($scope.relaisHistory);
                                updateSeries();
                            })
                        });

                }, function(err) {
                    console.log(err);
                });
        });
    };


    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
    myChart = Highcharts.chart('container', {
        chart: {
            zoomType: 'x'
        },
        title: {
            text: 'Temperaturverlauf'
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
            ceiling: 1,
            opposite: true,
            title: {
                text: 'State'
            }
        }],
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

        },

        series: series.slice(0, 6)
    });

    //$http.get("http://private-699939-technikschacht.apiary-mock.com/sensors")
});
