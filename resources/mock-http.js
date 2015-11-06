
var Router = require('router');
var bodyParser = require('body-parser');
var qs = require('querystring');
var debug = require('debug')('api:mock-http');


module.exports = function () {
  debug('Mock HTTP Server loading');
  var router = Router();
  router.use(bodyParser.json());
  router.use(function (req, res, next) {
    req.query = req._parsedUrl.query? qs.parse(req._parsedUrl.query) : {};
    next();
  });
  return Promise.resolve(router);
};

