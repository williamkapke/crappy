var px = require('../px.js');
var ƒ = require('effd');
var ObjectID = require('bson-objectid');
var debug = require('debug')('providers:user');
var debugᐩ = ƒ.passthrough(debug);

module.exports = function auto(dependencies) {
  var resources = dependencies.resources;
  resources.users = ƒ.ƒ(resources.users, 'insert', 'update', 'find', 'findOne');
  resources.tokens = ƒ.ƒ(resources.tokens, 'del', 'hgetall', 'hmset');

  var interface = {

    auth: (token)=>
      debugᐩ('auth: searching cache for %s', token)
        .then(_=>resources.tokens.hgetall(token))
        .then(auth=>
          auth?
            debugᐩ('auth: %s found in cache', token)
              .then(_=>auth.$set('cached',true)) :

            debugᐩ('auth: searching db for %s', token)
              .then(_=>interface.get.by.token(token, px.user.auth))
              .then(auth=> {
                if(!auth || auth.deleted)
                  return ƒ.error('NotFound›');
                if(auth.banned)
                  return ƒ.error('Banned›');

                debugᐩ('auth: saving %j to cache', auth);
                resources.tokens.hmset(token, auth).catch(fire_forget);
                return auth;
              })
      )
    ,
    insert: (user)=>
      debugᐩ('insert: %j', user.$set('token', (new ObjectID).toString()))
        .then(_=>resources.users.insert(user))
        .then(result=>result.ops[0])
        .then(rename_id)
        .catch(duplicate_email)
    ,
    update: (id, data, options)=>
      debugᐩ('update: %j', data)
        .then(_=>resources.users.update({_id:ObjectID(id)}, {$set:data}, {w:1}))
        .catch(duplicate_email)
    ,
    delete: (id)=>
      debugᐩ('delete: %s', id)
        .then(_=>interface.get(id, {token:1}))
        .then(user=>resources.tokens.del(user.token).then(_=>user))
        .then(user=>resources.users.update({_id:ObjectID(id)}, {$set:{deleted:true}}))
        .then(result=>result.n===1)
    ,
    get: (id)=>
      debugᐩ('get: %s', id)
        .then(_=>resources.users.findOne({_id:ObjectID(id)}))
        .then(ensure_exists)
        .then(rename_id)
    ,
    find: {
      //all: (skip, limit)=>{},
      //by: {
      //  name: ()=>{}
      //}
    }
  };

  //semantics!
  interface.get.by = {
    email: (email,px)=>
      debugᐩ('get.by.email: %s', email)
        .then(_=>resources.users.findOne({email:email}, px && px.fields()))
        .then(ensure_exists)
        .then(rename_id),

    token: (token,px)=>
      debugᐩ('get.by.token: %s', token)
        .then(_=>resources.users.findOne({token:token}, px && px.fields()))
        .then(ensure_exists)
        .then(rename_id)
  };

  return ƒ.done(interface);
};


function rename_id(user) {
  user.id = user._id;
  delete user._id;
  return user;
}
function duplicate_email(err){
  return ƒ.error(err.code===11000 && err.message.includes('users.$email_1')? 'EmailExists›' : err);
}
function fire_forget(err) {
  if(!err) return;
  console.error("fire_forget received an error:", err);
}
var ensure_exists = obj => obj || ƒ.error('NotFound›');
