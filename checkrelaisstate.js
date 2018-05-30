const relaisFile = './relais.json';
var jf = require('jsonfile');
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
const gpioBasePath = "/sys/class/gpio/"
let errfct = function($err) {
    if ($err) {
        return console.error($err.message);
    }
}

function gpioState(pin, state) {
    if (process.env.USER != "fuchs") {

        let valuePath = gpioBasePath + "gpio" + pin + "/value";
        let directionPath = gpioBasePath + "gpio" + pin + "/direction";
        if (!fs.existsSync(valuePath)) {
            fs.writeFileSync(gpioBasePath + 'export', "" + pin);
        }
        if (fs.readFileSync(directionPath).toString() != "out\n") {
            console.log("updated direction of " + pin);
            fs.writeFileSync(directionPath, "out");
        }
        let value = state ? "0\n" : "1\n";

        if (fs.readFileSync(valuePath).toString() != value) {
            console.log("updated value of " + pin);
            fs.writeFileSync(valuePath, value);
            let db = new sqlite3.Database('relais.sql', errfct);
            let query = 'INSERT INTO relais (gpio, state) VALUES (' + pin + ', ' + (state ? 1 : 0) + ')';
            db.run(query, errfct);
            db.close();
        }
    } else {
        let db = new sqlite3.Database('relais.sql', errfct);
        let query = 'INSERT INTO relais (gpio, state) VALUES (' + pin + ', ' + (state ? 1 : 0) + ')';
        db.run(query, errfct);
        db.close();
    }
}

function absolute_humidity(temp, rel_hum) {
    let res = (6.112 * Math.pow(Math.E, (17.67 * temp) / (temp + 243.5)) * rel_hum * 2.1674) / (273.15 + temp);
    console.log("abs hum of " + temp + "/" + rel_hum + " => " + res);
}

function update(relais) {
    let db = new sqlite3.Database('temp.sql', errfct);
    db.get("SELECT date, t0, h0, internet_t, internet_h FROM temp WHERE h0 IS NOT NULL AND t0 IS NOT NULL AND" +
        " internet_h IS NOT NULL AND internet_t IS NOT NULL" +
        " ORDER BY date DESC LIMIT 1",
        function(err, row) {
            var t_in = row.t0;
            var t_out = row.internet_t;
            var h_in = row.h0;
            var h_out = row.internet_h;

            var abs_h_in = absolute_humidity(t_in, h_in);
            var abs_h_out = absolute_humidity(t_out, h_out);
            if (abs_h_in > abs_h_out + 3.5) {
              console.log("fan should be running");
                if (relais[5].on == false) {
                    relais[5].on = true;
                    exports.writeRelais(relais);
                }
            } else {
              console.log("fan should not be running");
                if (relais[5].on == true) {
                    relais[5].on = false;
                    exports.writeRelais(relais);
                }
            }

            console.log("update: " + relais);
            for (let i = 0; i < relais.length; ++i) {
                let turnon = relais[i].turnon;
                let turnoff = relais[i].turnoff;
                console.log("turnon/off " + turnon + "/" + turnoff);
                if (turnon != "" && new Date(turnon) <= new Date()) {
                    console.log("time to turnon! " + relais[i].gpio);
                    relais[i].on = true;
                    relais[i].turnon = "";
                    exports.writeRelais(relais);
                }
                if (turnoff != "" && new Date(turnoff) <= new Date()) {
                    console.log("time to turnoff! " + relais[i].gpio);
                    relais[i].on = false;
                    relais[i].turnoff = "";
                    exports.writeRelais(relais);
                }

                gpioState(relais[i].gpio, relais[i].on);
            }
        });

}

exports.readRelais = function() {
    return jf.readFileSync(relaisFile);
}

exports.writeRelais = function(relais) {
    jf.writeFile(relaisFile, relais, {
        spaces: 2,
        EOL: '\n'
    }, function(err) {
        if (err) {
            console.log(err);
        } else {
            update(relais);
        }
    });
}

exports.check = function() {
    update(exports.readRelais());
}