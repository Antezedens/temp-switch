var util = require('util');
var exec = require('child_process').exec;
var setup = require('./setup');
 
// GET
exports.relais = function (req, res) {
  console.log('Getting switches.');
  data = [];
  
  data.push({name: "Fan", state: "on", timeout: "00:00:00"});
  data.push({name: "FilterOn", state: "off", timeout: "00:10:00"});
  data.push({name: "FilterOff", state: "off", timeout: "00:10:00"});

  res.status(200).json(data);
};
 
// PUT
exports.setRelais = function (req, res) {
  var name = req.body.name;
  var state = req.body.state;
  console.log("Name: " + name + " : " + state);
  res.status(200).send();
};

exports.sensors = function (req, res) {
	var data;
	data.temperatures = [];
	data.humidity = 66;
	for (let i=0; i<setup.sensors.length; ++i) {
		var temp;
		temp.name = setup.sensors[i].name;
		temp.value = 123;
		data.temperatures.push(temp)
	}
	res.json(data);
}
 
function switchStatus(script, command, status){
    var execString = script + " " + command + " " + status;
    console.log("Executing: " + execString);
    exec(execString, puts);
}
