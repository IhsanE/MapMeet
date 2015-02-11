/* var express = require("express"),
 app = express(),
 server = require("http").createServer(app),
 io = require("socket.io").listen(server);
server.listen(8000);*/

// Retrieve
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




item = {user_name : "c3lu", password : "password3", first_name : "janice", last_name : "lu", requests : ["friend1", "friend2"], friends : ["friend7"]};
readByUsername("c3lu", function(result){
	console.log(result);	
});


