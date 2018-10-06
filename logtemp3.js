var parsetemp = require('./parsetemp');
var setup = require('./setup');
var fs = require('fs');
var dateformat = require('dateformat');

var dht22 = parsetemp.getDHT22(6);

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
var ts = dateformat(Date.now(), "yyyy-mm-dd HH:MM");
var postdata = [];
try {
	postdata = JSON.parse(fs.readFileSync(laterfile));
	fs.unlinkSync(laterfile);
} catch(e) {		
}
addtemp(postdata, ts, dht22['humidity'], 108);
addtemp(postdata, ts, dht22['temp'],8);
addtemp(postdata, ts, cput, 9);
	
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

//require('./checkrelaisstate').check();
// /sys/devices/virtual/thermal/thermal_zone0/temp
