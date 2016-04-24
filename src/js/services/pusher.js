(function() {
  "use strict";

  angular
    .module('angular-pusher-chat')
    .factory('PusherService', Service);

  Service.$inject = ['$pusher', '$q', 'pusherConfig'];

  function Service($pusher, $q, pusherConfig) {
    var pusher = null;

    return {
      channel: channel,
      connect: connect,
      event: event,
      send: send,
      subscribe: subscribe
    };

    function connect() {
      console.log('PusherService.connect');
      var client = new Pusher(pusherConfig.apiKey, pusherConfig);
      pusher = $pusher(client);
    }

    function event(channelName, eventName) {
      return $q(function(resolve, reject) {
        channel(channelName).bind('client-' + eventName, function (data) {
          resolve(data);
        });
      });
    }

    function send(channelName, eventName, payload) {
      console.log('PusherService.send', channelName, eventName, payload);
      channel(channelName).trigger(channelName, 'client-' + eventName, payload);
    }

    function subscribe(channelName) {
      console.log('PusherService.subscribe(\'' + channelName + '\')');
      if (pusher === null) {
        connect();
      }

      return $q(function(resolve, reject) {
        var channel = pusher.subscribe(channelName);

        channel.bind('pusher:subscription_succeeded', function () {
          resolve(channel);
        });

        channel.bind('pusher:subscription_error', function () {
          reject(channel);
        });
      });
    }

    function channel(channelName) {
      console.log('PusherService.channel', channelName);
      return pusher.channel(channelName);
    }
  };
})();