var fs = require('fs'),
    readline = require('readline');

    
exports.getw1temp = function(file) {    
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
    return temp;
}

console.log("temp: " + exports.getw1temp("/sys/bus/w1/devices/28-041780d810ff/w1_slave"));