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

var BASE_URL = "https://api.github.com"
var CLIENT_ID = process.env.CLIENT_ID || "clientIDNotSetWillGet404";
var CLIENT_SECRET = process.env.CLIENT_SECRET || "clientSecretNotSet";
var RANDOM_STRING = "superrandom";
var userToken;

// API helpers ==============================================================
function getData(url, withAuth, callback) {
    if (withAuth && userToken) {
        url += "?access_token=" + userToken;
    }
    console.log("Making GET with url: " + url);
    request.get({url, headers: {'user-agent': 'node.js'}}, function(err, response, body){
        if (err){
            console.log("Error making GET call: " + err);
            // return "";
            callback("");
        }
        var jsonBody = JSON.parse(body);
        // console.log(jsonBody);
        callback(jsonBody);
    })
}

function postData(url, withAuth, body, callback) {
    if (withAuth && userToken) {
        url += "?access_token=" + userToken;
    }
    console.log("Making GET with url: " + url);
    request.post({url, headers: {'user-agent': 'node.js', 'Content-Type': 'application/json'}, json: body}, function(err, response, body){
        if (err){
            console.log("Error making GET call: " + err);
            // return "";
            callback("");
            return;
        }
        console.log("REPO NAME: " + body.name);
        // console.log(body);
        // console.log(response);
        callback(body);
    })
}

// Base routes ==============================================================
app.get('/', function(req, res){
    res.type('application/json');
    response = {'message': 'App is healthy'};
    res.send(response);
});

app.get('/home', function(req, res){
    res.render("home", {userToken: userToken});
});

// Auth routes =================================================================
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
    res.render("login", {url: url, userToken: userToken});
});

app.post('/login', function(req, res){
    username = req.body.username;
    if (username === "") {
        res.render("login");
        return;
    }
    res.render("home");
});

// Repo Routes ================================================================
app.post('/repo', function(req, res){
    userName = req.body.username;
    var url = BASE_URL;
    var useAuth = true;
    if (userName === "") {
        // get logged in user's repos 
        url += "/user/repos";
    } else {
        // get repos for unauth user 
        useAuth = false;
        url += "/users/" + userName + "/repos";
    }
    var repoData = []
    getData(url, useAuth, function(body){
        console.log("BODY: " + body[0].name);
        if (body === ""){
            console.log("Error");
        } else {
            body.forEach(function(r){
                var repo = {};
                repo.repoName = r.name;
                repo.repoCreated = r.created_at;
                repo.repoDesc = r.description;
                repoData.push(repo);
            });
        }
        var dataCount = repoData.length;
        res.render("repo", {userName: userName, repoArray: repoData, dataCount: dataCount, userToken: userToken});
    });
});

app.post('/repo/create', function(req, res){
    // Only for authenticated users 
    var repoName = req.body.reponame;
    if (!userToken || !repoName) {
        res.redirect("/home");
        return;
    }
    var repoDesc = req.body.description;
    var url = BASE_URL + "/user/repos"
    // will default to MIT license and no README
    var postBody = {'name': repoName, 'description': repoDesc, 'license_template': 'mit'};
    postData(url, true, postBody, function(body){
        if (body === ""){
            console.log("Error getting POST response");
            res.redirect("/home");
            return;
        }
        console.log("User: " + body.owner.login);
        var repoData = []
        var repo = {};
        repo.repoName = body.name;
        repo.repoCreated = body.created_at;
        repo.repoDesc = body.description;
        var repoOwner = body.owner.login;
        repoData.push(repo);
        res.render("repo", {userName: repoOwner, repoArray: repoData, dataCount: 1, userToken: userToken});
    });
});

// Server setup
app.listen(app.get('port'), function(){
    console.log("Server running at http://localhost:" + app.get('port'));
    console.log("Press Ctrl-C to terminate");
})