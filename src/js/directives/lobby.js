(function() {
  "use strict";

  angular
    .module('angular-pusher-chat')
    .directive('pmChatLobby', Directive);

  function Directive() {
    return {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: 'lobby.html',
      replace: true,
      controller: Controller,
      controllerAs: 'vm',
      bindToController: true
    };
  }

  Controller.$inject = ['$scope', 'ChatRoomService'];

  function Controller($scope, ChatRoomService) {
    var vm = this;

    vm.data = {
      users: {},
      chats: {}
    };

    activate();

    function activate() {
      ChatRoomService.connectToRoom('public-chat-users', vm.user).then(function() {
        ChatRoomService.onUserJoined().then(userDetailsReceived);
        ChatRoomService.onUserDetailsReceived().then(userDetailsReceived);
        ChatRoomService.onChatCreated().then(chatCreated)
      });
    }

    function userDetailsReceived(userDetails) {
      vm.data.users[userDetails.id] = userDetails;
    }

    function chatCreated(channelName) {
      vm.data.chats.push(channelName);
    }
  }
})();