var parsetemp = require('./parsetemp');
var lt = require('./logtemp');

var dht22 = parsetemp.getDHT22(12);

lt.logtemp(function(cput, postdata, ts, transdata) {	
	lt.addtemp(postdata, ts, dht22['humidity'], 110, 0.15, transdata);
	lt.addtemp(postdata, ts, dht22['temp'],10, 0.15, transdata);
	lt.addtemp(postdata, ts, cput, 11, 10, transdata);
});	

require('./checkrelaisstate').check();
