
var allow = require('allow');
var password = allow.string(/^[^\x00-\x1f]{6,}$/);

exports.user = allow({
  name: allow.string(1,50),
  email: allow.email,
  password: password
});

exports.password = allow({
	current: password,
	desired: password
});

exports.reset = allow({
	email: allow.email,
	token: allow.string(/^[a-z0-9]{32}$/),
  desired: password
});
