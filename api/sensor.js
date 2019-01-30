const sqlite3 = require('sqlite3').verbose();

function timestamp(ts) {
  return ts > 0 ? "datetime(" + ts + "/1000,'unixepoch')" : "null";
}

exports.sensor = (req, res) => {
  let data = req.body;
  var values = [];
  var relais = [];
  for (var i=0;i<data.length; ++i) {
    let entry = data[i];
    values.push("('" + entry[0]+ "'," + (entry[1]%100) + ","+ Math.floor(entry[1]/100) + "," + entry[2]+")");
    if (entry.length > 3) {
      relais.push(entry[3]);
    }
  }
  let qu = "INSERT INTO sensors VALUES " + values.join(',') + ";";
  let db = new sqlite3.Database('data.sqlite');

  db.run(qu);
  
  for(var i=0;i<relais.length; ++i) {
    let value = relais[i];
    qu = "UPDATE relais SET turnon = " + timestamp(value.turnon) + ", turnoff = " + timestamp(value.turnoff) + " WHERE id = ?";
    db.run(qu, [value.id])
  }
  
  db.close();
  res.write('ok');
  res.status(200).send();      
}