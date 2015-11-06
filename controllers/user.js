var ƒ = require('effd');
var debug = require('debug')('controllers:user');
var debugᐩ = ƒ.passthrough(debug);
var ObjectId = require('bson-objectid');
var crypto = require('crypto');
var bcrypt = ƒ.ƒ(require('bcrypt'), 'compare', 'hash');

module.exports = function auto(dependencies) {
  var emailer = dependencies.controllers.emailer;
  var providers = dependencies.providers;

  var interface = {
    auth: (token)=>
      debugᐩ('auth: %s', token)
        .then(_=> providers.user.auth(token))
    ,
    //do not proxy; limit & control the arguments that are sent to the provider level
    get: (id)=>
      debugᐩ('get: %s', id)
        .then(_=>providers.user.get(id))
    ,
    create: (user)=>
      debugᐩ('create: %j', user)
        .then(_=>providers.user.insert(user))
    ,
    update: (id, data)=>
      debugᐩ('update: %s %j', id, data)
        .then(_=>data)
        .then(ƒ('password', interface.password.hash))
        .then(data=>providers.user.update(id, data))
        .then(result=>result.n)
    ,
    delete: (id, password)=>
      debugᐩ('delete: %s', id)
        .then(_=>providers.user.get(id))
        .then(user=>providers.user.delete(id))
        .then(_=>providers.user.delete(id))
    ,
    password: {
      compare: (password, hash)=>
        bcrypt.compare(password, hash)
          .then(match=> match || ƒ.error('InvalidPassword›'))
      ,
      hash: (password)=>
        bcrypt.hash(password, 12)
      ,
      reset: (email, token, desired)=>
        debugᐩ('password.reset: %s %s', email, token)
          .then(_=>interface.get.by.email(email))
          .then(validate(email, token))
          .then(user=> interface.update(user.id, {reset:'√', password:desired}))
      ,
      request: (email)=>
        debugᐩ('password.request: %s', email)
          .then(_=>interface.get.by.email(email))
          .then(user=> user.$set('reset', interface.password.reset.token()))
          .then(user=>
            interface.update(user.id, {reset:user.reset})
              .then(_=> emailer.forgot_password(email, token_hash(email, user.reset)))
          )
    }
  };

  //semantics!
  interface.get.by = {
    email: (email)=>
      debugᐩ('get.by.email: %s', email)
      .then(_=>providers.user.get.by.email(email))
    ,
    token: (token)=>
      debugᐩ('get.by.token: %s', token)
      .then(_=>providers.user.get.by.token(token))
  };

  interface.password.reset.token = ()=>ObjectId((new Date()).$addDays(1).getTime()/1000).toString();

  return Promise.resolve(interface);
};




function validate(email, token) {
  return (user)=> {
    if(expired(user.reset) || token_hash(email, user.reset) !== token)
      return ƒ.error('InvalidToken›');

    return user;
  }
}
function expired(token) {
  if(!token) return true;
  return !ObjectId.isValid(token) || ObjectId(token).getTimestamp() < new Date();
}
function token_hash(email, token) {
  return hash(email+token);
}
function hash(input){
  return crypto.createHash("md5").update(input, "utf8").digest('hex');
}
