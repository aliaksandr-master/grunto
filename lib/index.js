'use strict';

var GruntO = require('./GruntO');

module.exports = function (func) {
	return function (grunt) {
		GruntO.run(grunt, func);
	};
};
