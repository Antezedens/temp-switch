var id = parseInt(process.argv[2]);
var on = parseInt(process.argv[3]);

var checkrelaisstate = require('./checkrelaisstate.js');

var relais = checkrelaisstate.readRelais();
for (let i = 0; i < relais.length; ++i) {
    if (relais[i].id == id) {
      relais[i].on = (on != 0);
    }
}

checkrelaisstate.check();
