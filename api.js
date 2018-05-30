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
exports.relais = function(req, res) {
    console.log('Getting switches.');
    res.status(200).json(checkrelaisstate.readRelais());
};

// PUT
exports.setRelais = function(req, res) {
    var body = req.body;
    var name = body.name;
    console.log("Name: " + name + " : " + body);

    relais = checkrelaisstate.readRelais();
    for (let i = 0; i < relais.length; ++i) {
        if (relais[i].name == name) {
            if ('state' in body) {
                relais[i].on = body.state;
                if (body.state && 'excludes' in relais[i]) {
                    let excludes = relais[i].excludes;
                    for (let j = 0; j < relais.length; ++j) {
                        if (relais[j].name == excludes || relais[j].gpio == excludes) {
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
    checkrelaisstate.writeRelais(relais);
    res.status(200).send();
};

exports.sensors = function(req, res) {
    var data = {};
    var temps;
    db.get("SELECT * FROM temp ORDER BY date DESC LIMIT 1", function(err, row) {
        data.humidity = row.h0;
        data.humidity_out = row.internet_h;
        temps = [row.t0, row.t1, row.t2, row.t3, row.t4, row.t5, row.cput, row.h0, row.internet_t, row.internet_h];

        data.temperatures = [];
        for (let i = 0; i < setup.sensors.length; ++i) {
            var temp = {};
            temp.name = setup.sensors[i].name;
            temp.value = Math.round(temps[i] * 100) / 100.0;
            temp.unit = setup.sensors[i].unit;
            data.temperatures.push(temp)
        }
        res.json(data);
    });
}

function f(s) {
    return " round(t" + s + ", 2) as t" + s + ",";
}

function hu(s) {
    return " round(h" + s + ", 1) as h" + s + ",";
}

exports.temperatures = function(req, res) {
    var fromts = req.query.ts;
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
    var data = [];

    for (let i = 0; i < setup.sensors.length; ++i) {
        names.push(setup.sensors[i].name);
        data.push([]);
    }


    var lastts = 0;
    var lastvalues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var lasttss = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var transition = [];

    function addpoint(ts, i, value, lasttss, delta) {
        if (ts < fromts[i]) {
            return;
        }

        if (lastvalues[i] != value) {
            var doit = true;

            if (Math.abs(lastvalues[i] - value) < delta) {
                if (transition[i] === null) {
                    transition[i] = ts;
                    doit = false;
                } else {
                    if (ts - transition[i] > 17) { // some minutes
                        data[i].push([transition[i], lastvalues[i]]);
                        lasttss[i] = lastts;
                        doit = true;
                    } else {
                        doit = false;
                    }
                }
            }
            if (doit) {
                if (lastts != lasttss[i] && lasttss[i] != 0) {
                    data[i].push([lastts, lastvalues[i]]);
                }

                data[i].push([ts, value]);
                lastvalues[i] = value;
                lasttss = ts;
                transition[i] = null;
            }
        } else {
            transition[i] = null;
        }
    }

    db.each("SELECT strftime('%s', date) as ts," + f(0) + f(1) + f(2) + f(3) + f(4) + f(5) + hu(0) + " cput, round(internet_t, 2) as internet_t, internet_h FROM temp ORDER BY date", function(err, row) {
        let ts = Math.floor(row.ts / 60);
        addpoint(ts, 0, row.t0, lasttss, 0.15);
        addpoint(ts, 1, row.t1, lasttss, 0.15);
        addpoint(ts, 2, row.t2, lasttss, 0.15);
        addpoint(ts, 3, row.t3, lasttss, 0.15);
        addpoint(ts, 4, row.t4, lasttss, 0.15);
        addpoint(ts, 5, row.t5, lasttss, 0.15);
        addpoint(ts, 6, row.cput, lasttss, 1.5);
        addpoint(ts, 7, row.h0, lasttss, 0.15);
        addpoint(ts, 8, row.internet_t, lasttss, 0.15);
        addpoint(ts, 9, row.internet_h, lasttss, 1.5);
        lastts = ts;
        //data.push([row.ts, row.t0, row.t1, row.t2, row.t3, row.t4, row.t5, row.cput]);
    }, function(err) {
        let buffer = zlib.gzipSync(JSON.stringify({
            names: names,
            data: data,
            lastts: lastts
        }));
        res.set('Content-Length', buffer.length);
        res.write(buffer, 'binary');

        res.status(200).end(null, 'binary');

    });
}

exports.relaisHistory = function(req, res) {
    res.set('Content-Encoding', 'gzip');
    var data = {};

    relais = checkrelaisstate.readRelais();
    for (let i = 0; i < relais.length; ++i) {
        data[relais[i].gpio] = [];
    }
    db2.each("SELECT  strftime('%s', date) as ts, gpio, state FROM relais ORDER BY date", function(err, row) {
        data[row.gpio].push([row.ts, row.state]);

    }, function(err) {
        let buffer = zlib.gzipSync(JSON.stringify({
            data: data
        }));
        res.write(buffer, 'binary');
        res.status(200).end(null, 'binary');
    });

}

function switchStatus(script, command, status) {
    var execString = script + " " + command + " " + status;
    console.log("Executing: " + execString);
    exec(execString, puts);
}

exports.temp_sql_bz2 = function(req, res) {
    var stream = require('child_process').spawn('bzip2', ['-c', 'temp.sql']).stdout
    stream.on('data', (data) => {
        res.write(data);
    });
    stream.on('close', (code) => {
        res.status(200).end(null, 'binary');
    });

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