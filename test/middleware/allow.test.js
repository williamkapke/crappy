
var crap = require('crap');
var ok = (done)=>_=>done();//used to wrap done() so nothing is passed to it.

describe('allow middleware', ()=> {
  var allow;
  var example_user;

  before(done => {
    crap.load.middleware('allow').then(middleware=> {
      allow = middleware.allow;
      return crap.load.controllers('user').then(controllers =>
          controllers.user.create({first:'William', email:'will@kap.services'}).then(result=>{
            example_user = result;
            done();
          })
      );
    })
    .catch(done);
  });
  function DoNotCallNext() {
    throw Error("next() should not be called");
  }

  it('should NOT authorize a user if the header is missing', done=> {
    var req = { headers: { } };
    var res = { unauthorized: ok(done) };
    allow.authenticated(req, res, DoNotCallNext);
  });
  it('should NOT authorize a user if the header is empty', done=> {
    var req = { headers: { authorization: "" } };
    var res = { unauthorized: ok(done) };
    allow.authenticated(req, res, DoNotCallNext);
  });
  it('should NOT authorize a user if the header is not 2 parts', done=> {
    var req = { headers: { authorization: "551cc779c277fa83c53f5433" } };
    var res = { unauthorized: (message)=> {
      message.should.equal('Improperly formed Authorization header');
      done();
    } };
    allow.authenticated(req, res, DoNotCallNext);
  });
  it('should NOT authorize a user if the header is not Bearer', done=> {
    var req = { headers: { authorization: "NotBearer 551cc779c277fa83c53f5433" } };
    var res = { unauthorized: (message)=> {
      message.should.equal('Improperly formed Authorization header');
      done();
    } };
    allow.authenticated(req, res, DoNotCallNext);
  });
  it('should NOT authorize a user if the token is not found', done=> {
    var req = { headers: { authorization: "Bearer 551cc779c277fa83c53f5433" }, query: { } };
    var res = { error: _=> (err)=>{
      err.message.should.match(/NotFound›/);
      done();
    } };
    allow.authenticated(req, res, DoNotCallNext);
  });
  it('should authorize a req with a valid token', function (done) {
    var req = { headers: { authorization: `Bearer ${example_user.token}` }, query: { } };
    var res = { error: _=> done };
    allow.authenticated(req, res, _=>{
      req.should.have.property('auth');
      req.auth.should.eql(example_user.$pick('id','token'));
      done();
    });
  })

});