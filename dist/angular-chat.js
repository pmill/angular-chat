(function() {
  "use strict";

  angular
    .module('angular-chat', []);
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
      lobby.connect(vm.data.lobbyName, vm.user).then(function() {
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
(function() {
  "use strict";

  angular
    .module('angular-chat')
    .factory('ChatRoomService', Service);

  Service.$inject = ['$window', 'SocketService'];

  function Service($window, SocketService) {
    var Chatroom = function(roomName, userDetails) {
      this.roomName = roomName;
      this.currentUser = userDetails;
    };

    Chatroom.prototype.connect = connect;
    Chatroom.prototype.disconnect = disconnect;
    Chatroom.prototype.onRoomCreated = onRoomCreated;
    Chatroom.prototype.onMessageReceived = onMessageReceived;
    Chatroom.prototype.onUserDetailsReceived = onUserDetailsReceived;
    Chatroom.prototype.onUserConnected = onUserConnected;
    Chatroom.prototype.onUserDisconnected = onUserDisconnected;
    Chatroom.prototype.sendMessage = sendMessage;
    Chatroom.prototype.sendUserConnected = sendUserConnected;
    Chatroom.prototype.sendUserDetails = sendUserDetails;
    Chatroom.prototype.startChatWithUser = startChatWithUser;

    return {
      fetchRoom: fetchRoom,
      startChatWithUser: startChatWithUser
    };

    function fetchRoom(roomName, userDetails) {
      return new Chatroom(roomName, userDetails);
    }

    function connect() {
      var room = this;

      $window.onbeforeunload = function () {
        SocketService.send(this.roomName, 'user.disconnected', this.currentUser);
      };

      return SocketService.connect().then(function() {
        return SocketService.subscribe(room.roomName);
      });
    }

    function disconnect() {
      SocketService.disconnect(this.roomName, this.currentUser);
    }

    function sendMessage(message) {
      return SocketService.send(this.roomName, 'message.received', message);
    }

    function sendUserConnected() {
      return SocketService.send(this.roomName, 'user.connected', this.currentUser);
    }

    function sendUserDetails() {
      return SocketService.send(this.roomName, 'user.details', this.currentUser);
    }

    function onRoomCreated(callback) {
      return SocketService.on(this.roomName, 'room.created', this.callback);
    }

    function onMessageReceived(callback) {
      return SocketService.on(this.roomName, 'message.received', this.callback);
    }

    function onUserConnected(callback) {
      var room = this;
      return SocketService.on(this.roomName, 'user.connected', onUserConnectedCallback);

      function onUserConnectedCallback(userDetails) {
        room.sendUserDetails(room.currentUser);
        callback(userDetails)
      }
    }

    function onUserDisconnected(callback) {
      return SocketService.on(this.roomName, 'user.disconnected', callback);
    }

    function onUserDetailsReceived(callback) {
      return SocketService.on(this.roomName, 'user.details', callback);
    }

    function startChatWithUser(instigator, user) {
      if (user.id === instigator.id) {
        throw "Can't start a chat with yourself!";
      }

      var roomName = createRoomChannelName([instigator.id, user.id]);
      fetchRoom(roomName, instigator).then(function() {
        return SocketService.send(roomName, 'room.created', roomName);
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
      disconnect: disconnect,
      on: on,
      onDisconnect: onDisconnect,
      room: room,
      send: send,
      subscribe: subscribe
    };

    function connect() {
      client = new ScaleDrone(socketConfig.channelId);

      return $q(function(resolve, reject) {
        client.on('open', function (error) {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    function disconnect(roomName, user) {
      send(roomName, 'user.disconnected', user);
      client.close();
    }

    function onDisconnect() {
      return $q(function(resolve, reject) {
        client.on('close', function () {
          console.log('close()');
          resolve();
        });
      });
    }

    function on(roomName, eventName, callback) {
      console.log('subscribing to event', roomName, eventName);
      room(roomName).on('data', function (data) {
        if (data.event == eventName) {
          console.log('processing message', roomName, eventName, data);
          callback(data.payload);
        }
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
  }
})();
(function(){angular.module("angular-chat").run(["$templateCache", function($templateCache) {$templateCache.put("lobby.html","<div class=\"row\">\n    <div class=\"col-md-4 col-xs-12\">\n        <div class=\"panel panel-default\">\n            <div class=\"panel-heading\">\n                <h3 class=\"panel-title\"><span class=\"fa fa-users\"></span> Lobby</h3>\n            </div>\n\n            <div class=\"list-group\">\n                <button class=\"list-group-item\"\n                        ng-repeat=\"u in vm.data.users\"\n                        ng-if=\"!vm.state.loading\"\n                        ng-click=\"vm.chatWithUser(u)\">\n                    <h4 class=\"list-group-item-heading\">\n                        <span class=\"fa fa-user\"></span> {{u.name}}\n                    </h4>\n                </button>\n                <span class=\"list-group-item\" ng-if=\"vm.state.loading\">\n                    <h4 class=\"list-group-item-heading\">\n                        <i class=\"fa fa-cog fa-spin fa-fw margin-bottom\"></i>\n                        loading...\n                    </h4>\n                </span>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"col-md-8\">\n        <div class=\"panel panel-default\" ng-if=\"vm.data.selectedRoom !== null\">\n            <div class=\"panel-heading\">\n                <h3 class=\"panel-title\"><span class=\"fa fa-comment-o\"></span> Room</h3>\n            </div>\n        </div>\n    </div>\n</div>\n");}]);})();