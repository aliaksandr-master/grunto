'use strict';

var _ = require('lodash');
var grunt = require('grunt');

var grunto = function (initFunc, options) {
	require('./_lib')(initFunc, _.extend({
		autoload: true,
		timeMetric: false
	}, options));
};

exports['base import'] = function (test) {
	test.doesNotThrow(function () {
		var gruntoFile = grunto(function (grunt) {
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
		});

		gruntoFile(grunt);
	});

	test.done();
};

exports['scan is plain object'] = function (test) {
	test.doesNotThrow(function () {
		var init = function (grunt) {
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

			return {
				jshint: {
					options: {
						jshintrc: true
					}
				}
			};
		};

		var gruntoFile = grunto(init);

		gruntoFile(grunt);
	});

	test.done();
};


exports['scan is string'] = function (test) {
	test.doesNotThrow(function () {
		var gruntoFile = grunto(function (grunt) {

			this.context({
				CWD: process.cwd()
			});

			this.scan('grunt/**/*.js');

			return {
				jshint: {
					options: {
						jshintrc: true
					}
				}
			};
		});

		gruntoFile(grunt);

		test.done();
	});
};

exports['scan is number - error'] = function (test) {
	var gruntoFile = grunto(function (grunt) {
		this.context({
			CWD: process.cwd()
		});

		test.trows(function () {
			this.scan(123);
		});
	});

	gruntoFile(grunt);

	test.done();
};

exports['context is empty'] = function (test) {
	test.trows(function () {
		var gruntoFile = grunto(function (grunt) {
			this.context();

			return {
				jshint: {
					options: {
						jshintrc: true
					}
				}
			};
		});

		gruntoFile(grunt);

		test.done();
	});
};

exports['invalid config'] = function (test) {
	var gruntoFile = grunto(function (grunt) {
		test.trows(function () {
			this.config(123123);
		});
	});

	gruntoFile(grunt);

	test.done();
};


exports['option statistic'] = function (test) {
	test.doesNotThrow(function () {
		var gruntoFile = grunto(function (grunt) {
		}, { statistic: true });

		gruntoFile(grunt);
	});

	test.done();
};
