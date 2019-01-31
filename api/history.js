const sqlite3 = require('sqlite3').verbose();
const zlib = require('zlib');

exports.history = (req, res) => {
	let body = req.body;
	let query = req.query;
	var id = query.id;
	var unit_v = query.unit;
	var unit2_v = query.unit2;
	
	res.set('Content-Encoding', 'gzip');	
	
	let db = new sqlite3.Database('data.sqlite');
	db.configure("busyTimeout", 5000);
	if (!unit2_v) {
		let unit = unit_v;
		let qu = "select strftime('%s', tstamp)*1000 as ts, value from sensors where id=? and unit=? ORDER BY ts";
		var resultArray = [];
		db.each(qu, [id, unit], (err, result) => {
			resultArray.push("[" + result.ts+","+result.value+"]");
		}, (err) => {
			db.close();
			let buffer = zlib.gzipSync("[" + resultArray.join(',') + "]");
			res.write(buffer, 'binary');
			res.status(200).end(null, 'binary');      
		});
	} else {
		let unit = Math.min(unit_v, unit2_v);
		let unit2 = Math.max(unit_v, unit2_v);
		let qu = "select strftime('%s', tstamp)*1000 as ts, value, unit from sensors where id=? and (unit=? or unit=?) ORDER BY ts,unit";
		var resultArray = [];
		
		var lastvalue = null;
		var lastvalue2 = null;
		
		lastrow = null;
		db.each(qu, [id, unit, unit2], (err, r) => {
			if (r.unit == unit) {
				if (lastvalue2 != null && lastrow != null) {
					resultArray.push("[" + lastrow.ts +"," + lastrow.value + ","+ lastvalue2 + "]");
				}
				lastvalue = r.value;
				lastrow = r;
			} else if (r.unit == unit2) {
				if (lastvalue != null) {
					resultArray.push("[" + r.ts + "," + lastvalue + "," + r.value + "]");
				}
				lastvalue2 = r.value;
				lastrow = null;
			}
		}, (err) => {
			db.close();
			let buffer = zlib.gzipSync("[" + resultArray.join(',') + "]");
			res.write(buffer, 'binary');
			res.status(200).end(null, 'binary');      
		});
	}	
}
