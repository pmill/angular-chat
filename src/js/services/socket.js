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