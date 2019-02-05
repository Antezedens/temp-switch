var parsetemp = require('./parsetemp');
var setup = require('./setup');
var fs = require('fs');
var request = require('request');
var dateformat = require('dateformat');

var dht22 = parsetemp.getDHT22(6);

try {
	cput = parseInt(fs.readFileSync('/sys/devices/virtual/thermal/thermal_zone0/temp')) / 1000.0;
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
const statsfile = '/tmp/netstats.json';

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

var oldstats = [];
try {
	oldstats = JSON.parse(fs.readFileSync(statsfile));
} catch(e) {
}

try {
	//let iface = "enp3s0";enx0c5b8f279a64
	let iface = "enx0c5b8f279a64";
	netstats = {
		up: parseInt(fs.readFileSync('/sys/class/net/' + iface + '/statistics/tx_bytes')),
		down: parseInt(fs.readFileSync('/sys/class/net/' + iface + '/statistics/rx_bytes'))
	};
	fs.writeFileSync(statsfile, JSON.stringify(netstats));
} catch(e) {
	netstats = "null";
}
if ('up' in netstats && 'up' in oldstats) {
	let upRate = (netstats.up - oldstats.up) / (1024.0 * 1024.0);
	let downRate = (netstats.down - oldstats.down) / (1024.0 * 1024.0);
	addtemp(postdata, ts, upRate, 312, 0.1, transdata);
	addtemp(postdata, ts, downRate, 313, 0.1, transdata);
}

addtemp(postdata, ts, dht22['humidity'], 108, 0.15, transdata);
addtemp(postdata, ts, dht22['temp'],8, 0.15, transdata);
addtemp(postdata, ts, cput, 9, 1.5, transdata);
	
transdata.lastts = ts;
fs.writeFileSync(transfile, JSON.stringify(transdata));

if (postdata.length > 0) {
	console.log(postdata);
	const postreq = require('./postrequest');
	postreq.postrequest(laterfile, postdata, 0);
}

//require('./checkrelaisstate').check();
// /sys/devices/virtual/thermal/thermal_zone0/temp
