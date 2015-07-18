'use strict';

module.exports = function (grunt, options) {

	// simple run
	this.eslint([
		'**/*.js',
		'!lib-cov/**/*.js',
		'!tests/_lib/**/*.js',
		'!node_modules/**/*.js'
	]);

	// eq with previous "jshint"
	this.$task('eslint', function () {
		return [
			'**/*.js',
			'!lib-cov/**/*.js',
			'!tests/_lib/**/*.js',
			'!node_modules/**/*.js'
		];
	});

	this.$task(function () {
		return 'done!!!';
	});

	this.$run('included-task');

	this.$run([
		'included-task',
		'./included-task'
	]);
};
