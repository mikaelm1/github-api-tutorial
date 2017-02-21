var express = require("express");
var handlebars = require("express-handlebars").create({defaultLayout: "main"});
var bodyParser = require("body-parser");
var request = require("request");

var app = express();
app.set('port', 3000);
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res){
    res.type('application/json');
    response = {'message': 'App is healthy'};
    res.send(response);
});

app.get('/home', function(req, res){
    res.render('home');
});

app.post('/repo', function(req, res){
    userName = req.body.username;
    if (userName === "") {
        res.render("repo", {userName: userName});
        return
    }
    // request.get('https://api.github.com/users//repos')
    // request('http://www.google.com', function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         console.log(body) // Show the HTML for the Google homepage. 
    //     }
    //     })
    res.render("repo", {userName: userName});
});

app.listen(app.get('port'), function(){
    console.log("Server running at http://localhost:" + app.get('port'));
    console.log("Press Ctrl-C to terminate");
})