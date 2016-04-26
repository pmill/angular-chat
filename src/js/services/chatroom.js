(function() {
  "use strict";

  angular
    .module('angular-chat')
    .factory('ChatRoomService', Service);

  Service.$inject = ['$window', 'SocketService'];

  function Service($window, SocketService) {
    var currentUser = null;
    var roomName = null;

    return {
      connectToRoom: connectToRoom,
      onRoomCreated: onRoomCreated,
      onMessageReceived: onMessageReceived,
      onUserDetailsReceived: onUserDetailsReceived,
      onUserConnected: onUserConnected,
      onUserDisconnected: onUserDisconnected,
      sendMessage: sendMessage,
      sendUserConnected: sendUserConnected,
      sendUserDetails: sendUserDetails,
      startChatWithUser: startChatWithUser
    };

    function connectToRoom(channel, userDetails) {
      roomName = channel;
      currentUser = userDetails;

      $window.onbeforeunload = function () {
        SocketService.send(roomName, 'user.disconnected', currentUser);
      };

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
      return SocketService.send(roomName, 'user.details', currentUser);
    }

    function onRoomCreated(callback) {
      return SocketService.on(roomName, 'room.created', callback);
    }

    function onMessageReceived(callback) {
      return SocketService.on(roomName, 'message.received', callback);
    }

    function onUserConnected(callback) {
      return SocketService.on(roomName, 'user.connected', onUserConnectedCallback);

      function onUserConnectedCallback(userDetails) {
        sendUserDetails(currentUser);
        callback(userDetails)
      }
    }

    function onUserDisconnected(callback) {
      return SocketService.on(roomName, 'user.disconnected', callback);
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