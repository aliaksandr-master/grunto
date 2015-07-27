'use strict';

var _ = require('lodash');
var utils = require('./inc/utils');
var GruntOModuleContext = require('./inc/GruntOModuleContext');
var gruntOverride = require('./inc/override');

/**
 * @class GruntO
 * @property {Date} _time
 * @property {grunt} grunt
 * @property {Object} _gruntOverrider
 * @property {Object} config
 * @property {Object} _options
 * @property {Array} _scans
 * @param {Object} grunt - task runner
 * @param {Object} params - init params
*/
var GruntO = function (grunt, params) {
	this._time = Date.now();
	this.grunt = grunt || require('grunt');
	this._gruntOverrider = gruntOverride(grunt);
	this.params = _.extend({
		autoload: true,
		statistic: true,
		timeMetric: true
	}, params);

	this._config = {};
	this._options = {};
	this._scans = [];

	this._gruntOverrider.override();
};

GruntO.prototype = {

	/**
	 * @this GruntO
	 * @public
	 * @param {!Object|Array|String} files - array of file glob-patterns for scanning
	 * @returns {GruntO} this
	 */
	scan: function (files) {
		if (_.isArray(files)) {
			this._scans = this._scans.concat(files);
			return this;
		}

		if (_.isPlainObject(files)) {
			this._scans.push(files);
			return this;
		}

		if (_.isString(files)) {
			this._scans.push(files);
			return this;
		}

		this.grunt.fail.fatal('Invalid scan type, must be object/array');
	},

	/**
	 * @this GruntO
	 * @public
	 * @param {!Object} params - params for extend the standard GruntO context
	 * @returns {GruntO} this
	 */
	context: function (params) {
		if (!_.isPlainObject(params)) {
			this.grunt.fail.fatal('Invalid options type, must be object');
		}

		_.extend(this._options, params);

		return this;
	},

	/**
	 * @this GruntO
	 * @public
	 * @param {!Object} config - config object for adding to main config
	 * @returns {GruntO} this
	 */
	config: function (config) {
		if (_.isPlainObject(config)) {
			_.extend(this._config, config);
		} else if (config != null) {
			this.grunt.fail.fatal('invalid config value, must be object');
		}

		return this;
	},

	/**
	 * @this GruntO
	 * @public
	 * @param {!String} fPath - file path
	 * @param {!String} cwd - main dir path
	 * @returns {String} - prefix of task context
	 */
	getPrefix: function (fPath, cwd) {
		return fPath.replace(/^[\/]?(.+?)(?:\/default)?(?:\.js)?$/, '$1').replace(/\\+/g, '/');
	},

	/**
	 * @this GruntO
	 * @private
	 * @returns {Array} - modules
	 */
	_searchGruntOModules: function () {
		var that = this;
		var modules = [];

		_.each(this._scans, function (scan) {
			_.each(that.grunt.file.expand(scan, scan.src), function (fPath) {
				var cwd =  (scan.cwd || '').replace(/^\.\//, '') || '';
				var prefix = '';
				var modulePath = utils.joinPaths(cwd, fPath);

				if (!that.grunt.file.isPathAbsolute(modulePath)) {
					modulePath = process.cwd() + '/' + modulePath;
				}

				if (scan.prefix) {
					if (!_.isFunction(scan.prefix)) {
						that.grunt.fail.fatal('invalid prefix type, must be string/regExp/function');
					}

					prefix = scan.prefix(fPath, cwd);
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

	/**
	 * @this GruntO
	 * @private
	 * @param {Function} func - main init function
	 * @returns {GruntO} this
	 */
	_run: function (func) {
		var that = this;
		var refs = {};
		var aliases = {};
		var time = Date.now();
		var loadTime = time - this._time;

		this.config(func.call(this, that.grunt));

		that.grunt.verbose.ok('grunto: init');

		this.config(this._gruntOverrider.flushConfig());

		that.grunt.verbose.ok('grunto: compile config');

		var gruntOModules = this._searchGruntOModules();

		that.grunt.verbose.ok('grunto: scan modules');

		gruntOModules.forEach(function (f) {
			that.grunt.verbose.writeln('>> grunto: open grunto module ' + f.modulePath);

			var context = new GruntOModuleContext(that.grunt, aliases, refs, that._config, f.prefix, that._options);

			var config = require(f.modulePath).call(context, that.grunt, that._options);

			that.config(config);

			that.grunt.verbose.ok('>> grunto: initialized module ' + f.modulePath);
		});

		this._gruntOverrider.restore();

		if (aliases.grunto == null) {
			aliases.grunto = [];
		}

		_.each(aliases, function (tasks, name) {
			tasks = _.map(tasks, function (taskName) {
				if (!refs[taskName]) {
					//that.grunt.fail.warn(name + ': undefined task "' + taskName + '"');

					var newTaskName = 'grunto' + Date.now() + String(Math.random()).replace(/\./, '');

					that.grunt.registerTask(newTaskName, [
						taskName
					]);

					taskName = newTaskName;
				}

				return taskName;
			});

			that.grunt.task.registerTask(name, tasks);
		});

		that.grunt.initConfig(this._config);

		this._statistic(aliases, refs, gruntOModules, loadTime, time);

		return this;
	},

	/**
	 * @this GruntO
	 * @private
	 * @param {Object} aliases - object of task aliases
	 * @param {Object} refs - object of task links
	 * @param {Array} gruntOModules - modules array
	 * @param {Number} loadTime - time of grunt-task-loader
	 * @param {Number} time - time of config generation
	 * @returns {GruntO} this
	 */
	_statistic: function (aliases, refs, gruntOModules, loadTime, time) {
		if (!this.params.statistic) {
			return this;
		}

		var taskKeys    = _.keys(this._config);
		var regTaskKeys = _.keys(this._gruntOverrider.registered());

		var aliasesLength = _.size(aliases);
		var refsLength    = _.size(refs);

		var tasksSize             = taskKeys.length;
		var registeredTasksSize   = regTaskKeys.length;
		var registeredModulesSize = gruntOModules.length;

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

		return this;
	}
};

module.exports = function (func, options) {
	return function (grunt) {
		var gruntO = new GruntO(grunt, options);

		grunt.task.registerMultiTask('gruntoTask', function () {
			this.data.call(this);
		});

		if (gruntO.params.autoload) {
			require('load-grunt-tasks')(grunt, _.isEmpty(gruntO.params.autoload) ? {} : gruntO.params.autoload);
		}

		if (gruntO.params.timeMetric) {
			require('time-grunt')(grunt);
		}

		gruntO._run(func);
	};
};
