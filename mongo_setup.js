var ObjectID = require('bson-objectid');

module.exports = function (db, callback) {
  console.log('setting up mongo db: ', db.databaseName);
  db.createIndex('users', {email:1}, {unique:true}, function (err, idxname) {
    if(err) return callback(err);

    var user = {
      "name": "Wil Kap",
      "email": "william.kapke@gmail.com",
      "password": "$2a$12$5N5/BmhZME40fKMUmpIVOeoTrf9qQRkJcNnbRphN6SGWIvXjk76gO",
      "token": "552d925868472a7a705f8cb7",
      "_id": ObjectID("552d925868472a7a705f8cb8")
    };
    db.collection('users').insert(user, callback);
  });
};
