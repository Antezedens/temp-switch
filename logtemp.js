var parsetemp = require('./parsetemp');
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

db.run('INSERT INTO temp (h0, t0, t1, t2, t3, t4, t5) VALUES (1, 2, 3, 4, 5, 6, 7)', errfct);
db.close();


parsetemp.getw1temps(["/sys/bus/w1/devices/28-041780d810ff/w1_slave", "/sys/bus/w1/devices/28-041780d810ff/w1_slave"]).then(function(v) {
	console.log("t: " + v);
});
