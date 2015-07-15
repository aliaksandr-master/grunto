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
	this.grunto('eslint', 'param', function () {
		return [
			'**/*.js',
			'!lib-cov/**/*.js',
			'!tests/_lib/**/*.js',
			'!node_modules/**/*.js'
		];
	});

	this.grunto(function () {
		return 'done!!!';
	});

	this.include([
		'eslint:hello'
	]);
};
