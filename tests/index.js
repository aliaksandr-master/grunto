'use strict';

exports['base import'] = function (test) {
	var grunt = require('grunt');
	var init = function (grunt) {

		this.context({
			CWD: process.cwd()
		});

		this.scan([
			{
				cwd: 'grunt/',
				src: [
					'**/*.js',
					'!**/_*',
					'!**/_*/**/*'
				]
			}
		]);

		return {
			jshint: {
				options: {
					jshintrc: true
				}
			}
		};
	};

	var gruntoFile = require('./_lib')(init, {
		autoload: true,
		timeMetric: false
	});

	test.ok(true);
	test.doesNotThrow(function () {
		gruntoFile(grunt);
	});

	test.done();
};
