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
app.get('/relais', api.relais);
app.get('/sensors', api.sensors);
app.get('/temperatures', api.temperatures);
app.post('/relais', api.setRelais);
//app.put('/switches/:id', api.editSwitch);
//app.delete('/switches/:id', api.deleteSwitch);

const user = process.env.USER;
const port = (user == "fuchs") ? 8000 : 80;

// Start server
app.listen(port);
console.log("Server running on port " + port + " [" + user + "]");
