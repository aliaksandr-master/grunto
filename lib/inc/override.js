"use strict";

var _ = require('lodash');
var GruntOModuleContext = require('./GruntOModuleContext');

module.exports = function (grunt) {
	var config = {};
	var registered = {};
	var registerTask = null;
	var initConfig = null;

	return {
		flushConfig: function () {
			var c = config;
			config = {};
			return c;
		},

		registered: function () {
			return registered;
		},

		register: function (name) {
			var runnerName = 'RUN_' + name;

			if (!registered[name]) {
				registered[name] = [runnerName];
			}

			GruntOModuleContext.prototype[runnerName] = function (targetName, config) {
				if (!_.isString(targetName)) {
					config = targetName;
					targetName = '';
				}

				targetName = targetName ? name + ':' + targetName : name;
				return this.$$run(targetName, config);
			};

			if (GruntOModuleContext.prototype[name] == null) {
				registered[name].push(name);
				GruntOModuleContext.prototype[name] = GruntOModuleContext.prototype[runnerName];
			}
		},

		override: function () {
			var that = this;

			if (registerTask  || initConfig) {
				return this;
			}

			registerTask = grunt.task.registerTask;
			grunt.task.registerTask = grunt.registerTask = function (taskName) {
				that.register(taskName, false);
				return registerTask.apply(this, arguments);
			};

			initConfig = grunt.initConfig;
			grunt.initConfig = function (configObj) {
				_.extend(config, configObj);
			};

			return this;
		},

		restore: function () {
			if (!registerTask) {
				return this;
			}

			grunt.task.registerTask = grunt.registerTask = registerTask;
			grunt.initConfig = initConfig;

			registerTask = null;
			initConfig = null;

			return this;
		}
	};

};
