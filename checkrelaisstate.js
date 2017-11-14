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

exports.update = function(relais) {
  for (let i=0; i<relais.length; ++i) {
    gpioState(relais[i].gpio, relais[i].on);
  }
}
