'use strict';

module.exports = require('./lib')(function (grunt) {
	require('jit-grunt')(grunt);

	this.addTaskNames([
		'eslint'
	]);

	this.context({
		CWD: process.cwd()
	});

	this.scan({
		cwd: 'grunt/',
		src: [
			'**/*.js',
			'!**/_*',
			'!**/_*/**/*'
		]
	});

	this.module('hello', function (grunt, CFG) {
		this.$run('eslint:hello');
	});

	return {
		eslint: {
			hello: {
				src: [
					'lib/**/*.js'
				]
			}
		}
	};
});
