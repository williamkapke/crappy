`Javascript harmony features required`;
require('extensions');

var crap = require('crap');

crap.load.apis('user').catch(err=>{
  process.stderr.write((new Date()).toISOString());
  console.error(' '+err.stack)
});
