var util = require('util');
var exec = require('child_process').exec;
var setup = require('./setup');
var jf = require('jsonfile');
const fs = require('fs');
var checkrelaisstate = require('./checkrelaisstate.js');
const zlib = require('zlib');
const sqlite3 = require('sqlite3').verbose();
const relaisFile = './relais.json';
let errfct = function($err) {
        if ($err) {
                return console.error($err.message);
        }
}

let db = new sqlite3.Database('temp.sql', errfct);


// GET
exports.relais = function (req, res) {
  console.log('Getting switches.');
  jf.readFile(relaisFile, function(err, obj) {
    res.status(200).json(obj);
  });

};

// PUT
exports.setRelais = function (req, res) {
  var name = req.body.name;
  var state = req.body.state;
  console.log("Name: " + name + " : " + state);

  relais = jf.readFileSync(relaisFile);
  for (let i=0; i<relais.length; ++i) {
    if (relais[i].name == name) {
      relais[i].on = state;
    }
  }
  jf.writeFile(relaisFile, relais, {spaces: 2, EOL: '\n'}, function(err) {
      if (err) {
        console.log(err);
      } else {
        checkrelaisstate.update(relais);
      }
  });
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

exports.temperatures = function (req, res) {
  /*fs.writeFileSync("/tmp/test.txt", "[[2, 100], [3,120], [4, 110]]");
  const gzip = zlib.createGzip();
  const inp = fs.createReadStream('/tmp/test.txt');
  /*const out = fs.createWriteStream('/tmp/test.gz');
  inp.pipe(gzip).pipe(out);*/
  let buffer = zlib.gzipSync("[[2, 100], [3,120], [4, 110]]");
  //console.log()

  res.set('Content-Encoding', 'gzip');
  //res.set('Content-type', 'application/x-gzip');
  //let buffer = fs.readFileSync('/tmp/test.gz', 'binary')
  res.write(buffer, 'binary');

  res.status(200).end(null, 'binary');

  
	/*var data = {};
	var temps;
  var zip = new require('node-zip');
	db.each("SELECT date, t0, t1, t2, t3, t4, t5 FROM temp ORDER BY date", function(err, row) {
		temps = [row.t0, row.t1, row.t2, row.t3, row.t4, row.t5];

		data.temperatures = [];
		for (let i=0; i<setup.sensors.length; ++i) {
			var temp = {};
			temp.name = setup.sensors[i].name;
			temp.value = temps[i];
			data.temperatures.push(temp)
		}
		res.json(data);
	}, function(err) {

  });*/
}

function switchStatus(script, command, status){
    var execString = script + " " + command + " " + status;
    console.log("Executing: " + execString);
    exec(execString, puts);
}
