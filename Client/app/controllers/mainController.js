/*

ZOOM CODE


var markers = //some array;
var bounds = new google.maps.LatLngBounds();
for(i=0;i<markers.length;i++) {
   bounds.extend(markers[i].getPosition());
}

//center the map to a specific spot (city)
map.setCenter(center); 

//center the map to the geometric center of all markers
map.setCenter(bounds.getCenter());

map.fitBounds(bounds);

//remove one zoom level to ensure no marker is on the edge.
map.setZoom(map.getZoom()-1); 

// set a minimum zoom 
// if you got only 1 marker or all markers are on the same address map will be zoomed too much.
if(map.getZoom()> 15){
  map.setZoom(15);
}
*/


mainApp.controller('mainCtrl', ['$scope', '$http', '$timeout', '$rootScope', function($scope, $http, $timeout, $rootScope){
    var testFriend = {};
    $rootScope.markerMap = {};
    var lat = 0
    var long = 0;
    var marker;
    var map;
    function initialize(username) {
        function curLoc(p){
            lat = p.coords.latitude;
            long = p.coords.longitude;
            var myLatlng = new google.maps.LatLng(lat,long);
            var mapOptions = {
            zoom: 18,
            center: myLatlng
            }
            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            
            var myMarker = new google.maps.Marker({
                position : new google.maps.LatLng(lat,long),
                user : username,
                map : map,
                title : "Me"
            });
            
            $rootScope.markerMap[username] = myMarker;
        }
        navigator.geolocation.getCurrentPosition(curLoc, function (error) {alert(error.message);}, {enableHighAccuracy : true, timeout : 5000});
    }
    
    
    
    testFriend.name = 'ihsan';
    testFriend.latitude = 40.34234;
    testFriend.longitude = 90.23;
    $scope.connectedFriendsMap = [testFriend];
    console.log("Inside of mainCtrl");
    $http.post("/loginSuccess").success(function(response) {
        console.log(response);
        $scope.userName = response.split(" ")[0];
        $scope.userData = {user_name : $scope.userName};
        if (response.split(" ")[1].length > 1)
            $scope.displayPicture = $scope.userName+response.split(" ")[1];
        console.log($scope.displayPicture);
        google.maps.event.addDomListener(window, 'load', initialize($scope.userName));
        navigator.geolocation.watchPosition(showPosition, function (error) {alert("Please turn on your GPS/Location Settings :)");}, {enableHighAccuracy : true, timeout : 5000});
        
        $http.get("/friendRequestList").success(function(response) {
            $timeout( function (){
                console.log(response);
                console.log(response.displayPicture);
                if (response.length > 0)
                    $scope.userData.friendRequests = response.split(",");
                else 
                    $scope.userData.friendRequests = [];
            });
        });  
    });
    
    var socket = io.connect('/');
    socket.on('connect', function(msg){
        socket.send({id : "updateFriends", user_name : $scope.userName});
    });

    socket.on('message', function (data){
        if (data['id'] === "updateFriends"){
            $scope.userData.onlineFriends = data.onlineFriends;
            $scope.userData.offlineFriends = data.offlineFriends;
            $scope.$apply();
        }
    });

    socket.on('friendAppearOnline', function(data){
        
        if (data.user_name.trim() in $scope.userData.offlineFriends){
            delete $scope.userData.offlineFriends[data.user_name.trim()];
            $scope.userData.onlineFriends[data.user_name] = {
                user_name : data.user_name,
                first_name : data.first_name,
                last_name : data.last_name,
                display_picture : data.displayPicture
            };
        } 
        $scope.$apply();
    });

    socket.on('friendAppearOffline', function(data){
        
        if (data.user_name.trim() in $scope.userData.onlineFriends){
            delete $scope.userData.onlineFriends[data.user_name.trim()];
            $scope.userData.offlineFriends[data.user_name] = {
                user_name : data.user_name,
                first_name : data.first_name,
                last_name  : data.last_name,
                display_picture : data.displayPicture
            }
            $http.post("/cancelSocketConnection" , {user_name : $scope.userName, friend_name : data.user_name}).success(function(response){
                    $rootScope.mapRemoveConnectedMarker(data.user_name);
                });
        }
        $scope.$apply();
    });

    socket.on('friendshipRequestedJIT', function(data){
        if ($scope.userData.friendRequests.indexOf(data.user_name.trim()) == -1)
            $scope.userData.friendRequests.push(data.user_name.trim());
        $scope.$apply();
    });


    socket.on('friendDeletedMe', function(data){
        var inOnline = false;
        
        if (data.user_name.trim() in $scope.userData.onlineFriends){
            inOnline = true;
            delete $scope.userData.onlineFriends[data.user_name.trim()];
        }
        if (!inOnline){
            if (data.user_name.trim() in $scope.userData.offlineFriends){
                delete $scope.userData.offlineFriends[data.user_name.trim()];
            }
        }
        $scope.$apply();
    });


    socket.on('friendAcceptedMe', function(data){
        var friend = {};
        friend.user_name = data.user_name.trim();
        friend.first_name = data.first_name;
        friend.last_name = data.last_name;
        friend.display_picture = 'empty_display_picture.png';
        $scope.userData.onlineFriends[friend.user_name] = friend;
        $scope.$apply();
    });

    socket.on('requestClientSocketConnection', function(data){
        var user = data.user_name.trim();
        $rootScope.iSentRequest = "no";
        $rootScope.friendStatus = "request";
        console.log("Other computer hit mef");
        console.log($rootScope.friendStatus);
        $("#"+user).css("background", "#0000FF");  
    });

    socket.on('cancelClientSocketConnection', function(data){
        var user = data.user_name.trim();
        $rootScope.mapRemoveConnectedMarker(user);
        $rootScope.iSentRequest = "no";
        $rootScope.friendStatus = "not-connected";
        $("#"+user).css("background", "#252523");  
    });

    socket.on('connectClientSocketConnection', function(data){
        var user = data.user_name.trim();
        $rootScope.iSentRequest = "no";
        $rootScope.friendStatus = "connected";
        var la = data.lat;
        var lo = data.long;
        
        
        if (user in $rootScope.markerMap)
            mapUpdateMarkerPosition($rootScope.markerMap[user], la, lo);
        else
            mapAddConnectedMarker(user, la, lo, map);
        
        
        socket.send({id : "notifyFriendsOfLocationChange", user_name : $scope.userName, lat : $rootScope.markerMap[$scope.userName].position['k'], long :  $rootScope.markerMap[$scope.userName].position['D']}); // Should send to only this person that's connected

        $("#"+user).css("background", "#FF3300");  
    });
    
    function mapUpdateMarkerPosition(marker, lat, long) {
        marker.setPosition(new google.maps.LatLng(lat, long));
    }
    
    function mapAddConnectedMarker(user_name, lat, long, map){
        marker = new google.maps.Marker({
            position : new google.maps.LatLng(lat, long),
            user : user_name,
            map : map, 
            title : $scope.userData.onlineFriends[user_name].first_name + " " + $scope.userData.onlineFriends[user_name].last_name,
        });
        $rootScope.markerMap[user_name] = marker;
    }
    
    $rootScope.mapRemoveConnectedMarker = function (user_name){
        if (user_name in $rootScope.markerMap)
            $rootScope.markerMap[user_name].setMap(null);
        delete $rootScope.markerMap[user_name];
    }
    
    socket.on('friendLocationUpdate', function(data){
        console.log(data);
        if (data.user_name in $rootScope.markerMap)
            mapUpdateMarkerPosition($rootScope.markerMap[data.user_name], data.lat, data.long);
        else
            mapAddConnectedMarker(data.user_name, data.lat, data.long, map);
        //$rootScope.$apply();
    });
    
    
    
    
    
    function showPosition(position) {
        console.log(position);
        mapUpdateMarkerPosition($rootScope.markerMap[$scope.userName], position.coords.latitude, position.coords.longitude);
        // adjust centering
        socket.send({id : "notifyFriendsOfLocationChange", user_name : $scope.userName, lat : position.coords.latitude, long : position.coords.longitude});
    }

    
   
    
    
    
    
    
    $scope.removeFriend = function (friendName) {
         $http.post("/removeFriend", {user_name : $scope.userName, friend_name : friendName}).success(function(response) {
             console.log('1');
             $timeout(function(){
//any code in here will automatically have an apply run afterwards
                 if (response != null){
                     var inOffline = false;
                     
                     if (friendName in $scope.userData.offlineFriends){
                        inOffline = true;
                         delete $scope.userData.offlineFriends[friendName];
                     }
                     if (!inOffline){
                         if(friendName in $scope.userData.onlineFriends){
                            delete $scope.userData.onlineFriends[friendName];
                         }
                         }
                     }
                 });
             });
        }; 
    

    $scope.refuseFriendRequest = function (friendName) {
        $http.post("/refuseFriendRequest", {user_name : $scope.userName, friend_name : friendName}).success(function(response) {
             if (response != null){
                 $timeout( function (){
                     for (var i = 0; i <  $scope.userData.friendRequests.length; i++){
                                if (friendName === $scope.userData.friendRequests[i]){
                                    $scope.userData.friendRequests.splice($scope.userData.friendRequests.indexOf(friendName), 1);
                                }
                     }
                 });
             }
        });     
    }

    $scope.acceptFriendRequest = function (friendName) {
        $http.post("/acceptFriendRequest", {user_name : $scope.userName, friend_name : friendName}).success(function(response) {
             console.log(response);
             if (response != null){
                $timeout( function (){
                     for (var i = 0; i <  $scope.userData.friendRequests.length; i++){
                                if (friendName === $scope.userData.friendRequests[i]){
                                    $scope.userData.friendRequests.splice($scope.userData.friendRequests.indexOf(friendName), 1);
                                }
                     }
                     if (response.trim() == "online"){
                        var friend = {};
                        friend.user_name = friendName;
                        friend.display_picture = 'empty_display_picture.png';
                        $scope.userData.onlineFriends[friendName] = friend;
                     }
                     else {
                        var friend = {};
                        friend.user_name = friendName;
                        friend.display_picture = 'empty_display_picture.png';
                        $scope.userData.offlineFriends[friendName] = friend;
                     }
                 });
             }
        });     
    }
    
    $scope.onlineCount = function (){
        return Object.keys($scope.userData.onlineFriends).length;
    }
    
    $scope.offlineCount = function (){
        return Object.keys($scope.userData.offlineFriends).length;
    }
}]);
