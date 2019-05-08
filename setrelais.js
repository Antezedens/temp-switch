var id = parseInt(process.argv[2]);
var on = parseInt(process.argv[3]);

var checkrelaisstate = require('./checkrelaisstate.js');

var relais = checkrelaisstate.readRelais();
var ok = false;
for (let i = 0; i < relais.length; ++i) {
    if (relais[i].auto && relais[i].id == id) {
      relais[i].on = (on != 0);
      ok = true;
    }
}
if (!ok) {
  console.log("could not find auto gpio");	
}
else {
  checkrelaisstate.writeRelais(relais, -1);	
  console.log(relais);
  checkrelaisstate.check();
}

