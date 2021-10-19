var jf = require('jsonfile');
var fs = require('fs');
var request = require('request');
var dateformat = require('dateformat');
var file = 'irrigation.json';

exports.readStatus = function() {
    try {	
    	return jf.readFileSync(file);
    }
    catch (err) {
    	return {
		'duration' : [10, 11, 12, 13, 14, 15],
		'on' : true,
		'time1' : '07:00',
		'time2' : ''
	};
    }
}

exports.write = function(irrigation) {
    jf.writeFileSync(file, irrigation, {
	    spaces: 2,
	    EOL: '\n'
    });
}
