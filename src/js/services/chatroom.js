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

    function startChatWithUser(userId) {
      if (userId === this.currentUser.id) {
        throw "Can't start a chat with yourself!";
      }

      var roomName = createRoomChannelName([this.currentUser.id, userId]);
      connectToRoom(roomName).then(function() {
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