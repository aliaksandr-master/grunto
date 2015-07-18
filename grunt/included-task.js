'use strict';

module.exports = function (grunt) {

	this
		.$task(function () {
			console.log('!!! included task');
		});
};
