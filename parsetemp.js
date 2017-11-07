var fs = require('fs'),
    readline = require('readline');

var FileReader = require('filereader');

exports.getw1tempafter = function(promise, file) {    
    promise.then(function(v) {
        exports.getw1temp(file);
    })
}

function getw1tempinternal(files, resolve, result) {
    resolve(result);
}

function readw1(file, then) {
    var rd = readline.createInterface({
        //input: fs.createReadStream('/sys/bus/w1/devices/28-041780d810ff/w1_slave'),
        input: fs.createReadStream(file),
        console: false
    });

    var ok = false;
    var temp = false;
    rd.on('line', function(line) {
        var crc = line.search('crc=');
        var yes = line.search('YES');
        if (crc > 0 && yes > crc) {
            ok = true;
        } else {
            var t = line.search("t=");
            if (t && ok) {
                temp = parseInt(line.substring(t+2)) / 1000.0;
                console.log("ok " + temp);
            }
            else {
                console.log(line);
            }
        }
    });
    rd.on('close', function(line) {
        then(temp);
    });    
}

exports.getw1temps = function(files) {    

    
  var promise = new Promise(function(resolve, reject) {
      readw1(files[0], function(temp) {
          getw1tempinternal(files, resolve, [temp]);
      });
    });
  
    return promise;
}

//var p = exports.getw1temp("/sys/bus/w1/devices/28-041780d810ff/w1_slave")
var t1 = exports.getw1temps(["/sys/bus/w1/devices/28-041780d810ff/w1_slave"])
t1.then(function(v) {
    console.log("temp: " + v[0]);
})

/*Promise.all([t0, t1]).then(function(v) {
    console.log("temp: " + v[0] + " " + v[1]);    
});*/
