var express = require('express'),
    api = require('./api');
var app = express();
var bodyParser     =        require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var node = require('./nodeid.js').nodeid;
var auth = function(req, res, next) {
  next();
}
if (node == "1") {
  var jf = require('jsonfile');
  cred = jf.readFileSync('./cred.js');
  var basicAuth = require('express-basic-auth');
  auth = basicAuth({
    users: cred,
    challenge: true
  });
}
/*app.configure(function(){
  app.use(express.bodyParser());
});*/

// JSON API
app.use('/', express.static('html'));
app.use('/view/', express.static('html'));
app.get('/localRelais', auth, api.localRelais);
app.post('/relais', auth, api.setRelais);
app.get('/relais', auth, require('./api/relais.js').relais);
app.get('/pull', auth, api.pull);
app.get('/status', auth, api.status);
app.get('/restart', auth, api.restart);
app.get('/setRelaisOnNode', auth, api.setRelaisOnNode);
app.get('/current', require('./api/current.js').current);
app.get('/history', require('./api/history.js').history);
app.post('/sensor', require('./api/sensor.js').sensor);
app.get('/sensorlive', require('./api/sensorlive.js').sensorlive);
app.get('/irrigation', api.getIrrigation);
app.post('/irrigation', api.setIrrigation);
//app.put('/switches/:id', api.editSwitch);
//app.delete('/switches/:id', api.deleteSwitch);

require('./checkrelaisstate').check();

const user = process.env.USER;
const port = (user == "fuchs") ? 8000 : 80;

// Start server
app.listen(port);
console.log("Server running on port " + port + " [" + user + "]");
