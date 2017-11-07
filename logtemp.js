var parsetemp = require('./parsetemp');
var setup = require('./setup');
const sqlite3 = require('sqlite3').verbose();
let errfct = function($err) {
	if ($err) {
		return console.error($err.message);
	}
}

let db = new sqlite3.Database('temp.sql', errfct);
//db.run('DROP TABLE IF EXISTS `temp`', errfct);
db.run('CREATE TABLE temp(`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `h0` int(3), ' +
	'`t0` float(2,2), `t1` float(2,2), `t2` float(2,2), `t3` float(2,2), `t4` float(2,2), `t5` float(2,2), `t6` float(2,2))', errfct);

w1_sensors = []
for (let i=0; i<setup.sensors.length; ++i) {
	var s = setup.sensors[i];
	if ('w1_id' in s) {
		w1_sensors.push(setup.w1_prefix + s.w1_id + '/w1_slave');
	}
}
console.log(w1_sensors);

parsetemp.getw1temps(w1_sensors).then(function(v) {
	console.log("t: " + v);
	db.run('INSERT INTO temp (h0, t0, t1, t2, t3, t4, t5) VALUES (null, null, ' + v +')', errfct);
	db.close();
});
