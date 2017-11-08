var util = require('util');
var exec = require('child_process').exec;
var setup = require('./setup');
const sqlite3 = require('sqlite3').verbose();
let errfct = function($err) {
        if ($err) {
                return console.error($err.message);
        }
}

let db = new sqlite3.Database('temp.sql', errfct);

 
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
	var data = {};
	var temps;
	db.get("SELECT * FROM temp ORDER BY date DESC LIMIT 1", function(err, row) {
		console.log("last row " + row);
		data.humidity = row.h0;
		temps = [row.t0, row.t1, row.t2, row.t3, row.t4, row.t5];

		data.temperatures = [];
		for (let i=0; i<setup.sensors.length; ++i) {
			var temp = {};
			temp.name = setup.sensors[i].name;
			temp.value = temps[i];
			data.temperatures.push(temp)
		}
		res.json(data);
	});
}
 
function switchStatus(script, command, status){
    var execString = script + " " + command + " " + status;
    console.log("Executing: " + execString);
    exec(execString, puts);
}
