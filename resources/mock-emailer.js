var ƒ = require('effd');

module.exports = function () {
  return ƒ({
    send: (data)=> ƒ(Ø=>{
      setTimeout(_=>Ø.done(data), 10);
    })
  });
};