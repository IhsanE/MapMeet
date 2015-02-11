mainApp.controller('friendMapViewCtrl',  ['$scope', '$http', '$timeout', '$rootScope',function($scope, $http, $timeout, $rootScope){
    
    $scope.init = function () {
        $rootScope.iSentRequest = 'no';
        $rootScope.friendStatus = 'not-connected';
        
    }
    
    $scope.friendConnectRequest = function (name) {
        console.log($rootScope.iSentRequest);
        console.log($rootScope.friendStatus);
        $rootScope.friendStatus = { 'connected' : 'not-connected' , 'not-connected' : 'request' , 'request' : 'connected' }[$rootScope.friendStatus];
        if ($rootScope.friendStatus === "connected"){
            if ($rootScope.iSentRequest === "no"){
                console.log("PRINTING THE ROOTSCOPE");
                var lo = ($rootScope.markerMap[$scope.userName]['position']['D']);
                var la = ($rootScope.markerMap[$scope.userName]['position']['k']);
                $http.post("/connectSocketConnection" , {user_name : $scope.userName, friend_name : name, lat : la, long : lo}).success(function(response){ // does server change
                    $("#"+name).css("background", "#FF3300"); // changes color
                });
            }
            else {
                $http.post("/cancelSocketConnection" , {user_name : $scope.userName, friend_name : name}).success(function(response){
                    $("#"+name).css("background", "#252523");
                });
                $rootScope.mapRemoveConnectedMarker(name);
                $rootScope.friendStatus = 'not-connected';
                $rootScope.iSentRequest = "no";
            }
        }
        
        else if ($rootScope.friendStatus === "not-connected"){
            $http.post("/cancelSocketConnection" , {user_name : $scope.userName, friend_name : name}).success(function(response){
                $("#"+name).css("background", "#252523");
            });
            $rootScope.mapRemoveConnectedMarker(name);
            $rootScope.iSentRequest = "no";
        }
        
        else { // request
            $http.post("/requestSocketConnection" , {user_name : $scope.userName, friend_name : name}).success(function(response){
                $("#"+name).css("background", "#0000FF");
                
            });  
            $rootScope.iSentRequest = "yes";
        }
        console.log($rootScope.iSentRequest);
    }
}]);