var parsetemp = require('./parsetemp');
var setup = require('./setup');
var fs = require('fs');
var request = require('request');
var dateformat = require('dateformat');

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

function addtemp(data, ts, value, id) {
	if (value != "null" && value != null) {
		data.push([ts,id,value]);
	}
}

const laterfile = '/tmp/sensors.later';
parsetemp.getinternet((temp, humid) => {
	var ts = dateformat(Date.now(), "yyyy-mm-dd HH:MM");
	var postdata = [];
	try {
		postdata = JSON.parse(fs.readFileSync(laterfile));
		fs.unlinkSync(laterfile);
	} catch(e) {		
	}
	addtemp(postdata, ts, temp, 0);
	addtemp(postdata, ts, humid, 1);
	addtemp(postdata, ts, dht22['humidity'], 2);
	addtemp(postdata, ts, dht22['temp'],3);
	addtemp(postdata, ts, cput, 4);

	addtemp(postdata, ts, v[0], 5);
	addtemp(postdata, ts, v[1], 6);
	addtemp(postdata, ts, v[2], 7);
	addtemp(postdata, ts, v[3], 8);
	addtemp(postdata, ts, v[4], 9);
	
	console.log(postdata);
	//request({url: 'http://fuchsbau.cu.ma/sensor.php', method: "POST", json: false, body: "data=" + postdata}, function (error, response, body) {
	request.post('http://fuchsbau.cu.ma/sensor.php', { json: postdata}, function (error, response, body) {
		if (error) {
			console.log("error: " + error);
			fs.writeFileSync(laterfile, JSON.stringify(postdata));
		} else {
		  console.log(response);
	  }
	});
});

require('./checkrelaisstate').check();
// /sys/devices/virtual/thermal/thermal_zone0/temp
