var util = require('util');
var exec = require('child_process').exec;
var setup = require('./setup');
const fs = require('fs');
var checkrelaisstate = require('./checkrelaisstate.js');
const zlib = require('zlib');
const sqlite3 = require('sqlite3').verbose();
let errfct = function($err) {
        if ($err) {
                return console.error($err.message);
        }
}

let db = new sqlite3.Database('temp.sql', errfct);
let db2 = new sqlite3.Database('relais.sql', errfct);


// GET
exports.relais = function (req, res) {
  console.log('Getting switches.');
  res.status(200).json(checkrelaisstate.readRelais());
};

// PUT
exports.setRelais = function (req, res) {
  var body = req.body;
  var name = body.name;
  console.log("Name: " + name + " : " + body);

  relais = checkrelaisstate.readRelais();
  for (let i=0; i<relais.length; ++i) {
    if (relais[i].name == name) {
      if ('state' in body) {
        relais[i].on = body.state;
	if (body.state && 'excludes' in relais[i]) {
	  let excludes = relais[i].excludes;
	  for (let j=0; j<relais.length; ++j) {
	    if (relais[j].name == excludes || relais[j].gpio == excludes) {
              relais[j].on = false;
              relais[j].switching = "";
            }
	  }
	}
      }
      if ('switching' in body) {
        relais[i].switching = body.switching;
      }
    }
  }
  checkrelaisstate.writeRelais(relais);
  res.status(200).send();
};

exports.sensors = function (req, res) {
	var data = {};
	var temps;
	db.get("SELECT * FROM temp ORDER BY date DESC LIMIT 1", function(err, row) {
		data.humidity = row.h0;
		temps = [row.t0, row.t1, row.t2, row.t3, row.t4, row.t5, row.cput];

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
  //console.log()

  res.set('Content-Encoding', 'gzip');
  //res.set('Content-type', 'application/x-gzip');
  //let buffer = fs.readFileSync('/tmp/test.gz', 'binary')
		var names = [];
		for (let i=0; i<setup.sensors.length; ++i) {
			names.push(setup.sensors[i].name);
		}

	var data = [];
	db.each("SELECT strftime('%s', date) as ts, t0, t1, t2, t3, t4, t5, cput FROM temp ORDER BY date", function(err, row) {
    data.push([row.ts, row.t0, row.t1, row.t2, row.t3, row.t4, row.t5, row.cput]);
	}, function(err) {
    let buffer = zlib.gzipSync(JSON.stringify({names: names, data: data}));
    res.write(buffer, 'binary');

    res.status(200).end(null, 'binary');

  });
}

exports.relaisHistory = function (req, res) {
	res.set('Content-Encoding', 'gzip');
	var data = {};

  	relais = checkrelaisstate.readRelais();
  	for (let i=0; i<relais.length; ++i) {
	    	data[relais[i].gpio] = [];
  	}
	db2.each("SELECT  strftime('%s', date) as ts, gpio, state FROM relais ORDER BY date", function(err, row) {
		data[row.gpio].push([row.ts, row.state]);

	}, function(err) {
		let buffer = zlib.gzipSync(JSON.stringify({data: data}));
		res.write(buffer, 'binary');
		res.status(200).end(null, 'binary');
	});

}

function switchStatus(script, command, status){
    var execString = script + " " + command + " " + status;
    console.log("Executing: " + execString);
    exec(execString, puts);
}
