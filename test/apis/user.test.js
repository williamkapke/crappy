
var crap = require('crap');
var route_handler = require('../helpers.js').route_handlers;

//helpers
var ok = (done)=>_=>done();//used to wrap done() so nothing is passed to it.

var expect = (code, data)=>(res)=> {
  res.statusCode.should.equal(code);
  if(data!==undefined)
    res.json().should.eql(data);
  return res;
};
var success = expect(200);
var not_found = expect(404);
var unauthorized = expect(401);


describe('User API tests', function () {
  var handle;
  var emailer;
  var token;
  var require_token = ()=> {
    if (!token) throw Error('Cannot continue without token');
  };
  var authenticate = (email, password) =>
    handle.post('/authenticate', {email: email, password: password});

  before(done=>{
    Promise.all([
      crap.load.apis('user'),
      crap.load.controllers('emailer')
    ])
    .then(dependencies=>{
        handle = route_handler(dependencies[0].user);
        emailer = dependencies[1].emailer;
        done();
      })
    .catch(done)
  });

  function ensure_authentication_required(method, route) {
    it('should not allow unauthenticated requests', function (done) {
      handle[method](route)
        .then(unauthorized).then(ok(done))
        .catch(done)
    });

  }

  describe('POST /users', function () {
    it('should return an error if no data is posted', function (done) {
      handle.post('/users', {})
        .then(res=>{
          res.statusCode.should.equal(400);
          res.json().should.eql({ name:'missing', email:'missing', password:'missing' });
          done();
        })
        .catch(done)
    });
    it('should require a 6+ character password', function (done) {
      handle.post('/users', { name:'edily kap', email:'you@email.service', password:'short' })
        .then(res=>{
          res.statusCode.should.equal(400);
          res.json().should.eql({ password: 'invalid' });
          done();
        })
        .catch(done)
    });
    it('should create (signup) users', function (done) {
      handle.post('/users', { name:'edily kap', email:'you@email.service', password:'some hard password' })
        .then(res=>{
          res.statusCode.should.equal(200);
          res.json().should.have.property('token');

          return handle.post('/users', { name:'dair itiz', email:'dair@email.service', password:'some harder password' })
            .then(res=>{
              res.statusCode.should.equal(200);
              res.json().should.have.property('token');
              done();
            })
        })
        .catch(done)
    });
    it('should return an error if the email is aready used', function (done) {
      handle.post('/users', { name:'edily kap', email:'you@email.service', password:'some hard password' })
        .then(res=>{
          res.statusCode.should.equal(400);
          res.should.have.property('statusMessage', 'validation error');
          res.json().should.eql({ email:'exists' });
          done();
        })
        .catch(done)
    });
  });

  describe('POST /authenticate', function () {
    it('should fail authentication when the email is NOT found', function (done) {
      authenticate('not+you@email.service', 'faked1')
        .then(not_found)
        .then(ok(done))
        .catch(done)
    });
    it('should fail authentication if the password is incorrect', function (done) {
      authenticate('you@email.service', 'wrong1')
        .then(unauthorized)
        .then(ok(done))
        .catch(done)
    });
    it('should successfully authenticate valid credentials', function (done) {
      authenticate('you@email.service', 'some hard password')
        .then(success)
        .then(res=>{
          res.json().should.have.property('token');
          token = res.json().token;
          done();
        })
        .catch(done)
    });
  });

  describe('GET /me', function () {
    before(require_token);

    ensure_authentication_required('get','/me');
    it('should be able to retrieve profile info', function (done) {
      handle.get('/me', {authorization:'Bearer '+token})
        .then(res=>{
          res.statusCode.should.equal(200);
          var me = res.json();
          me.should.have.property('id').with.lengthOf(24);
          me.should.have.property('name', 'edily kap');
          me.should.have.property('email', 'you@email.service');
          me.should.have.property('token').with.lengthOf(24);
          done();
        })
        .catch(done)
    });
  });

  describe('PUT /me', function () {
    before(require_token);

    ensure_authentication_required('put','/me');
    it('should be able to update profile info', function (done) {
      handle.put('/me', {authorization:'Bearer '+token}, {name:'Edily Kap'})
        .then(res=>{
          res.statusCode.should.equal(200);
          res.json().should.equal("");

          return handle.get('/me', {authorization:'Bearer '+token})
            .then(res=>{
            res.statusCode.should.equal(200);
            var me = res.json();
            me.should.have.property('id').with.lengthOf(24);
            me.should.have.property('name', 'Edily Kap');
            me.should.have.property('email', 'you@email.service');
            me.should.have.property('token').with.lengthOf(24);
            done();
          })
        })
        .catch(done)
    });
    it('should NOT be able to update email with an email used by another account', function (done) {
      handle.put('/me', {authorization:'Bearer '+token}, {email:'dair@email.service'})
        .then(res=>{
          res.statusCode.should.equal(400);
          res.should.have.property('statusMessage', 'validation error');
          res.json().should.eql({ email:'exists' });

          return handle.get('/me', {authorization:'Bearer '+token})
            .then(res=>{
              res.statusCode.should.equal(200);
              var me = res.json();
              me.should.have.property('id').with.lengthOf(24);
              me.should.have.property('name', 'Edily Kap');
              me.should.have.property('email', 'you@email.service');
              me.should.have.property('token').with.lengthOf(24);
              done();
            })
        })
        .catch(done)
    });
    it('should be able to update email with the value it was previously', function (done) {
      handle.put('/me', {authorization:'Bearer '+token}, {email:'you@email.service'})
        .then(res=>{
          res.statusCode.should.equal(200);
          res.json().should.eql("");
          done();
        })
        .catch(done)
    });

  });


  describe('PUT /password', function () {
    before(require_token);

    ensure_authentication_required('put','/password');
    it('should be able to change password with old password', function (done) {
      handle.put('/password', {authorization:'Bearer '+token}, {current:'some hard password',desired:'imlazy'})
        .then(res => {
          res.statusCode.should.equal(200);
          res.json().should.eql("");

          //authenticate with changed password
          return authenticate('you@email.service', 'imlazy')
            .then(success)
            .then(ok(done))
        })
        .catch(done)
    });

  });

  var reset_token;
  describe('POST /password/forgot', function () {
    it('should return NotFound if the email isn\'t found', function (done) {
      handle.post('/password/forgot', {email:'not+you@email.service'})
        .then(not_found)
        .then(ok(done))
        .catch(done);
    });
    it('should attempt to send an password recovery email', function (done) {

      handle.post('/password/forgot', {email:'you@email.service'})
        .then(success)
        .catch(done);

      emailer.once('sent', email=>{
        email.should.have.property('text');
        email.text.should.match(/\/reset\/[a-z0-9]{32}\//);
        reset_token = email.text.split('/')[2];
        done();
      });
    });
  });

  describe('POST /password/reset', function () {
    it('should require {email,token}', function (done) {
      handle.post('/password/reset')
        .then(expect(400, { email:'missing', token:'missing', desired:'missing' }))
        .then(ok(done))
        .catch(done);
    });
    it('should require valid {email,token,desired} values', function (done) {
      handle.post('/password/reset', { email:'garbage@123', token:'some bs token', desired:'$$' })
        .then(expect(400, { email:'invalid', token:'invalid', desired:'invalid' }))
        .then(ok(done))
        .catch(done);
    });
    it('should check validity of token', function (done) {
      handle.post('/password/reset', { email:'you@email.service', token:'55f98f958cbf09a317881a7db98f76c2', desired:'$$$$$$$$$$$$$$$$$$$$$$$$$$$' })
        .then(expect(400, { token:'invalid' }))
        .then(ok(done))
        .catch(done);
    });
    it('should reset a password with a valid token and email', function (done) {
      if(!reset_token) done(Error('Cannot complete test without `reset_url`'));

      handle.post('/password/reset', { email:'you@email.service', token:reset_token, desired:'it\'s complicated!' })
        .then(success)
        .then(res=> authenticate('you@email.service', 'it\'s complicated!'))
        .then(success)
        .then(res=>{
          res.json().should.have.property('token');
          token = res.json().token;
          done();
        })
        .catch(done);
    });

  });

  describe('DELETE /me', function () {
    before(require_token);

    ensure_authentication_required('delete','/me');

    it('should\'t delete an account without the correct password', function (done) {
      handle.delete('/me', {authorization:'Bearer '+token}, { password:"wrong password" })
        .then(expect(400, {password:'invalid'}))
        .then(ok(done))
        .catch(done);
    });

    it('should delete an account', function (done) {
      handle.delete('/me', {authorization:'Bearer '+token}, { password:"it\'s complicated!" })
        .then(success)
        .then(ok(done))
        .catch(done);
    });

    it('should NOT be able to retrieve profile info after delete', function (done) {
      handle.get('/me', {authorization:'Bearer '+token})
        .then(not_found)
        .then(ok(done))
        .catch(done)
    });

    //TODO:attempt to sign in to deleted account
  });

});
