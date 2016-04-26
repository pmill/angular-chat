(function() {
  "use strict";

  angular
    .module('angular-chat')
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
      lobbyName: 'public-chat-users',
      users: {},
      rooms: [],
      user: vm.user
    };

    activate();

    function activate() {
      ChatRoomService.connectToRoom(vm.data.lobbyName, vm.user).then(function() {
        ChatRoomService.sendUserConnected();
        ChatRoomService.onUserConnected(userDetailsReceived);
        ChatRoomService.onUserDisconnected(userDisconnected);
        ChatRoomService.onUserDetailsReceived(userDetailsReceived);
        ChatRoomService.onRoomCreated(roomCreated);
      });
    }

    function userDisconnected(userDetails) {
      delete vm.data.users[userDetails.id];
    }

    function userDetailsReceived(userDetails) {
      if (userDetails.id !== vm.data.user.id) {
        vm.data.users[userDetails.id] = userDetails;
        $scope.$apply();
      }
    }

    function roomCreated(roomName) {
      vm.data.rooms.push(roomName);
      $scope.$apply();
    }
  }
})();