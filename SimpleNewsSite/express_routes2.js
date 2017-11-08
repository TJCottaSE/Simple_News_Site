/* Tony Cotta
*  SER 421 
*  Assignment 3
*  Last Modified 11/5/17
*/

var express = require('express');
var url = require('url');
const pug = require('pug');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session')
var parser = require('xml2js').Parser();
var xml2js = require('xml2js');
const templateFunction = pug.compileFile('views/baseTemplate.pug');
const logInFunction = pug.compileFile('views/LogInTemplate.pug');
const createStoryFunction = pug.compileFile('views/createStory.pug');
const showArticle = pug.compileFile('views/article.pug');
var app = express();
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Set up a session for the user
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: false
}));

app.use(function (req, res, next) {
    // if the user is not in the store add them as a guest
    if (!req.session.user) {
        req.session.user = 'guest';
        req.session.priv = 'Guest';
        console.log('UserID set to guest');
  }
  next()
});

// A couple of Redirects to the Main page
app.get('/', function (req, res) {
    console.log('Redirect from /');
    console.log("Session User: " + req.session.user);
    console.log("Session Privs: " + req.session.priv);
    res.redirect('/NewNews/News');
});
app.get('/NewNews/', function(req, res){
    console.log('Redirect from /NewNews/');
    console.log("Session User: " + req.session.user);
    console.log("Session Privs: " + req.session.priv);
    res.redirect('/NewNews/News');
});


// Landing Page from GET request
app.get('/NewNews/News', function(req, res){
    console.log("Session User: " + req.session.user);
    console.log("Session Privs: " + req.session.priv);

    // Try to break this into call back
    var xmlFile = __dirname + '/news.xml';
    var login = 'false';
    fs.readFile(xmlFile, "utf-8", function (error, text) {
        if (error) {
            throw error;
        }
        else {    
            parser.parseString(text, function (err, result) {        
                var articles = result['NEWS']['ARTICLE'];
                var pubArticles = {};
                var count = 0;
                // If the user is a subscriber show all articles
                if (req.session.priv == 'Subscriber'){
                    for (i = 0; i < articles.length; i++){
                        pubArticles[count] = articles[i]/*['TITLE']*/;
                        count++;
                    }
                    login = 'true';
                }
                /* If the user is a reporter, show all public articles
                *  and the articles they are the author of. This method
                *  assumes the username = author name
                */
                else if (req.session.priv == 'Reporter'){
                    for (i = 0; i < articles.length; i++){
                        if (articles[i]['PUBLIC'] == 'T' || 
                        articles[i]['AUTHOR'] == req.session.user){
                            pubArticles[count] = articles[i]/*['TITLE']*/;
                            count++;
                        }
                    }
                    login = 'true';
                }
                // The user is assumed to be a guest and only public
                // articles will be shown
                else {
                    for (i = 0; i < articles.length; i++){
                        if (articles[i]['PUBLIC'] == 'T'){
                            //console.log(articles[i]);
                            pubArticles[count] = articles[i]/*['TITLE']*/;
                            count++;
                        }
                    }
                }
                //console.log(pubArticles);
                res.render(
                    'baseTemplate',
                    {
                        user: req.session.user,
                        privledges: req.session.priv,
                        loggedIn: login,
                        stories: pubArticles
                    }
                );
            });
        }
    });
});



// Landing Page from POST request
app.post('/NewNews/News', function(req, res){
    // If username is in persistent store store their session

    // if username not in store, add them and store session
    if (req.session.priv == 'Guest') {
        var file = __dirname + '/newsusers.json';
        fs.readFile(file, 'utf-8', function(error, text){
            if (error){
                console.log(error);
                throw error;
            }
            else {
                var content2 = JSON.parse(text);
                var userList = {}
                //console.log("req.body.userName: " + req.body.userName);
                for (i = 0; i < content2.users.length; i++){
                    userList[i] = content2.users[i].name;
                }
                var inStore = 'false';
                for (j = 0; j < content2.users.length; j++){
                    //console.log(userList[j]);
                    if (userList[j] == req.body.userName){
                        req.session.user = content2.users[j].name;
                        req.session.priv = content2.users[j].role;
                        inStore = 'true';
                    }
                }    
                if (inStore == 'false') {
                    // Set up a new session
                    req.session.user = req.body.userName;
                    req.session.priv = req.body.userRole;
                    // Add them to the store
                    var name = req.body.userName;
                    var role = req.body.userRole;
                    var favorites = "";
                    var usr = {role, name, favorites};
                    content2.users.push(usr);
                    var text2 = JSON.stringify(content2);
                    // Almost have this working, just have to get the callback right
                     fs.writeFile('newsusers.json', text2, (err) => {
                         if (err) throw err;
                         console.log('The file has been saved!');                        
                     });
                };
            
            }
        })
        
    }
    else {
        req.session.user = req.body.userName;
        req.session.priv = req.body.userRole;
    }

    setTimeout(function() {
    var xmlFile = __dirname + '/news.xml';
    var login = 'false';
    fs.readFile(xmlFile, "utf-8", function (error, text) {
        if (error) {
            throw error;
        }
        else {    
            parser.parseString(text, function (err, result) {        
                var articles = result['NEWS']['ARTICLE'];
                var pubArticles = {};
                var count = 0;
                // If the user is a subscriber show all articles
                if (req.session.priv == 'Subscriber'){
                    for (i = 0; i < articles.length; i++){
                        pubArticles[count] = articles[i]/*['TITLE']*/;
                        count++;
                    }
                    login = 'true';
                }
                /* If the user is a reporter, show all public articles
                *  and the articles they are the author of. This method
                *  assumes the username = author name
                */
                else if (req.session.priv == 'Reporter'){
                    for (i = 0; i < articles.length; i++){
                        if (articles[i]['PUBLIC'] == 'T' || 
                        articles[i]['AUTHOR'] == req.session.user){
                            pubArticles[count] = articles[i]/*['TITLE']*/;
                            count++;
                        }
                    }
                    login = 'true';
                }
                // The user is assumed to be a guest and only public
                // articles will be shown
                else {
                    for (i = 0; i < articles.length; i++){
                        if (articles[i]['PUBLIC'] == 'T'){
                            //console.log(articles[i]);
                            pubArticles[count] = articles[i]/*['TITLE']*/;
                            count++;
                        }
                    }
                }
                //console.log(pubArticles);
                res.render(
                    'baseTemplate',
                    {
                        user: req.session.user,
                        privledges: req.session.priv,
                        loggedIn: login,
                        stories: pubArticles
                    }
                );
            });
        }
    });
    }, 150);
});


// Login Page
app.post('/NewNews/Logger', function(req, res, next){
    var referer = req.body.Logger;
    if (referer == 'Logout'){
        req.session.user = 'guest';
        req.session.priv = 'Guest';
        res.redirect('/');
    }
    else {
        if (req.session.priv == 'Guest'){
            res.render('LogInTemplate');
        }
        else {
            // Send Forbidden here
            res.status(403).end();
        }
    }
});

// Create story page
app.get('/NewNews/add', function(req, res){
    if (req.session.priv != 'Reporter'){
        res.status(403).end();
    }
    console.log('Create a new Story');
    res.render(
        'createStory',
        {
            user: req.session.user,
            privledges: req.session.priv
        }
    );
});

app.post('/NewNews/News/added', function(req, res){
    // Grab form data and write to news.xml asynch I think
    if (req.session.priv != 'Reporter'){
        res.status(403).end();
    }
    var xmlFile = __dirname + '/news.xml';
    var login = 'false';
    fs.readFile(xmlFile, "utf-8", function (error, text) {
        if (error) {
            console.log(error);
            throw error;
        }
        else {
            parser.parseString(text, function (err, result) {  
                if (err){
                    console.log(err);
                }
                else { // Build a new article in JSON
                    var TITLE = [req.body.title];
                    var AUTHOR = [req.session.user];
                    var PUBLIC = [req.body.visibility];
                    var CONTENT = [req.body.article];
                    var newArticle = {TITLE, AUTHOR, PUBLIC, CONTENT};
                    var json = JSON.stringify(result);
                    var obj = JSON.parse(json);
                    //console.log('Object: ')
                    //console.log(obj.NEWS);
                    obj.NEWS.ARTICLE.push(newArticle);
                    //console.log("\nAdded");
                    //console.log(obj.NEWS);
                    var builder = new xml2js.Builder();
                    var xml = builder.buildObject(obj);
                    fs.writeFile('news.xml', xml, (err) => {
                        if (err) throw err;
                        console.log('The file has been saved!');
                    });
                }
            })
        }
    })

    res.redirect('/NewNews/News');
});

app.get('/NewNews/view*', function(req, res){
    // Needs to cneck user auth here
    console.log('User: ' + req.session.user);
    console.log('Privs: ' + req.session.priv);
    var xmlFile = __dirname + '/news.xml';
    var login = 'false';
    fs.readFile(xmlFile, "utf-8", function (error, text) {
        if (error) {
            throw error;
        }
        else {    
            parser.parseString(text, function (err, result) {        
                var articles = result['NEWS']['ARTICLE'];
                var pubArticles = {};
                var article = {};
                var count = 0;
                var login = 'false';
                for (i = 0; i < articles.length; i++) {
                    if (articles[i]['TITLE'] == req.query.Title){
                        console.log('Added article: ' + articles[i]['TITLE']);
                        pubArticles[0] = articles[i];
                    }
                }
                // Make sure the user can access this article
                if (req.session.priv == 'Guest' && pubArticles[0]['PUBLIC'] == 'T'){
                    article[0] = pubArticles[0];
                }
                else if (req.session.priv == 'Reporter' && 
                (pubArticles[0]['PUBLIC'] == 'T' || pubArticles[0]['AUTHOR'] == req.session.user)){
                    article[0] = pubArticles[0];
                }
                else if (req.session.priv == 'Subscriber'){
                    article[0] = pubArticles[0];
                }
                else {
                    console.log('Illegal Access: Forbidden');
                    res.status(403).end();
                }
                
                if (req.session.priv != 'Guest'){
                    login = 'true'
                }
                res.render(
                    'article',
                    {
                        user: req.session.user,
                        privledges: req.session.priv,
                        loggedIn: login,
                        stories: pubArticles
                    }
                );
            });
        }
    });
});

app.post('/NewNews/deleted', function(req, res){
    
    if (req.session.priv != 'Reporter'){
        res.status(403).end();
    }
    var xmlFile = __dirname + '/news.xml';
    var login = 'false';
    fs.readFile(xmlFile, "utf-8", function (error, text) {
        if (error) {
            console.log(error);
            throw error;
        }
        else {
            parser.parseString(text, function (err, result) {  
                if (err){
                    console.log(err);
                }
                else { // Selct article to remove

                    var json = JSON.stringify(result);
                    var obj = JSON.parse(json);

                    console.log(obj.NEWS.ARTICLE.length);
                    var searchTitle = req.body.Title;
                    searchTitle = searchTitle.split('\"').join('');
                    searchTitle = searchTitle.split('[').join('');
                    searchTitle = searchTitle.split(']').join('');
                    for ( i = 0; i < obj.NEWS.ARTICLE.length; i++){
                       if (obj.NEWS.ARTICLE[i].TITLE == searchTitle){
                            if (obj.NEWS.ARTICLE[i].AUTHOR != req.session.user){
                                res.status(403).end();
                            }
                            else {
                                console.log('Made it here');
                                delete obj.NEWS.ARTICLE[i];
                            }
                        }
                    }
                    //console.log("\nAdded");
                    //console.log(obj.NEWS);
                    var builder = new xml2js.Builder();
                    var xml = builder.buildObject(obj);
                    fs.writeFile('news.xml', xml, (err) => {
                        if (err) throw err;
                        console.log('The file has been saved!');
                    });
                }
            })
        }
    })

    res.redirect('/NewNews/News');
});

app.get('/NewNews/delete?*', function(req, res){
    // Delete a story
    console.log('User: ' + req.session.user);
    console.log('Privs: ' + req.session.priv);
    var xmlFile = __dirname + '/news.xml';
    var login = 'false';
    fs.readFile(xmlFile, "utf-8", function (error, text) {
        if (error) {
            throw error;
        }
        else {    
            parser.parseString(text, function (err, result) {        
                var articles = result['NEWS']['ARTICLE'];
                var pubArticles = {};
                var article = {};
                var count = 0;
                var login = 'false';
                for (i = 0; i < articles.length; i++) {
                    if (articles[i]['TITLE'] == req.query.Title){
                        console.log('Added article: ' + articles[i]['TITLE']);
                        pubArticles[0] = articles[i];
                    }
                }
                if (req.session.priv == 'Reporter' && (pubArticles[0]['AUTHOR'] == req.session.user)){
                    article[0] = pubArticles[0];
                    login = 'true';
                }
                else {
                    console.log('Illegal Access: Forbidden');
                    res.status(403).end();
                }
                
                res.render(
                    'delete',
                    {
                        user: req.session.user,
                        privledges: req.session.priv,
                        loggedIn: login,
                        stories: article
                    }
                );
            });
        }
    });
});


// Catch malformed requests I hope
app.all('/', function (req, res){
    res.status(400).send("Bad Request")
});
app.all('/NewNews', function (req, res){
    res.status(400).send("Bad Request")
});
app.all('/NewNews/News', function (req, res){
    res.status(400).send("Bad Request")
});
app.all('/NewNews/Logger', function(req, res){
    res.status(400).send("Bad Request. Cannot Login");
});
app.all('/NewNews/add', function(req, res){
    res.status(400).send("Bad Request. Cannot Add");
});
app.all('/NewNews/News/added', function(req, res){
    res.status(400).send("Bad Request. Not added");
});
app.all('/NewNews/view*', function(req, res){
    res.status(400).send("Bad Request. Cannot View");
});
app.all('/NewNews/delete*', function(req, res){
    res.status(400).send("Bad Request. Cannot Delete");
});





app.listen(8080);
console.log('Server Started on port: 8080');


