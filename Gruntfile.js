'use strict';

var grunto = require('./lib');
var jitGrunt = require('jit-grunt');

module.exports = grunto(function (grunt) {
	jitGrunt(grunt);

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
