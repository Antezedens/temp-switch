var fs = require('fs'),
    readline = require('readline');

var execSync = require('child_process').execSync;

exports.getDHT22 = function(pin) {
    for (var i = 0; i < 50; ++i) {
        try {
            var output = execSync("dht22/dht " + pin).toString('utf8');
            let result = output.split(" ");
            let out = {
                humidity: parseFloat(result[0].split("=")[1]),
                temp: parseFloat(result[1].split("=")[1])
            };
            console.log('h/t:' + out['humidity'] + "/" + out['temp']);
            return out;
        } catch (e) {
            console.log("Failed once...");
        }
    }
    return {
        humidity: "null",
        temp: "null"
    };
}

function getw1tempinternal(files, resolve, result) {
    resolve(result);
}

function readw1(file) {
  try {
    var line = fs.readFileSync(file).toString();
  } catch(e) {
    return "null";
  }

  var crc = line.search('crc=');
  var yes = line.search('YES');
  if (crc <= 0 || yes < crc) {
    return "null";
  }
  var t = line.search("t=");
  if (t) {
      temp = parseInt(line.substring(t + 2)) / 1000.0;
      console.log("ok " + temp);
      return temp;
  } else {
    console.log(file);
    return "null";
  }
}

exports.getw1temps = function(files) {
  console.log(files);
  var result = [];
  for (var i=0; i<files.length; ++i) {
    result.push(readw1(files[i]));
  }
  return result;
}
