const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('data.sqlite');

if (!unit2_v) {
	var unit = unit_v;
	let qu = "select strftime(tstamp)*1000 as ts, value from sensors where id=? and unit=? ORDER BY ts";
	db.each(qu, [id, unit], (err, result) => {
	// process each row here
	}
}