var fs = require('fs'),
    readline = require('readline');

var execSync = require('child_process').execSync;
var http = require('http');

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
            console.log("Failed once... " + e);
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
    } catch (e) {
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
    for (var i = 0; i < files.length; ++i) {
        result.push(readw1(files[i]));
    }
    return result;
}

exports.getinternet = function(ondone) {

    http.get('http://api.openweathermap.org/data/2.5/weather?lat=47.861100&lon=16.38851535&appid=2d9e793f39595d541211329eb858da6f', (res) => {
        const {
            statusCode
        } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // consume response data to free up memory
            res.resume();
            ondone(null, null);
            return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                console.log(parsedData);
                temp = parsedData['main']['temp'] - 273.15;
                humid = parsedData['main']['humidity'];
                ondone(temp, humid);
            } catch (e) {
                console.error(e.message);
                ondone(null, null);
            }
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
        ondone(null, null);
    });
}
