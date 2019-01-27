const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('data.sqlite');

db.all("select s.id, s.value, src.name, u.name as unit, s.unit as unitid, strftime('%s',s.tstamp)*1000 as tstamp, src.node \
from (\
   select id, unit, max(tstamp) as latest\
   from sensors group by id,unit\
) as x inner join sensors as s on s.id = x.id and s.unit = x.unit and s.tstamp = x.latest inner join sources as src on s.id = src.id inner join Unit as u on u.id = s.unit", (err, rows) => {
    if (err) {
      console.error(err.message);
    }
    console.log(rows);
  });

db.close();