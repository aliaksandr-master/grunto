"use strict";

module.exports = function (grunt, options) {

	// simple run
	this.jshint([
		'**/*.js',
		'!node_modules/**/*'
	]);

	// eq with previous "jshint"
	this.grunto('jshint', function () {
		return [
			'**/*.js',
			'!node_modules/**/*'
		];
	});

	this.grunto(function () {
		return 'done!!!';
	});

};