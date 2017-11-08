var util = require('util');
var exec = require('child_process').exec;
var setup = require('./setup');
var jf = require('jsonfile')
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
  jf.readFile('./relais.json', function(err, obj) {
    res.status(200).json(obj);
  });

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
