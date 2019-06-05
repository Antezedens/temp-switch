var parsetemp = require('./parsetemp');
var setup = require('./setup');
var fs = require('fs');
var lt = require('./logtemp');

var dht22 = parsetemp.getDHT22(6);

const statsfile = '/tmp/netstats.json';

var oldstats = [];
try {
	oldstats = JSON.parse(fs.readFileSync(statsfile));
} catch(e) {
}

var netstats = {};
try {
	//let iface = "enp3s0";enx0c5b8f279a64
	let iface = "enx0c5b8f279a64";
	netstats = {
		up: parseInt(fs.readFileSync('/sys/class/net/' + iface + '/statistics/tx_bytes')),
		down: parseInt(fs.readFileSync('/sys/class/net/' + iface + '/statistics/rx_bytes'))
	};
	fs.writeFileSync(statsfile, JSON.stringify(netstats));
} catch(e) {
}

function convertToMb(value) {
	return Math.round(value / (1024.0 * 10.24)) / 100.0;
}

lt.logtemp(function(cput, postdata, ts, transdata) {	
	if ('up' in netstats && 'up' in oldstats) {
		let upRate = convertToMb(netstats.up - oldstats.up);
		let downRate = convertToMb(netstats.down - oldstats.down);
		lt.addtemp(postdata, ts, upRate, 312, 0.1, transdata);
		lt.addtemp(postdata, ts, downRate, 313, 0.1, transdata);
	}

	lt.addtemp(postdata, ts, dht22['humidity'], 108, 0.15, transdata);
	lt.addtemp(postdata, ts, dht22['temp'],8, 0.15, transdata);
	lt.addtemp(postdata, ts, cput, 9, 10, transdata);
	
});
