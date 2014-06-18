"use strict";

module.exports = function (grunt, options) {

	this.jshint([
		'**/*.js',
		'!node_modules/**/*'
	]);

};