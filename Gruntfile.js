'use strict';

module.exports = require('./lib')(function (grunt) {
	this.context({
		CWD: process.cwd()
	});

	this.scan([{
		cwd: 'grunt/',
		src: [
			'**/*.js',
			'!**/_*',
			'!**/_*/**/*'
		]
	}]);
});
