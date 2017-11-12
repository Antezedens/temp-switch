var fs = require('fs');
var sqlite = require('sqlite3');
const gpioBasePath = "/sys/class/gpio/"

function gpioState(pin, state) {
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
	let db = new sqlite3.Database('temp.sql', errfct);
	db.run('INSERT INTO relais (gpio, state) VALUES (pin, ' + state ? 1:0 + ');');	
  }
}

exports.update = function(relais) {
  for (let i=0; i<relais.length; ++i) {
    gpioState(relais[i].gpio, relais[i].on);
  }
}
