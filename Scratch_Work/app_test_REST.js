var express = require('express');
var app = express();
var GLOBAL_Users_dict = {};

app.post('/rsendFriendRequest', function(req, res){
    var requestor = req.body.requestor,
	var requestee = req.body.requestee;
	addFriend(requestor, requestee, new function(){});
});

app.post('/racceptFriendNotification', function(req, res){
    var requestor = req.body.requestor,
	var requestee = req.body.requestee;
	confirmFriend(requestor, requestee, new function(){});
});

app.post('/rlogin', function(req, res){
	var username = req.body.username;
	readByUsername(username, function(result){
		if (result != null){
			if (result.password == req.body.password){
				req.session.user = username;	
				response.statusCode = 200;
				response.redirect("/main");
			}
		}
		else {
			res.statusCode = 204;
			res.write("Fail");
			res.end();
		}
	});
});

app.get('/main', restrict, function(request, response){
	response.sendfile(__dirname + '/');
});


var server = app.listen(3000, function(){
    var host = server.address().address
    var port = server.address().port
        
    console.log('Example app listening at http://%s:%s', host, port);
});
