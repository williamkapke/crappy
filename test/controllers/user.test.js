var should = require('should');
var crap = require('crap');
var ObjectID = require('bson-objectid');

var example_user = {
  first:'William'
};

describe('User Controller', function () {
  var controllers;
  before(done=>{
    crap.load.controllers('user').then(ctrlrs=>{
      controllers = ctrlrs;
      done();
    })
    .catch(done)
  });
  after(function(done){
    //give mongo.js time to persist to disk
    setTimeout(done,100)
  });


  it('should create a user', done=> {
    controllers.user.create(example_user)
      .then(result=>{
        should.exist(result);
        ObjectID.isValid(result.id).should.be.true;
        ObjectID.isValid(result.token).should.be.true;
        example_user = result;
        done();
      })
      .catch(done);
  });
  it('should get a user by id', done=> {
    controllers.user.get(example_user.id)
      .then(result=>{
        should.exist(result);
        result.should.eql(example_user);
        done();
      })
      .catch(done);
  });
  it('should get a user by token', done=> {
    controllers.user.get.by.token(example_user.token).then(result=>{
      should.exist(result);
      result.should.eql(example_user);
      done();
    })
    .catch(done);
  });
  it('should retrieve auth info for a user', done=> {
    controllers.user.auth(example_user.token).then(result=>{
      should.exist(result);
      result.should.eql({id: example_user.id, token: example_user.token});
      done();
    })
    .catch(done);
  });
  it('should get cached auth info for a user', done=> {
    controllers.user.auth(example_user.token).then(result=>{
      should.exist(result);
      result.should.have.property('cached', true);
      done();
    })
    .catch(done);
  });
  it('should update user', done=> {
    controllers.user.update(example_user.id, { last:"Kapke" }).then(result=>{
      should.exist(result);
      result.should.equal(1);
      //the saved data is validated in the "should find a deleted user" test
      done();
    })
    .catch(done);
  });
  it('should delete a user', done=> {
    controllers.user.delete(example_user.id).then(result=>{
      should.exist(result);
      result.should.equal(true);
      done();
    })
    .catch(done);
  });
  it('should find a deleted user', done=> {
    controllers.user.get(example_user.id).then(result=>{
      should.exist(result);
      result.should.eql(example_user.$extend({deleted:true, last:"Kapke"}));
      done();
    })
    .catch(done);
  });
  it('should not auth a deleted user', done=> {
    controllers.user.auth(example_user.id).then(result=>
      done(Error('auth should not have been successful'))
    )
    .catch(err=>{
      should.exist(err);
      /NotFound›/.test(err.message).should.equal(true);
      done();
    });
  });
});
