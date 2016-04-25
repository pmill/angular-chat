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