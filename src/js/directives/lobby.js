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
      user: vm.user,
      selectedRoom: null
    };

    vm.state = {
      loading: true
    };

    vm.chatWithUser = chatWithUser;

    activate();

    function activate() {
      var lobby = ChatRoomService.fetchRoom(vm.data.lobbyName, vm.user);
      lobby.connect().then(function() {
        lobby.sendUserConnected();
        lobby.onUserConnected(userDetailsReceived);
        lobby.onUserDisconnected(userDisconnected);
        lobby.onUserDetailsReceived(userDetailsReceived);
        lobby.onRoomCreated(roomCreated);
      });
    }

    function chatWithUser(user) {
      if (vm.data.selectedRoom !== null) {
        vm.data.selectedRoom.disconnect();
      }

      if (user.room === null) {
        vm.data.selectedRoom = user.room;
      } else {
        vm.data.selectedRoom = user.room = ChatRoomService.startChatWithUser(vm.user, user)
      }

      vm.data.selectedRoom.connect().then(function() {
        vm.data.selectedRoom.sendUserConnected();
        vm.data.selectedRoom.onUserConnected(userDetailsReceived);
        vm.data.selectedRoom.onUserDisconnected(userDisconnected);
      });
    }

    function userDisconnected(userDetails) {
      delete vm.data.users[userDetails.id];
    }

    function userDetailsReceived(userDetails) {
      if (userDetails.id !== vm.data.user.id) {
        vm.data.users[userDetails.id] = userDetails;
        vm.state.loading = false;
        $scope.$apply();
      }
    }

    function roomCreated(roomName) {
      vm.data.rooms.push(roomName);
      $scope.$apply();
    }
  }
})();