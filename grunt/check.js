"use strict";

module.exports = function (grunt, options) {

	// simple run
	this.jshint([
		'**/*.js',
		'!lib-cov/**/*.js',
		'!node_modules/**/*.js'
	]);

	// eq with previous "jshint"
	this.grunto('jshint', function () {
		return [
			'**/*.js',
			'!lib-cov/**/*.js',
			'!node_modules/**/*.js'
		];
	});

	this.grunto(function () {
		return 'done!!!';
	});

};