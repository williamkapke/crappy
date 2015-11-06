var Px = require('propex');

module.exports = {
  user: {
    auth: Px('{_id>id,token,roles,deleted,banned?}'),
    me: Px('{id,name,email,token}')
  }
};
