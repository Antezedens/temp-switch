var parsetemp = require('./parsetemp');
var setup = require('./setup');
var jf = require('jsonfile');
var lt = require('./logtemp');

w1_sensors = []
for (let i=0; i<setup.sensors.length; ++i) {
	var s = setup.sensors[i];
	if ('w1_id' in s) {
		w1_sensors.push(setup.w1_prefix + s.w1_id + '/w1_slave');
	}
}
console.log(w1_sensors);
var dht22 = parsetemp.getHTU21(12);

var v = parsetemp.getw1temps(w1_sensors)
console.log("t: " + v);

parsetemp.getinternet((temp, humid, rain) => {
	
	const internet = '/tmp/temperature.json';
	jf.writeFileSync(internet, { 
		out: {
			humidity: humid, 
			temp: temp
		},
		in: dht22,
		water: v[1]
	});

	lt.logtemp(function(cput, postdata, ts, transdata) {		
		lt.addtemp(postdata, ts, humid, 100, 1.5, transdata);
		lt.addtemp(postdata, ts, dht22['humidity'], 101, 0.15, transdata);
		lt.addtemp(postdata, ts, temp, 0, 0.15, transdata);
		lt.addtemp(postdata, ts, dht22['temp'],1, 0.15, transdata);
		lt.addtemp(postdata, ts, cput, 2, 1.5, transdata);
		lt.addtemp(postdata, ts, rain, 400, 0.1, transdata);

		lt.addtemp(postdata, ts, v[0], 3, 0.15, transdata);
		lt.addtemp(postdata, ts, v[1], 4, 0.15, transdata);
		lt.addtemp(postdata, ts, v[2], 5, 0.15, transdata);
		lt.addtemp(postdata, ts, v[3], 6, 0.15, transdata);
		lt.addtemp(postdata, ts, v[4], 7, 0.15, transdata);
	});
	
	require('./checkrelaisstate').check();
});
