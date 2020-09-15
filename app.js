var express = require('express');
var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var fs = require('fs-extra');
var request = require('request');
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
app.use(busboy());
app.use(bodyParser());
app.use(cookieParser("This is a secret"));
app.use(session({secret: "This is a secret", key: "express.sid"}));
app.use(express.static(__dirname + "/Client/"));
var MongoClient = require('mongodb').MongoClient;
var socketRooms = {};
var server = require('http').Server(app);
var io = require('socket.io')(server);


app.set('port', (process.env.PORT || 3000));

server.listen(app.get('port'), function () {

    console.log("Node app is running at localhost:" + app.get('port'));
});



function getUserDisplayPicture (username, ret){
    MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.findOne({user_name : username}, {displayPicture : 1},function(err, item){
                console.log("line 26");
                console.log(item);
                if (!err)
				ret(item);
                else ret(null);
			});
  		}
	});
}

/**
*Retrieves user in database
*
*@params : string, user_name
*@return : JSON, user that was queried
*/
function readByUsername (username, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.findOne({user_name : username}, function(err, item){
                if (!err)
				ret(item);
                else ret(null);
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
	MongoClient.connect(uri, function(err, db) {
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

function userExists (username, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.findOne({user_name : username}, function(err, item){
                if (item)
                    ret(1);
                else ret(0);
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
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.remove({user_name : username}, function(err, result){
				ret(result);
			});
  		}
	});
}


function getFirstLastName (username, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
			var collection = db.collection('Users');
			collection.findOne({user_name : username},function(err, result){
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
	MongoClient.connect(uri, function(err, db) {
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
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
            console.log(username);
			var collection = db.collection('Users');
			collection.update({user_name : friendUserName}, {$addToSet : {'requests' : username}},function(err, item){
				if (!err){
                    console.log(item + " this is the item");
                    ret("ok");
                }
                else ret(null);
			});

  		}
	});
}

function insertFriend (username, friendUserName, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
            console.log(username);
			var collection = db.collection('Users');
			collection.update({user_name : username}, {$addToSet : {'friends' : friendUserName}},function(err, item){
                console.log(err);
                console.log(item);
				if (!err){
                    ret("ok");
                }
                else ret(null);
			});

  		}
	});
}



function updateDisplayPicture (username, filename,ret){
    MongoClient.connect(uri, function (err, db){
        if (!err){
            console.log("We are connected");
            console.log(username + " we are adding a display picture to him");
            var collection = db.collection('Users');
            collection.update({user_name : username}, {$set : {'displayPicture' : filename}}, function(err, item){
                if (!err){
                    console.log(item  + " THIS IS OUR NEW DP FOR THIS USER");
                    ret('ok');
                }
                else ret(null);
            });
        }
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
function removeFriendRequest (username, friendUserName, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
            console.log(username);
			var collection = db.collection('Users');
			collection.update({user_name : username}, {$pullAll : {'requests' : [friendUserName]}},function(err, item){
				if (!err){
                    ret("ok");
                }
                else ret(null);
			});

  		}
	});
}

/**
*Delete user from database
*
*@params : string, user_name
*@return : int, number of users removed
*/
function removeUser (username, friendname, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
            console.log(username);
			var collection = db.collection('Users');
			collection.update({user_name : username}, {$pullAll : {'friends' : [friendname]}},function(err, item){
				if (!err){
                    collection.update({user_name : friendname}, {$pullAll : {'friends' : [username]}},function(err, item){
				        if (!err){
                            ret("ok");
                        }
                        else ret(null);
			         });
                }
                else ret(null);
			});

  		}
	});
}

// ADDS A FRIEND TO BOTH THE USERNAME, AND THE FRIENDUSERNAME
function acceptFriendRequest (username, friendUserName, ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
            console.log(username);
			var collection = db.collection('Users');
			collection.update({user_name : username}, {$addToSet : {'friends' : friendUserName}},function(err, item){
				if (!err){
                    ret("ok");
                }
                else ret(null);
			});
            collection.update({user_name : friendUserName}, {$addToSet : {'friends' : username}},function(err, item){
				if (!err){
                    ret("ok");
                }
                else ret(null);
			});

  		}
	});
}


function friendRequestList (username,  ret) {
	MongoClient.connect(uri, function(err, db) {
		if(!err) {
	    	console.log("We are connected");
            console.log(username);
			var collection = db.collection('Users');
            readByUsername(username, function(result){
                var requests = result.requests;
                requests['displayPicture'] = result.displayPicture;
                ret(requests);
            });

  		}
	});
}




////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
function restrict(req, res, next){
    if (req.session.user){
        next();
    }
    else {
        console.log("CHECKING RESTRICT");
        console.log(req.session.user);
        req.session.error = "Access denied!";
        res.redirect("/views/login.html");
    }
}

app.post('/displayImageUpload', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, filename){
        console.log("Uploading :" + filename);
        myFileName = req.session.user + filename.substring(filename.length-4, filename.length);
        fstream = fs.createWriteStream(__dirname + '/Client/displayPictures/' + myFileName);
        file.pipe(fstream);
        fstream.on('close', function(){
            console.log("Upload Finished of " + filename);
            updateDisplayPicture(req.session.user, myFileName,function(response){
                console.log("The upload went " + response);
            });
            res.redirect("/views/main.html");
        });

    });
});

app.post('/requestSocketConnection', function(req, res){
	user = req.body.user_name;
    friend = req.body.friend_name;
    io.to(socketRooms[friend]).emit("requestClientSocketConnection", {user_name : user}); // change color
    res.statusCode = 200;
    res.end();
});

app.post('/cancelSocketConnection', function(req, res){
	user = req.body.user_name;
    friend = req.body.friend_name;
    io.to(socketRooms[friend]).emit("cancelClientSocketConnection", {user_name : user}); // change color
    // TODO: Maybe I should put a check to see if the user/friend are even in <connectedFriends>?
    if (friend in socketRooms)
        if (socketRooms[friend] in io.sockets.connected)
            if (user in io.sockets.connected[socketRooms[friend]].connectedFriends)
                delete io.sockets.connected[socketRooms[friend]].connectedFriends[user];

    if (user in socketRooms)
        if (socketRooms[user] in io.sockets.connected)
            if (friend in io.sockets.connected[socketRooms[user]].connectedFriends)
                delete io.sockets.connected[socketRooms[user]].connectedFriends[friend];
    res.statusCode = 200;
    res.end();
});

app.post('/setFaceBookFriends', function(req, res){

    user = req.body.user_name;
    console.log('Setting up friends and stuff');
    console.log(user);
    req.session.user = user;
    friends = req.body.friends;
    displayPicture = req.body.display_picture;
    for (var id in friends){
        console.log(id);


                insertFriend(user, id, function (result){
                    console.log(result)
                });
                insertFriend(id, user, function (result){
                    console.log(result);
                });



    }
    var download = function(uri , callback){
                            request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(__dirname + '/Client/displayPictures/' + user + ".jpg")).on('close', callback);
                                        });
                            };
    download(displayPicture, function(){
        console.log("Done uploading Facebook Picture");

        updateDisplayPicture(user, user+".jpg", function(){
        res.statusCode = 200;
        res.end();
        })

    });

});


app.post('/checkFirstTimeFacebookLogin', function(req, res){
    console.log("we in here");
    user = req.body.user_name;
    fn = req.body.first;
    ln = req.body.last;
    userExists (user, function(result){
        if (result === 1){ // They're already in
            req.session.user = user;
            res.statusCode = 200;
            console.log("you're in already, stop trying to register!!!");
            res.redirect("/views/main.html");
        }
        else { // They're not in
            var JSON_user = {
                        first_name : fn,
                        last_name : ln,
                        user_name : user,
                        password : 'facebook is great',
                        requests : [],
                        displayPicture : 'empty_display_picture.png',
                        friends : []
                    };
            insert(JSON_user, function(result){
                console.log(result);
            });
            res.statusCode = 200;
            req.session.user = user;
            console.log("you're now in");
            res.write("first");
            res.end();
        }
    });
});

app.post('/connectSocketConnection', function(req, res){
	user = req.body.user_name;
    friend = req.body.friend_name;
    var la = req.body.lat;
    var lo = req.body.long;
    io.to(socketRooms[friend]).emit("connectClientSocketConnection", {user_name : user, lat : la, long : lo}); // change color
    io.sockets.connected[socketRooms[friend]].connectedFriends[user] = 'true';
    io.sockets.connected[socketRooms[user]].connectedFriends[friend] = 'true';
    res.statusCode = 200;
    res.end();
});

app.get('/home', restrict, function(request, response){
	response.sendfile(__dirname + '/Client/views/personalSite.html');
});

app.get('/', restrict, function(request, response){
	response.sendfile(__dirname + '/Client/views/personalSite.html');
});

app.get('/angular.js', restrict, function(request, response){
	response.sendfile(__dirname + '/Client/js/bower_components/angular/angular.js');
});

app.get('/robots.txt', restrict, function(request, response){
	response.sendfile(__dirname + '/Client/app/robots.txt');
});

app.get('/friendRequestList', restrict, function(request, response){
	var username = request.session.user;
    friendRequestList (username, function(result){
        console.log(result);
        response.write(result.toString());
        response.end();
    });
});

app.post('/racceptFriendNotification', function(req, res){
    var requestor = req.body.requestor,
        requestee = req.body.requestee;
	confirmFriend(requestor, requestee, new function(){});
});

app.post('/loginSuccess', function(req, res){
    res.statusCode = 200;
    var files = fs.readdirSync(__dirname + '/Client/displayPictures/');
    var displayName = "F";
    for (var i in files){
        if (files[i].substring(0, files[i].length-4) == req.session.user){
            displayName = files[i].substring(files[i].length-4, files[i].length); console.log(displayName);}
    }
	res.send(req.session.user + " " + displayName );
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
                //req.session.userDetails = result;
				res.statusCode = 200;
                console.log("you're in");
				res.redirect("/views/main.html");
			}
		}
		else {
			res.statusCode = 204;
			res.redirect("/views/login.html");
		}
	});
});

app.post('/register', function(req, res){
    console.log(req.body);
    var JSON_user = {
                        first_name : req.body.first_name,
                        last_name : req.body.last_name,
                        user_name : req.body.username,
                        password : req.body.password,
                        requests : [],
                        displayPicture : 'empty_display_picture.png',
                        friends : []
                    };
    insert(JSON_user, function(result){
        console.log(result);
    });
    res.statusCode = 200;
    res.redirect("/views/login.html");
});

app.post('/removeFriend', function(req, res){
    console.log(req.body.user_name);
    console.log(req.body.friend_name);
    removeUser (req.body.user_name.trim(), req.body.friend_name.trim(),function(result){
    if (req.body.friend_name.trim() in socketRooms){
        io.to(socketRooms[req.body.friend_name.trim()]).emit("friendDeletedMe", {user_name : req.body.user_name.trim()}); // notify the friend that he was deleted, assumig he's online
    }
    res.statusCode = 200;
    res.write(result);
    res.end();
    });
});

app.post('/addUser', function(req, res){
    addFriend (req.session.user, req.body.user_name.trim(),function(result){
    console.log(result + " THIS IS THE LOG OF ADDING A FRIEND");
    if (req.body.user_name.trim() in socketRooms){
        io.to(socketRooms[req.body.user_name.trim()]).emit("friendshipRequestedJIT", {user_name : req.session.user});
    }
    res.statusCode = 200;

    });
});

app.post('/refuseFriendRequest',  function(req, res){
    console.log(req.body.user_name);
    console.log(req.body.friend_name);
    removeFriendRequest (req.body.user_name.trim(), req.body.friend_name.trim(),function(result){
    res.statusCode = 200;
    res.write(result);
    res.end();
    });
});

app.post('/acceptFriendRequest',  function(req, res){
    console.log(req.body.user_name);
    console.log(req.body.friend_name);
    removeFriendRequest (req.body.user_name.trim(), req.body.friend_name.trim(),function(result){
        acceptFriendRequest (req.body.user_name.trim(), req.body.friend_name.trim(),function(result){
            res.statusCode = 200;
            var isFriendOnline = "";
            if (req.body.friend_name in socketRooms) {isFriendOnline = 'online';
                getFirstLastName(req.body.user_name, function(info){
                io.to(socketRooms[req.body.friend_name.trim()]).emit("friendAcceptedMe", {first_name : info.first_name, last_name : info.last_name, user_name : req.body.user_name.trim()});
                });
            }
            console.log(isFriendOnline);
            res.write(isFriendOnline);
            res.end();
            // ADD A PUSH NOTIFICATION SYSTEM VIA SOCKET.IO
        });
    });
});

// SHOULD PUT THE SOCKET STUFF IN ANOTHER FILE!

io.on('connection', function (socket){
    socket.connectedFriends = {};
    socket.on('message', function(data) {
        console.log(data);
        console.log("line 480");
        if (data.id == 'updateFriends'){
            if (!(data.user_name in socketRooms)){
                socket.join(data.user_name);
                socketRooms[data.user_name] = socket.id;
            }
            console.log(data.user_name + "  :  " + socket.id);


            readByUsername(data.user_name, function(result){
                var oofflineFriends = {};
                var oonlineFriends = {};
                var friends = result.friends;
                var fn = result.first_name;
                var ln = result.last_name;

                function iterateElements (friends, i, callback){
                    if (i == friends.length)
                        return callback();

                    var friend = {};
                        friend.user_name = friends[i];
                    getUserDisplayPicture(friend.user_name, function(item){
                        getFirstLastName(friend.user_name, function(rr){
                            console.log(rr);

                            friend.first_name = rr ? rr['first_name'] : "Won't"  ;
                            friend.last_name  = rr ? rr['last_name'] : "Show";


                        if (item){
                            friend.display_picture = item['displayPicture'];
                        }
                        else{
                            friend.display_picture = 'empty_display_picture.png';
                        }

                    console.log(friend);
                    if (friend.user_name in socketRooms){
                        oonlineFriends[friend.user_name] = friend;
                    }
                    else {
                        oofflineFriends[friend.user_name] = friend;
                    }
                        iterateElements(friends, i+1, callback);
                        });
                        });
                }
                iterateElements(friends, 0, function(){
                var JSON = {
                    id : "updateFriends",
                    onlineFriends : oonlineFriends,
                    offlineFriends : oofflineFriends
                };

                var NOTIFY = {
                    id : "friendAppearOnline",
                    user_name : data.user_name,
                    first_name : fn,
                    last_name : ln,
                    displayPicture : result.displayPicture

                };
                if (oonlineFriends != null){
                for (var i in oonlineFriends){
                    console.log(oonlineFriends[i]);
                    socket.broadcast.to(i).emit('friendAppearOnline', NOTIFY);
                }
                }
                console.log(JSON);
                socket.send(JSON);
                });
            });
        }

        else if (data.id === 'notifyFriendsOfLocationChange'){
            for (var friend in socket.connectedFriends){
                console.log(friend);
                console.log("THIS WAS MY NOTIFYFRIEND LOG");
                io.to(socketRooms[friend]).emit("friendLocationUpdate", {user_name : data.user_name, lat : data.lat, long : data.long});
            }
        }
    });

     socket.on('disconnect', function () {
         var userNameKeys = Object.keys(socketRooms);
         var userName;
         for (var i = 0;  i < userNameKeys.length; i++){
            if (socketRooms[userNameKeys[i]] === socket.id){
                var userName = userNameKeys[i]
            }
         }
         readByUsername(userName, function(result){ // ADD CHECK FOR NULL
                var oonlineFriends = [];
                if (result != null) {var friends = result.friends;
                                    var dp = result.displayPicture;
                                    }
                else{ var friends = null; var dp = 'empty_display_picture.png';}


                if (friends != null){
                for (var i = 0; i < friends.length; i ++){
                    var friend = friends[i];
                    if (friend in socketRooms){
                        oonlineFriends.push(friend);
                    }
                }
                }
                var NOTIFY = {
                    id : "friendAppearOffline",
                    first_name : result.first_name,
                    last_name : result.last_name,
                    user_name : userName,
                    displayPicture : dp
                };
                if (oonlineFriends != null){
                for (var i = 0; i < oonlineFriends.length; i++){
                    socket.broadcast.to(oonlineFriends[i]).emit('friendAppearOffline', NOTIFY);
                }
                }
            });
         console.log("*****CONNECTED FRIENDS*****");
         console.log(userName);
         console.log(socket.connectedFriends);
         delete socketRooms[userName];
         socket.destroy;
    });
});
