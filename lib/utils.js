'use strict';

var path = require('path');

exports.joinPaths = function (one, two) {
	one = one == null ? '' : String(one);
	two = two == null ? '' : String(two);

	return path.join(one, two).replace(/\\/g, '/').replace(/\/$/, '');
};

exports.genUniqueTaskName = function () {
	return '_' + Number(Date.now() + String(Math.random()).replace(/\./, '')).toString(36);
};
