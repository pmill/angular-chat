(function() {
  "use strict";

  angular
    .module('angular-pusher-chat')
    .factory('ChatRoomService', Service);

  Service.$inject = ['PusherService'];

  function Service(PusherService) {
    var currentUser = null;
    var channelName = null;

    return {
      connectToRoom: connectToRoom,
      onChatCreated: onChatCreated,
      onMessageReceived: onMessageReceived,
      onUserDetailsReceived: onUserDetailsReceived,
      onUserJoined: onUserJoined,
      sendMessage: sendMessage,
      sendUserDetails: sendUserDetails,
      startChatWithUser: startChatWithUser
    };

    function connectToRoom(channel, userDetails) {
      channelName = channel;
      currentUser = userDetails;

      return PusherService.subscribe(channelName).then(function() {
        PusherService.send(channelName, 'user.connected', currentUser);
      });
    }

    function sendMessage(message) {
      return PusherService.send(channelName, 'message.received', message);
    }

    function sendUserDetails() {
      return PusherService.send(channelName, 'user.details', currentUser);
    }

    function onChatCreated() {
      return PusherService.event(channelName, 'chat.created');
    }

    function onMessageReceived() {
      return PusherService.event(channelName, 'message.received');
    }

    function onUserJoined() {
      return PusherService.event(channelName, 'user.connected');
    }

    function onUserDetailsReceived() {
      return PusherService.event(channelName, 'user.details');
    }

    function startChatWithUser(userId) {
      if (userId === currentUser.id) {
        throw "Can't start a chat with yourself!";
      }

      var channelName = createRoomChannelName([currentUser.id, userId]);
      connectToRoom(channelName).then(function() {
        return PusherService.send(channelName, 'chat.created', channelName);
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