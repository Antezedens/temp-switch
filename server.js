var express = require('express'),
    api = require('./api');
var app = express();
var bodyParser     =        require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*app.configure(function(){
  app.use(express.bodyParser());
});*/

// JSON API
app.use(express.static('html'));
app.get('/localRelais', api.localRelais);
app.post('/relais', api.setRelais);
app.get('/relais', require('./api/relais.js').relais);
app.get('/pull', api.pull);
app.get('/status', api.status);
app.get('/restart', api.restart);
app.get('/setRelaisOnNode', api.setRelaisOnNode);
app.get('/current', require('./api/current.js').current);
app.get('/history', require('./api/history.js').history);
app.post('/sensor', require('./api/sensor.js').sensor);
//app.put('/switches/:id', api.editSwitch);
//app.delete('/switches/:id', api.deleteSwitch);

require('./checkrelaisstate').check();

const user = process.env.USER;
const port = (user == "fuchs") ? 8000 : 80;

// Start server
app.listen(port);
console.log("Server running on port " + port + " [" + user + "]");
