var ƒ = require('effd');
var debug = require('debug')('api:user');
var px = require('../px.js');

//module.exports =
//  require({
//    resources: 'api',
//    middleware: 'allow',
//    controllers: 'users'
//  })
//
//    .then(dependencies=>{
//      var interface = {};
//      return interface;
//    });

module.exports = function auto(dependencies) {
  debug('Loading User API');
  var api = dependencies.resources.http;
  var controllers = dependencies.controllers;
  var allow = dependencies.middleware.allow;

  var validate_password = password=>ƒ.passthrough(controllers.user.password.compare)(password, u=>u.password);
  var filter = (px)=> (obj)=> px.copy(obj);

  api.get('/', (req,res,next)=>
    res.json('This is CRAPPY!')
  );

  api.post("/authenticate", allow.user('{email,password}'), (req, res)=>{

    controllers.user.get.by.email(req.model.email)
      .then(validate_password(req.model.password))
      .then(filter(px.user.me))
      .then(res.json)
      .catch(res.error({
        'InvalidPassword›': 401,
        'NotFound›': 404
      }))

  });

  //user signup
  api.post("/users", allow.user('{name,email,password}'), (req, res)=>{

    controllers.user.password.hash(req.model.password)
      .then(hash =>controllers.user.create(req.model.$set("password", hash)))
      .then(filter(px.user.me))
      .then(res.json)
      .catch(res.error({
        'EmailExists›': { email:'exists' }
      }))

  });


  api.get("/me", allow.authenticated, (req, res)=>{

    controllers.user.get(req.auth.id)
      .then(filter(px.user.me))
      .then(res.json)
      .catch(err =>
        res.error(err)
      );

  });


  api.put("/me", allow.authenticated, allow.user('{name?,email?}'), (req, res)=>{

    //it *IS* valid to submit nothing...
    if(!Object.keys(req.model).length)
      return res.end();

    controllers.user.update(req.auth.id, req.model)
      .then(res.end)
      .catch(res.error({
        'EmailExists›': { email:'exists' }
      }))
  });


  api.delete("/me", allow.authenticated, allow.user('{password}'), (req, res)=>{

    controllers.user.get(req.auth.id)
      .then(validate_password(req.model.password))
      .then(user=> controllers.user.delete(user.id))
      .then(res.end)
      .catch(res.error({
        'InvalidPassword›': {password:'invalid'},
        'NotFound›': 404
      }));
  });


  api.put("/password", allow.authenticated, allow.password('{current,desired}'), (req, res)=>{

    controllers.user.get(req.auth.id)
      .then(validate_password(req.model.current))
      .then(hash=>controllers.user.update(req.auth.id, {password:req.model.desired}))
      .then(res.end)
      .catch(res.error({
        'InvalidPassword›': { current:'invalid' },
        'NotFound›': 404
      }))
  });


  api.post("/password/forgot", allow.user('{email}'), (req, res)=>{

    controllers.user.password.request(req.model.email)
      .then(res.end)
      .catch(res.error({
        'NotFound›': 404
      }))

  });

  api.post("/password/reset", allow.reset('{email,token,desired}'), (req, res)=>{

    controllers.user.password.reset(req.model.email, req.model.token, req.model.desired)
      .then(res.end)
      .catch(res.error({
        'InvalidToken›': { token:'invalid' },
        'NotFound›': 404
      }))

  });

  return ƒ.done(api);
};
