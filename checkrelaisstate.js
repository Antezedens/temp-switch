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
  	  let query = 'INSERT INTO relais (gpio, state) VALUES (' + pin + ', ' + (state ? 1:0) + ')';
  	  db.run(query, errfct);
  	  db.close();
    }
  } else {
    let db = new sqlite3.Database('relais.sql', errfct);
    let query = 'INSERT INTO relais (gpio, state) VALUES (' + pin + ', ' + (state ? 1:0) + ')';
    db.run(query, errfct);
    db.close();
  }
}

function update(relais) {
  console.log("update: " + relais);
  for (let i=0; i<relais.length; ++i) {
    let turnon = relais[i].turnon;
    let turnoff = relais[i].turnoff;
    console.log("turnon/off " + turnon + "/" + turnoff);
    if (turnon != "" && new Date(turnon) < new Date()) {
      console.log("time to turnon! " + relais[i].gpio);
      relais[i].on = true;
      relais[i].turnon = "";
      exports.writeRelais(relais);
    }
    if (turnoff != "" && new Date(turnoff) < new Date()) {
      console.log("time to turnoff! " + relais[i].gpio);
      relais[i].on = false;
      relais[i].turnoff = "";
      exports.writeRelais(relais);
    }

    gpioState(relais[i].gpio, relais[i].on);
  }
}

exports.readRelais = function() {
  return jf.readFileSync(relaisFile);
}

exports.writeRelais = function(relais) {
  jf.writeFile(relaisFile, relais, {spaces: 2, EOL: '\n'}, function(err) {
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
