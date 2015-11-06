var ƒ = require('effd');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('controller:emailer');
var interface;

module.exports = function auto(dependencies) {
  //singleton
  if(interface) return ƒ.done(interface);

  var resources = dependencies.resources;
  var settings = this.config.settings || {};
  var url_base = settings.url_base || '';

  var send = function(msg){
    var data = arguments[arguments.length-1];
    debug.apply(debug, arguments);
    return resources.emailer.send(data).then(_=>{
      interface.emit('sent', data);
      return data;
    });
  };

  interface = {
    welcome: (to) =>
      send('welcome: %s %s', to, {
        to: to,
        from: settings.from,
        subject: 'Welcome!',
        text: 'Glad to have you onboard :)'
      }),

    forgot_password: (to, hash) =>
      send('forgot_password: %s %s', to, hash, {
        to: to,
        from: settings.from,
        subject: 'Password Reset Request',
        text: `${url_base}/reset/${hash}/${to}`
      })
  };
  interface.__proto__ = EventEmitter.prototype;
  EventEmitter.call(interface);

  return ƒ.done(interface);
};
module.exports.auto = true;
module.exports.singleton = true;
