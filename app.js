var express = require("express");
var handlebars = require("express-handlebars").create({defaultLayout: "main"});

var app = express();
app.set('port', 3000);
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + "/public"));

app.get('/', function(req, res){
    res.type('application/json');
    response = {'message': 'App is healthy'};
    res.send(response);
});

app.get('/home', function(req, res){
    res.render('home');
});

app.listen(app.get('port'), function(){
    console.log("Server running at http://localhost:" + app.get('port'));
    console.log("Press Ctrl-C to terminate");
})