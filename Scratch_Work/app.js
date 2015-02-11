var express = require('express');
var app = express();
var GLOBAL_Users_dict = {};
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
app.use(bodyParser());
app.use(cookieParser("This is a secret"));
app.use(session({secret: "This is a secret", key: "express.sid"}));
var MongoClient = require('mongodb').MongoClient;

/**
*Retrieves user in database
*
*@params : string, user_name
*@return : JSON, user that was queried
*/
function readByUsername (username, ret) {
	MongoClient.connect("mongodb://localhost:27017/Test_App", function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.findOne({user_name : username}, function(err, item){
				ret(item);
			});
  		}
	});
}

/**
*Insert user in database
*
*@params : string, user_name
*@return : JSON, user that was admitted
*/
function insert (record, ret) {
	MongoClient.connect("mongodb://localhost:27017/Test_App", function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.insert(record, function(err, result){
				db.close();
				ret(result);
			});
  		}
	});
}

/**
*Removes user from database
*
*@params : string, user_name
*@return : int, number of users removed
*/
function remove (username, ret) {
	MongoClient.connect("mongodb://localhost:27017/Test_App", function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.remove({user_name : username}, function(err, result){
				ret(result);
			});
  		}
	});
}

/**
*Updates user in database
*
*@params : [string, JSON, function] username, user, callback
*@return : int, number of users removed
*/
function update (username, user, ret) {
	MongoClient.connect("mongodb://localhost:27017/Test_App", function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.update({user_name : username}, user ,function(err, result){
				ret(result);
			});
  		}
	});
}

/**
*Add friend in database
*
*@params : [string, string] username, friend
*@return : boolean
*/
function confirmFriend (username, friendUserName, ret) {
	readByUsername(username, function(result){
		var isFriend = result.friends.indexOf(friendUserName);
		var contains = result.requests.indexOf(friendUserName);
		if (contains != -1){
			result.splice(contains, 1);
		}
		if (isFriend == -1){
			result.friends.push(friendUserName);
		}
		update(username, result, ret);
	});
	readByUsername(friendUserName, function(result){
		var isFriend = result.friends.indexOf(username);
		var contains = result.requests.indexOf(username);
		if (contains != -1){
			result.splice(contains, 1);
		}
		if (isFriend == -1){
			result.friends.push(username);
		}
		update(friendUserName, result, ret);
	});
}

/**
*Request friendship from user from database
*
* Requestor, Requestee (Guy asking for a friend, Person receiving the notification)
*
*@params : string, user_name
*@return : int, number of users removed
*/
function addFriend (username, friendUserName, ret) {
	readByUsername(friendUserName, function(result){
		isFriend = result.requests.indexOf(username);
		if (isFriend == -1){
			result.requests.push(username);
		}
		update(friendUserName, result, ret);
	});
}

/**
*Delete the request that requestor sent to requestee
*
* Requestor, Requestee (Person removing Guy from request)
*
*@params : string, user_name
*@return : int, number of users removed
*/
function removeFriendNotification (username, friendUserName, ret) {
	readByUsername(friendUserName, function(result){
		isFriend = result.requests.indexOf(username);
		if (isFriend != -1){
			result.requests.splice(username, 1);
		}
		update(friendUserName, result, ret);
	});
}

/**
*Delete user from database
*
*@params : string, user_name
*@return : int, number of users removed
*/
function removeUser (username, ret) {
	MongoClient.connect("mongodb://localhost:27017/Test_App", function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.remove({user_name : username}, function(err, item){
				ret(item);
			});
  		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
function restrict(req, res, next){
    if (req.session.user){
        next();
    }
    else {
        req.session.error = "Access denied!";
        res.redirect("/login");
    }
}

app.get('/',  function(request, response){
	response.sendFile(__dirname + '/HTML/login.html');
});

app.get('/main', restrict, function(request, response){
	response.sendFile(__dirname + '/HTML/main.html');
});

app.get('/angular.js', restrict, function(request, response){
	response.sendfile('/home/ihsan/bower_components/angular/angular.js');
});

app.post('/rsendFriendRequest', function(req, res){
    var requestor = req.body.requestor,
        requestee = req.body.requestee;
	addFriend(requestor, requestee, new function(){});
});

app.post('/racceptFriendNotification', function(req, res){
    var requestor = req.body.requestor,
        requestee = req.body.requestee;
	confirmFriend(requestor, requestee, new function(){});
});

app.post('/rTest', function(req, res){
    res.statusCode = 200;
	res.send({username : req.session.user});
    res.end();
});

app.post('/login', function(req, res){
    console.log(req.body);
	var username = req.body.username;
	readByUsername(username, function(result){
		if (result != null){
            console.log(result.password);
            console.log(req.body.password);
			if (result.password == req.body.password){
				req.session.user = username;	
				res.statusCode = 200;
                console.log("you're in");
				res.redirect("/main");
			}
		}
		else {
			res.statusCode = 204;
			res.write("Fail");
			res.end();
		}
	});
});



var server = app.listen(3000, function(){
    var host = server.address().address
    var port = server.address().port
        
    console.log('Example app listening at http://%s:%s', host, port);
});

