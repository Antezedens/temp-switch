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

function readw1(files, resolve, results) {
    var rd = readline.createInterface({
        //input: fs.createReadStream('/sys/bus/w1/devices/28-041780d810ff/w1_slave'),
        input: fs.createReadStream(files[0]),
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
        results.push(temp);
        if (files.length <= 1) {
            resolve(results);
        }
        else {
            files.shift();
            readw1(files, resolve, results);
        }
    });
}

exports.getw1temps = function(files) {


  var promise = new Promise(function(resolve, reject) {
      readw1(files, resolve, []);
    });

    return promise;
}
