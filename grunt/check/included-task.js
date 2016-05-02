'use strict';

module.exports = function (grunt) {

	this
		.$task(function () {
			console.log('!!! included task 2'); // eslint-disable-line
		});
};
