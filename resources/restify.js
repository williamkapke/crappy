
var ƒ = require('effd');
var restify = require('restify');
var extensions = require('../http-extensions.js');



module.exports = ()=>ƒ(Ø=>{
  console.log('loading restify');

  var _app = restify.createServer({ name: 'crappy' });
  _app.on('uncaughtException', uncaughtException);
  _app.pre(function extend_response(req,res,next) {
    res.__proto__ = extensions.response;
    next();
  });
  _app.pre(request_logger(_app.log));
  _app.pre(restify.jsonBodyParser({mapParams:false}));

  //limit the interface exposed
  var app = {};
  ['get','post','put','delete'].forEach(function (method) {
    app[method] = function() {
      var final = arguments[arguments.length-1];
      arguments[arguments.length-1] = function handler(req, res, next) {
        //restify wants us to litter our code with a bunch of
        // next() calls. Lets do it automatically.
        res.on('finish', next);
        final(req, res);
      };
      console.log('Registering route: %s %s', method.toUpperCase(), arguments[0]);
      //restify doesn't have the full 'delete' word :/
      if(method==='delete') method = 'del';
      _app[method].apply(_app, arguments);
    }
  });

  var port = process.env.PORT || 3000;
  _app.listen(port, ()=>{
    _app.log.info('Restify server listening on port ' + port);
    _app.log.level('warn');
    Ø.done(app);
  });
});



function request_logger(log) {
  log.streams[0].stream = process.stdout;
  log.level('info');

  var onFinished = require('on-finished');
  var audit_logger = log.child(audit_log_settings);

  return function logger(req, res, next) {
    onFinished(res, err=>{
      var latency = res.get('Response-Time');
      if (typeof latency !== 'number')
        latency = Date.now() - req._time;

      audit_logger.info({
        remoteAddress: req.connection.remoteAddress,
        //remotePort: req.connection.remotePort,
        req_id: req.getId(),
        req: req,
        res: res,
        err: err,
        latency: latency,
        secure: req.secure
      });
    });
    next();
  }
}

var audit_log_settings = {
  audit: true,
  level: 'info',
  serializers: {
    err: restify.bunyan.serializers.err,
    req: req => !!req && {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timers: timers(req)
    },
    res: res => !!res && {
      statusCode: res.statusCode,
      headers: res._headers
    }
  }
};

function timers(req) {
  var timers = {};
  if(req.timers) req.timers.forEach(time => {
    var t = time.time;
    timers[time.name] = Math.floor((1000000 * t[0]) + (t[1] / 1000));
  });
  return timers;
}

function uncaughtException(req, res, route, err) {
  //console.error('uncaughtException: %s', err.stack);
  this.log.warn(err);
  return res.send(500);
}
