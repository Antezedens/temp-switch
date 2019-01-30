const sqlite3 = require('sqlite3').verbose();

exports.relais = function(req, res) {
  let db = new sqlite3.Database('data.sqlite');

  db.all("select rel.id, rel.name, rel.nodeid, s.value, (strftime('%s', rel.turnon) * 1000) as turnon, (strftime('%s', rel.turnoff) * 1000) as turnoff \
 from (\
  select id, unit, max(tstamp) as latest \
  from sensors \
  where unit = 2 \
  group by id,unit\
  ) as x inner join sensors as s on s.id = x.id and s.unit = x.unit and s.tstamp = x.latest join relais as rel on s.id = rel.id ; ", (err, rows) => {
      if (err) {
        console.error(err.message);
      }
	  //console.log(rows);
      db.close();
      res.write(JSON.stringify(rows));
      res.status(200).send();      
    });

}
