var loginApp = angular.module('loginApp', []);
var mainApp = angular.module('mainApp', []).filter('keylength', function(){
  return function(input){
      console.log(input);
      if(!angular.isObject(input)){
      throw Error("Usage of non-objects with keylength filter!!")
    }
    return Object.keys(input).length;
  }
});
var registerApp = angular.module('registerApp', []);