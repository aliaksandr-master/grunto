/*
 * grunto
 * https://github.com/aliaksandr-pasynkau/grunto
 *
 * Copyright (c) 2014 Aliaksandr Pasynkau
 * Licensed under the MIT license.
 */

module.exports = require('./lib')(function(grunt) {
	'use strict';

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

	return {
		jshint: {
			options: {
				jshintrc: true
			}
		}
	};
});
