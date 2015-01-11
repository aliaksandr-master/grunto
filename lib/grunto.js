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
			return this;
		}

		if (_.isObject(files)) {
			this._scans.push(files);
			return this;
		}

		if (_.isString(files)) {
			this._scans.push(files);
			return this;
		}

		this.grunt.fail.fatal('Invalid scan type, must be object/array');

		return this;
	},

	context: function (params) {
		if (_.isObject(params)) {
			_.extend(this._options, params);
			return this;
		}

		this.grunt.fail.fatal('Invalid options type, must be object');

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

	_searchGruntOModules: function () {
		var that = this;
		var modules = [];

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

				modules.push({
					path: fPath,
					modulePath: modulePath,
					cwd: cwd,
					prefix: prefix
				});
			});
		});

		return modules;
	},

	_run: function () {
		var that = this,
			refs = {},
			aliases = {},
			time = Date.now(),
			loadTime = time - this._time;

		this.config(this._gruntOverrider.flushConfig());

		var gruntOModules = this._searchGruntOModules();
		gruntOModules.forEach(function (f) {
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
		this._statistic(aliases, refs, gruntOModules, loadTime, time);
	},

	_statistic: function (aliases, refs, gruntOModules, loadTime, time) {
		var diff,
			taskKeys    = _.keys(this._config),
			regTaskKeys = _.keys(this._gruntOverrider.registered()),

			aliasesLength = _.size(aliases),
			refsLength    = _.size(refs),

			tasksSize             = taskKeys.length,
			registeredTasksSize   = regTaskKeys.length,
			registeredModulesSize = gruntOModules.length;

		var msg = '\n';
		msg += '\tModules(' + registeredModulesSize + ')' +
			', Tasks(' + tasksSize + ')' +
			', Sub-tasks(' + (refsLength - aliasesLength) + ')' +
			', Aliases(' + aliasesLength + ')\n';
		msg += '\tPrepare Time (load-grunt-tasks work): ' + (loadTime / 1000) + 's\n';
		msg += '\tModule Config Generation Time (grunto work): ' + ((Date.now() - time) / 1000) + 's\n';

		if (registeredTasksSize > tasksSize) {
			msg += '\tUnused Tasks (was loaded, but unused): "' + _.difference(regTaskKeys, taskKeys).join('", "') + '"\n';
		}

		this.grunt.log.writeln(msg);
	}
};

module.exports = function (func, options) {
	options = _.extend({
		autoload: true,
		timeMetric: true
	}, options);

	return function (grunt) {
		var gruntO = new GruntO(grunt);

		grunt.task.registerMultiTask('gruntoTask', function () {
			this.data.call(this);
		});

		if (options.autoload) {
			require('load-grunt-tasks')(grunt, _.isEmpty(options.autoload) ? {} : options.autoload);
		}

		if (options.timeMetric) {
			require('time-grunt')(grunt);
		}

		gruntO.config(func.call(gruntO, grunt));

		gruntO._run();
	};
};