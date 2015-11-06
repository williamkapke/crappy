
var ƒ = require('effd');
var http = require('mock-http');
var extensions = require('../http-extensions.js');
extensions.response.__proto__ = http.Response.prototype;

exports.route_handlers = function(router) {
  var interface = {};
  ['get', 'put', 'post', 'delete'].forEach(method=> {
    interface[method] = function(path, headers, body) {
      if(method !== 'get' && method !== 'del' && arguments.length>1) {
        body = arguments[arguments.length - 1];
        if (headers === body) headers = {};

        if (typeof body !== 'string')
          body = JSON.stringify(body);
      }

      return ƒ(Ø=> {
        if(body) {
          body = new Buffer(body);
          headers['content-length'] = body.length;
          headers['content-type'] = 'application/json';
        }
        var req = new http.Request({url:path, method:method, buffer:body, headers:headers});
        var res = new http.Response({onEnd: ()=>Ø.done(res)});
        res.__proto__ = extensions.response;
        router.handle(req, res, err=> {
          console.log('final handler executed');
          if(!res.statusCode)
            res.statusCode = 404;
          Ø(err, res);
        });
      });
    }
  });
  return interface;
};
