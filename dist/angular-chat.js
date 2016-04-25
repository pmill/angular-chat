(function() {
  "use strict";

  angular
    .module('angular-chat', []);
})();
(function() {
  "use strict";

  angular
    .module('angular-chat')
    .factory('ChatRoomService', Service);

  Service.$inject = ['SocketService'];

  function Service(SocketService) {
    var currentUser = null;
    var roomName = null;

    return {
      connectToRoom: connectToRoom,
      onRoomCreated: onRoomCreated,
      onMessageReceived: onMessageReceived,
      onUserDetailsReceived: onUserDetailsReceived,
      onUserJoined: onUserJoined,
      sendMessage: sendMessage,
      sendUserConnected: sendUserConnected,
      sendUserDetails: sendUserDetails,
      startChatWithUser: startChatWithUser
    };

    function connectToRoom(channel, userDetails) {
      roomName = channel;
      currentUser = userDetails;

      return SocketService.connect().then(function() {
        return SocketService.subscribe(roomName);
      });
    }

    function sendMessage(message) {
      return SocketService.send(roomName, 'message.received', message);
    }

    function sendUserConnected() {
      return SocketService.send(roomName, 'user.connected', currentUser);
    }

    function sendUserDetails() {
      console.log('sendUserDetails');
      return SocketService.send(roomName, 'user.details', currentUser);
    }

    function onRoomCreated(callback) {
      return SocketService.on(roomName, 'room.created', callback);
    }

    function onMessageReceived(callback) {
      return SocketService.on(roomName, 'message.received', callback);
    }

    function onUserJoined(callback) {
      return SocketService.on(roomName, 'user.connected', callback).then(function() {
        console.log('onUserJoined');
        sendUserDetails(currentUser);
      });
    }

    function onUserDetailsReceived(callback) {
      return SocketService.on(roomName, 'user.details', callback);
    }

    function startChatWithUser(userId) {
      if (userId === currentUser.id) {
        throw "Can't start a chat with yourself!";
      }

      var roomName = createRoomChannelName([currentUser.id, userId]);
      connectToRoom(roomName).then(function() {
        return SocketService.send(roomName, 'chat.created', roomName);
      });
    }

    function createRoomChannelName(userIds) {
      userIds = userIds.sort();
      return 'private-chat-room-' + hashCode(userIds.join('|'));
    }

    function hashCode(s){
      return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    }
  }
})();
(function() {
  "use strict";

  angular
    .module('angular-chat')
    .factory('SocketService', Service);

  Service.$inject = ['$q', 'socketConfig'];

  function Service($q, socketConfig) {
    var client;
    var rooms = {};

    return {
      connect: connect,
      on: on,
      room: room,
      send: send,
      subscribe: subscribe
    };

    function connect() {
      client = new ScaleDrone(socketConfig.channelId);

      return $q(function(resolve, reject) {
        client.on('open', function (error) {
          console.log('open');
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    function on(roomName, eventName, callback) {
      return $q(function(resolve, reject) {
        room(roomName).on('data', function (data) {
          if (data.event == eventName) {
            callback(data.payload);
            return resolve(data.payload);
          }
        });
      });
    }

    function send(roomName, eventName, payload) {
      console.log('sending message', roomName, eventName, payload);
      client.publish({
        room: roomName,
        message: {
          event: eventName,
          payload: payload
        }
      });
    }

    function subscribe(roomName) {
      return $q(function(resolve, reject) {
        rooms[roomName] = client.subscribe(roomName);

        rooms[roomName].on('open', function (error) {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    function room(roomName) {
      return rooms[roomName];
    }
  };
})();
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
        ChatRoomService.onUserJoined(userDetailsReceived);
        ChatRoomService.onUserDetailsReceived(userDetailsReceived);
        ChatRoomService.onRoomCreated(roomCreated);
      });
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
(function(){angular.module("angular-chat").run(["$templateCache", function($templateCache) {$templateCache.put("lobby.html","<div>\n    <h1>Lobby {{vm.data.user}}</h1>\n\n    <ul>\n        <li ng-repeat=\"user in vm.data.users\">\n            {{user}}\n        </li>\n    </ul>\n</div>");}]);})();