var jf = require('jsonfile');
var fs = require('fs');
var request = require('request');
var dateformat = require('dateformat');

var node = require('./nodeid.js').nodeid;
var relaisFile = './relais' + node + '.json'
const gpioBasePath = "/sys/class/gpio/"
let errfct = function($err) {
    if ($err) {
        return console.error($err.message);
    }
}

function gpioState(postdata, ts, id, pin, state, auto, force, relais, invert) {
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
       	let value = (state && !invert) || (!state && invert) ? "0\n" : "1\n";

        if (fs.readFileSync(valuePath).toString() != value || force) {
            console.log("updated value of " + pin);
            fs.writeFileSync(valuePath, value);
            postdata.push([dateformat(ts, "yyyy-mm-dd HH:MM:ss"), id, (state ? 1 : 0) | (auto << 1), relais]);
        }
    } else {
      postdata.push([dateformat(ts, "yyyy-mm-dd HH:MM:ss"), id, (state ? 1 : 0), relais]);
    }
}

function absolute_humidity(temp, rel_hum) {
    let res = (6.112 * Math.pow(Math.E, (17.67 * temp) / (temp + 243.5)) * rel_hum * 2.1674) / (273.15 + temp);
    console.log("abs hum of " + temp + "/" + rel_hum + " => " + res);
    return res;
}

exports.absolute_humidity = absolute_humidity;


const laterfile = '/tmp/relais.later';
	
function update(relais, force) {
  if (node == '1' && false) {
    return
  }
    var ts = Date.now();
    var postdata = [];
    var updateRelaisFile = false;
    try {
    	postdata = JSON.parse(fs.readFileSync(laterfile));
    	fs.unlinkSync(laterfile);
    } catch(e) {		
    }
  
    if (node == '10') {
      if (relais[5].auto) {
        temp = jf.readFileSync('/tmp/temperature.json');
        var t_in = temp.in.temp;
        var t_out = temp.out.temp;
        var h_in = temp.in.humidity;
        var h_out = temp.out.humidity;

        var abs_h_in = absolute_humidity(t_in, h_in);
        var abs_h_out = absolute_humidity(t_out, h_out);
        if (abs_h_in < abs_h_out + 3.5) {
          if (relais[5].on == true) {
              relais[5].on = false;
              updateRelaisFile = true;
          }
        }
        else if (h_in >= 92) {
          console.log("fan should be running");
            if (relais[5].on == false) {
                relais[5].on = true;
                updateRelaisFile = true;
            }
        } else if (h_in <= 89){
          console.log("fan should not be running");
            if (relais[5].on == true) {
                relais[5].on = false;
                updateRelaisFile = true;
            }
        }
      }
      const waterrelais = 3;
      if (relais[waterrelais].auto == 2) {
        temp = jf.readFileSync('/tmp/temperature.json');
        if (temp.water < 22) {
          if (relais[waterrelais].on == true) {
            relais[waterrelais].on = false;
            relais[waterrelais].auto = 0;
            updateRelaisFile = true;
          }
        }
      }
    }

    let now = (new Date()).getTime();
    console.log("update at " + now + " / " + new Date());
    for (let i = 0; i < relais.length; ++i) {
        let turnon = relais[i].turnon;
        let turnoff = relais[i].turnoff;
        console.log("turnon/off " + turnon + "/" + turnoff);
        if (turnon != "" && turnon <= now) {
            console.log("time to turnon! " + relais[i].gpio);
            relais[i].on = true;
            relais[i].turnon = "";
            updateRelaisFile = true;
        }
        if (turnoff != "" && turnoff <= now) {
            console.log("time to turnoff! " + relais[i].gpio);
            relais[i].on = false;
            relais[i].turnoff = "";
            updateRelaisFile = true;
        }

        gpioState(postdata, ts, relais[i].id + 200, relais[i].gpio, relais[i].on, relais[i].auto, force == i, relais[i], relais[i].invert);
    }
    
    if (updateRelaisFile) {
      doWriteRelais(relais, false);
    }
    
    if (postdata.length > 0) {
      const postreq = require('./postrequest');
      postreq.postrequest(laterfile, postdata, 0);
    }
}

exports.readRelais = function() {
    return jf.readFileSync(relaisFile);
}

function doWriteRelais(relais, doUpdate, force) {
    jf.writeFileSync(relaisFile, relais, {
        spaces: 2,
        EOL: '\n'
    });
    if (doUpdate) {
      update(relais, force);
    }
}

exports.writeRelais = function(relais, force) {
  doWriteRelais(relais, true, force);
}

exports.check = function() {
    update(exports.readRelais(), -1);
}
