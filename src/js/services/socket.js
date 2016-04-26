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