/* eslint-disable */
'use strict';

var _ = require('lodash');
var grunt = require('grunt');
var jitGrunt = require('jit-grunt');

var grunto = function (initFunc) {
	return require('./_lib')(initFunc);
};

exports['base import'] = function (test) {
	test.doesNotThrow(function () {
		var gruntoFile = grunto(function (grunt) {
			jitGrunt(grunt);

			this.context({
				CWD: process.cwd()
			});

			this.addTaskNames([
				'eslint'
			]);

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
		});

		gruntoFile(grunt);
	});

	test.done();
};

exports['scan is plain object'] = function (test) {
	test.doesNotThrow(function () {
		var gruntoFile = grunto(function (grunt) {
			jitGrunt(grunt);

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
		});

		gruntoFile(grunt);
	});

	test.done();
};

exports['context is empty'] = function (test) {
	var gruntoFile = grunto(function (grunt) {
		var that = this;

		test.throws(function () {
			that.context();
		});

		return {
			jshint: {
				options: {
					jshintrc: true
				}
			}
		};

		gruntoFile(grunt);

		test.done();
	});

	test.done();
};

exports['invalid config'] = function (test) {
	var gruntoFile = grunto(function (grunt) {
		test.throws(function () {
			this.config(123123);
		});
	});

	gruntoFile(grunt);

	test.done();
};

