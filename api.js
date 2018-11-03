var util = require('util');
var exec = require('child_process').exec;
var setup = require('./setup');
var request = require('request');
const fs = require('fs');
var checkrelaisstate = require('./checkrelaisstate.js');
const zlib = require('zlib');
let errfct = function($err) {
    if ($err) {
        return console.error($err.message);
    }
}

// GET
exports.relais = function(req, res) {
    console.log('Getting switches.');
    res.status(200).json(checkrelaisstate.readRelais());
};

// PUT
exports.setRelais = function(req, res) {
    var body = req.body;
    var id = body.id;
    console.log("Id: " + id + " : " + body);

    relais = checkrelaisstate.readRelais();
    var force = -1;
    for (let i = 0; i < relais.length; ++i) {
        if (relais[i].id == id) {
            if ('state' in body) {
		force = i;
                relais[i].on = (body.state & 1) == 1;
		relais[i].auto = (body.state & 2) == 2;
                if (body.state && 'excludes' in relais[i]) {
                    let excludes = relais[i].excludes;
                    for (let j = 0; j < relais.length; ++j) {
                        if (relais[j].id == excludes || relais[j].gpio == excludes) {
                            relais[j].on = false;
                            relais[j].turnon = "";
                            relais[j].turnoff = "";
                        }
                    }
                }
            }
            if ('turnon' in body) {
                relais[i].turnon = body.turnon;
            }
            if ('turnoff' in body) {
                relais[i].turnoff = body.turnoff;
            }
        }
    }
    checkrelaisstate.writeRelais(relais, force);
    res.status(200).send();
};

exports.setRelaisOnNode = function(req, res) {
    var body = req.body;
    console.log(req.query);
    

    res.set('Access-Control-Allow-Origin', '*');
    
    var host = 'http://10.5.5.' + req.query.nodeid
    if (process.env.USER == "fuchs") {
      host = "http://localhost:8000"
    }
    postdata = { id: req.query.id, state: req.query.value == '1'}

    request.post(host + '/relais', { json: postdata}, function (error, response, body) {
			if (error) {
				console.log("error: " + error);        
        res.write("error: " + error);
        res.status(500).send();
			} else {
			  console.log(response);
        res.status(200).send();
		  }
		});


};

function round2(x) {
  return Math.round(x * 100.0) / 100.0;
}

function f(s) {
    return " round(t" + s + ", 2) as t" + s + ",";
}

function hu(s) {
    return " round(h" + s + ", 1) as h" + s + ",";
}


function switchStatus(script, command, status) {
    var execString = script + " " + command + " " + status;
    console.log("Executing: " + execString);
    exec(execString, puts);
}

exports.pull = function(req, res) {
    res.write("<html><body><h3>git pull</h3><pre>");
    var stream = require('child_process').spawn('git', ['pull']).stdout
    stream.on('data', (data) => {
        res.write(data);
    });
    stream.on('close', (code) => {
        res.write("</pre></body></html>");
        res.status(200).end(null);
    });
}

exports.status = function(req, res) {
    res.write("<html><body><h3>status</h3><pre>");
    var stream = require('child_process').spawn('systemctl', ['status', 'web']).stdout
    stream.on('data', (data) => {
        res.write(data);
    });
    stream.on('close', (code) => {
        res.write("</pre></body></html>");
        res.status(200).end(null);
    });
}

exports.restart = function(req, res) {
    res.write("<html><body><h3>git pull</h3><pre>");
    var stream = require('child_process').spawn('git', ['pull']).stdout
    stream.on('data', (data) => {
        res.write(data);
    });
    stream.on('close', (code) => {
        res.write("</pre><h3>restart</h3><pre>")
        var stream2 = require('child_process').spawn('systemctl', ['restart', 'web']).stdout
        stream2.on('data', (data) => {
            res.write(data);
        });
        stream2.on('close', (code) => {

            res.write("</pre></body></html>");
            res.status(200).end(null);
        });
    });
}
