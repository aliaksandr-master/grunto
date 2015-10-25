'use strict';

module.exports = function (grunt) {
	grunt.task.registerMultiTask('grunto$task', function () {
		var options = this.options({
			$$run: null
		});

		options.$$run.call(this);
	});
};
