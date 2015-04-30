'use strict';

module.exports['test'] = function (test) {
	var grunt = require('grunt');
	var gruntoFile = require('./_lib')(function(grunt) {
		'use strict';

		grunt.loadNpmTasks('jshint');

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
	}, {
		autoload: false,
		timeMetric: false
	});

	test.ok(true);
	test.doesNotThrow(function () {
		gruntoFile(grunt);
	});

	test.done();
};
