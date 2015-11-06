var debug = require('debug')('middleware:allow');
var ObjectID = require('bson-objectid');
var validators = require('../validators/validators.js');

module.exports = function auto(dependencies) {
  var user = dependencies.controllers.user;

  var exports = function(roles){
    //TODO: future role management middleware
    return (req, res, next) => {
      next();
    }
  };

  exports.$extend(validators, {

    self: function self(req, res, next) {
      exports.authenticated(req, res, () =>{
        if(req.auth.id !== req.params.user_id)
          return res.forbidden();
        next();
      });
    },

    authenticated: function authenticated(req, res, next) {

      var authorization = req.headers.authorization;
      debug('authorizing %s', authorization);
      if (!authorization) return res.unauthorized('Authorization header is required');

      var parts = authorization.split(' ');
      if (parts.length < 2 || parts[0]!=='Bearer' || parts[1].length!==24)
        return res.unauthorized("Improperly formed Authorization header");

      var token = parts[1];
      //TODO: add ?pop=1 to any authorized endpoint to force refresh
      user.auth(token)
        .then(data=>{
          debug('%s authorized', token);
          req.auth = data;
          next();
        })
        .catch(res.error({
          'NotFound›': 404
        }));
    }
  });

  return Promise.resolve(exports);
};
