var should = require('should');
var crap = require('crap');
var ObjectID = require('bson-objectid');

describe('Emailer Controller', function () {
  //this.timeout(5000);
  var emailer;
  before(done=> {
    crap.load.controllers('emailer')
      .then(controllers=> {
        emailer = controllers.emailer;
        done();
      })
      .catch(done)
  });
  
  it('should send a welcome email', function (done) {
    emailer.welcome('william.kapke@gmail.com')
      .then(email=>{
        email.should.eql({
          to: 'william.kapke@gmail.com',
          from: undefined,
          subject: 'Welcome!',
          text: 'Glad to have you onboard :)'
        });
        done();
      })
      .catch(done);
  });

  it('should send a forgot_password email', function (done) {
    emailer.forgot_password('william.kapke@gmail.com', '000000000000000000000000')
      .then(email=>{
        email.should.eql({
          to: 'william.kapke@gmail.com',
          from: undefined,
          subject: 'Password Reset Request',
          text: '/reset/000000000000000000000000/william.kapke@gmail.com'
        });
        done();
      })
      .catch(done);
  });

});
