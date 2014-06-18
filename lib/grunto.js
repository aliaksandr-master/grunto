"use strict";

var _ = require('lodash'),
	utils = require('./inc/utils'),
	GruntOModuleContext = require('./inc/GruntOModuleContext'),
	gruntOverride = require('./inc/override');

var GruntO = function (grunt) {
	this._time = Date.now();
	this.grunt = grunt || require('grunt');
	this._gruntOverrider = gruntOverride(grunt);

	this._config = {};
	this._options = {};
	this._scans = [];

	this._gruntOverrider.override();
};

GruntO.prototype = {

	scan: function (files) {
		if (_.isArray(files)) {
			this._scans = this._scans.concat(files);
		} else if (_.isObject(files)) {
			this._scans.push(files);
		} else {
			this.grunt.fail.fatal('Invalid scan type, must be object/array');
		}

		return this;
	},

	context: function (params) {
		if (_.isObject(params)) {
			_.extend(this._options, params);
		} else {
			this.grunt.fail.fatal('Invalid options type, must be object');
		}

		return this;
	},

	config: function (config) {
		if (_.isObject(config)) {
			_.extend(this._config, config);
		} else if (config != null) {
			this.grunt.fail.fatal('invalid config value, must be object');
		}

		return this;
	},

	getPrefix: function (fPath, cwd) {
		return fPath.replace(/^[\/]?(.+?)(?:\/default)?(?:\.js)?$/, '$1').replace(/\\+/g,'/');
	},

	_files: function () {
		var that = this;
		var files = [];

		_.each(this._scans, function (scan) {
			_.each(that.grunt.file.expand(scan, scan.src), function (fPath) {
				var cwd =  (scan.cwd || '').replace(/^\.\//, '') || '',
					prefix = '',
					modulePath = utils.joinPaths(cwd, fPath);

				if (!that.grunt.file.isPathAbsolute(modulePath)) {
					modulePath = process.cwd() + '/' + modulePath;
				}

				if (scan.prefix) {
					if (_.isRegExp(scan.prefix)) {
						prefix = fPath.replace(scan.prefix, '$1');
					} else if (_.isString(scan.prefix)){
						prefix = scan.prefix;
					} else if (_.isFunction(scan.prefix)) {
						prefix = scan.prefix(fPath, cwd);
					} else {
						that.grunt.fail.fatal('invalid prefix type, must be string/regExp/function');
					}
				} else {
					prefix = that.getPrefix(fPath, cwd);
				}

				files.push({
					path: fPath,
					modulePath: modulePath,
					cwd: cwd,
					prefix: prefix
				});
			});
		});

		return files;
	},

	_run: function () {
		var that = this,
			refs = {},
			aliases = {};

		var loadTime = Date.now() - this._time;
		var time = Date.now();

		this.config(this._gruntOverrider.flushConfig());

		var files = this._files();
		files.forEach(function (f) {
			var context = new GruntOModuleContext(that.grunt, aliases, refs, that._config, f.prefix, that._options);

			var config = require(f.modulePath).call(context, that.grunt, that._options);

			that.config(config);
		});

		this._gruntOverrider.restore();

		if (aliases.grunto == null) {
			aliases.grunto = [];
		}

		_.each(aliases, function (tasks, name) {
			_.each(tasks, function (taskName) {
				if (!refs[taskName]) {
					that.grunt.fail.fatal(name + ': undefined task "' + taskName + '"');
				}
			});
			that.grunt.task.registerTask(name, tasks);
		});

		that.grunt.initConfig(this._config);
		this._statistic(aliases, refs, files, loadTime, time);
	},

	_statistic: function (aliases, refs, files, loadTime, time) {
		var taskKeys    = _.keys(this._config);
		var regTaskKeys = _.keys(this._gruntOverrider.registered());

		var aliasesLength = _.size(aliases);
		var refsLength    = _.size(refs);

		var tasksSize             = taskKeys.length;
		var registeredTasksSize   = regTaskKeys.length;
		var registeredModulesSize = files.length;

		console.log('\n');
		console.log('modules: ' + registeredModulesSize);
		console.log('used tasks (in config): ' + tasksSize);
		if (registeredTasksSize > tasksSize) {
			var diff = _.difference(regTaskKeys, taskKeys);
			console.log('unused tasks (in config): "' + diff.join('", "') + '"');
		}
		console.log('sub-tasks: ' + (refsLength - aliasesLength));
		console.log('aliases: ' + aliasesLength);
		console.log('prepare (task load): ' + (loadTime / 1000) + 's');
		console.log('module config generation: ' + ((Date.now() - time) / 1000) + 's');
		console.log('\n');
	}
};

module.exports = function (func, autoload) {
	return function (grunt) {
		var gruntO;

		gruntO = new GruntO(grunt);

		if (autoload || autoload == null) {
			require('load-grunt-tasks')(grunt);
		}

		gruntO.config(func.call(gruntO, grunt));

		gruntO._run();
	};
};