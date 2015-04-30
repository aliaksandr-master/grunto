'use strict';

var path = require('path');

module.exports = {
	joinPaths: function (one, two) {
		one = one == null ? '' : one + '';
		two = two == null ? '' : two + '';
		return path.join(one, two).replace(/\\/g, '/').replace(/\/$/, '');
	}
};
