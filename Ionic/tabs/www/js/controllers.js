angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, $timeout, $ionicScrollDelegate, Chats) {
  $scope.chats = Chats.all();
  var delegateScroll = $ionicScrollDelegate.$getByHandle('mainScroll');
  $timeout(function(){
	window.setInterval(function(){delegateScroll.scrollBy(0, 100, true);}, 1000);
  });

  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
