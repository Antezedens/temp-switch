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
app.post('/relais', api.setRelais);
//app.put('/switches/:id', api.editSwitch);
//app.delete('/switches/:id', api.deleteSwitch);
 
// Start server
app.listen(80);
console.log("Server running at http://127.0.0.1:8000/");
