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

var CLIENT_ID = process.env.CLIENT_ID || "clientIDNotSetWillGet404";
var CLIENT_SECRET = process.env.CLIENT_SECRET || "clientSecretNotSet";
var RANDOM_STRING = "superrandom";
var userToken;

app.get('/', function(req, res){
    res.type('application/json');
    response = {'message': 'App is healthy'};
    res.send(response);
});

app.get('/home', function(req, res){
    res.render("home");
});

app.get('/gitauth', function(req, res){
    console.log("Got request from GitHub: " + req.query.code);
    sessionCode = req.query.code;
    randomState = req.query.state;
    if (randomState !== RANDOM_STRING) {
        console.log("State is wrong! ERROR!");
        res.redirect("/home");
        return;
    } 
    var url = "https://github.com/login/oauth/access_token?accept=json&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&code=" + sessionCode;
    // console.log("Making request to: " + url);
    request.post({url: url, headers: {'Accept': 'application/json'}}, function(err, response, body){
        if (err) {
            console.log("Error getting user token: " + err);
            res.redirect("/home");
            return;
        } 
        var jsonBody = JSON.parse(body);
        // console.log(jsonBody);
        var token = jsonBody.access_token;
        // console.log("Got token: " + token);
        userToken = token;
        res.redirect("/home")
    });
});

app.get('/login', function(req, res){
    var url = "https://github.com/login/oauth/authorize?state=" + RANDOM_STRING + "&client_id=" + CLIENT_ID + "&scope=user%20user:email%20user:follow%20repo";
    res.render("login", {url: url});
});

app.post('/login', function(req, res){
    username = req.body.username;
    if (username === "") {
        res.render("login");
        return;
    }
    res.render("home");
});

app.post('/repo', function(req, res){
    userName = req.body.username;
    if (userName === "") {
        res.render("repo", {userName: userName});
        return;
    }
    res.render("repo", {userName: userName});
});

app.listen(app.get('port'), function(){
    console.log("Server running at http://localhost:" + app.get('port'));
    console.log("Press Ctrl-C to terminate");
})