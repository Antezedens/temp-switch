var parsetemp = require('./parsetemp');
var setup = require('./setup');
var fs = require('fs');
var request = require('request');
var dateformat = require('dateformat');
var jf = require('jsonfile');

w1_sensors = []
for (let i=0; i<setup.sensors.length; ++i) {
	var s = setup.sensors[i];
	if ('w1_id' in s) {
		w1_sensors.push(setup.w1_prefix + s.w1_id + '/w1_slave');
	}
}
console.log(w1_sensors);
var dht22 = parsetemp.getDHT22(12);

var v = parsetemp.getw1temps(w1_sensors)
console.log("t: " + v);

try {
	cput = parseInt(fs.readFileSync('/sys/devices/virtual/thermal/thermal_zone0/temp'));
} catch (e) {
	cput = "null";
}

function datapush(data, id, ts, value) {
	data.push([dateformat(ts, "yyyy-mm-dd HH:MM"), id, value]);
}

function addpoint(ts, td, value, delta, data, lastts, id) {
		if (td.lastvalues != value 
			&& value > -50 // ignore impossible values!
		) { 
				var doit = true;

				if (Math.abs(td.lastvalues - value) < delta) {
						if (td.transition === null) {
								td.transition = ts;
								doit = false;
						} else {
								if (ts - td.transition > 17 * 60 * 1000) { // 17 minutes
									  datapush(data, id, td.transition, td.lastvalues);
										td.lasttss = lastts;
										doit = true;
								} else {
										doit = false;
								}
						}
				}
				if (doit) {
						if (lastts != td.lasttss && td.lasttss != 0) {
							datapush(data, id, lastts, td.lastvalues);
						}

						datapush(data, id, ts,value);
						td.lastvalues = value;
						td.lasttss = ts;
						td.transition = null;
				}
		} else {
				td.transition = null;
		}
}


function addtemp(data, ts, value, id, delta, transdata) {
	if (value != "null" && value != null) {
		if (!(id in transdata.data)) {
			transdata.data[id] = {
				lasttss: 0,
				lastvalues: 0,
				transition: null
			};
		}
	  
		addpoint(ts, transdata.data[id], value, delta, data, transdata.lastts, id);
	}
}

const laterfile = '/tmp/sensors.later';
const transfile = '/tmp/transition.json';
const internet = '/tmp/temperature.json';
parsetemp.getinternet((temp, humid) => {

	var transdata = {
		lastts: 0,
		data: {}
	};
	try {
		transdata = JSON.parse(fs.readFileSync(transfile));
	} catch (e) {}

	var ts = Date.now();
	var postdata = [];
	try {
		postdata = JSON.parse(fs.readFileSync(laterfile));
		fs.unlinkSync(laterfile);
	} catch(e) {		
	}
	
	jf.writeFileSync(internet, { 
		out: {
			humidity: humid, 
			temp: temp
		},
		in: dht22
	});

	addtemp(postdata, ts, humid, 100, 1.5, transdata);
	addtemp(postdata, ts, dht22['humidity'], 101, 0.15, transdata);
	addtemp(postdata, ts, temp, 0, 0.15, transdata);
	addtemp(postdata, ts, dht22['temp'],1, 0.15, transdata);
	addtemp(postdata, ts, cput, 2, 1.5, transdata);

	addtemp(postdata, ts, v[0], 3, 0.15, transdata);
	addtemp(postdata, ts, v[1], 4, 0.15, transdata);
	addtemp(postdata, ts, v[2], 5, 0.15, transdata);
	addtemp(postdata, ts, v[3], 6, 0.15, transdata);
	addtemp(postdata, ts, v[4], 7, 0.15, transdata);
	
	transdata.lastts = ts;
	fs.writeFileSync(transfile, JSON.stringify(transdata));

	require('./checkrelaisstate').check();
	if (postdata.length > 0) {
		console.log(postdata);
		const postreq = require('./postrequest');
		postreq.postrequest(laterfile, postdata, 0);
	}
});
