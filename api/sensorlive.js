var nodeid = require('../nodeid');
var parsetemp = require('../parsetemp');
var fs = require('fs');

exports.sensorlive = (req, res) => {
	switch(nodeid.nodeid) {
		case '11':
			result = node11();
			break;
		default:
			console.log("unknown node " + nodeid.nodeid);
			result = {};
	}
	res.write(JSON.stringify(result));
	res.status(200).send();      
}

function getcpu() {
	try {
		return Math.round(parseInt(fs.readFileSync('/sys/devices/virtual/thermal/thermal_zone0/temp')) / 1000.0);
	} catch (e) {
		return "null";
	}
}

function node11() {
	var dht22 = parsetemp.getDHT22(12);
	return {
		"cput" : getcpu(),
		"room" : dht22['temp'],
		"humid" : dht22['humidity'],
	};
}

