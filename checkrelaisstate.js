var fs = require('fs');
const gpioBasePath = "/sys/class/gpio/"

function gpioState(pin, state) {
  let value = gpioBasePath + "gpio" + pin + "/value";
  let direction = gpioBasePath + "gpio" + pin + "/direction";
  if (!fs.existsSync(value)) {
    fs.writeFileSync(gpioBasePath + 'export', "" + pin);
  }
  console.log(fs.readFileSync(value));
  console.log(fs.readFileSync(direction));
}

exports.update = function(relais) {
  for (let i=0; i<relais.length; ++i) {
    console.log("checking relais: " + relais[i].name);
    gpioState(relais[i].gpio, relais[i].on);
  }
}
