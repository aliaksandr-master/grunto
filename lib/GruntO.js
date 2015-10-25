'use strict';

var path = require('path');
var _ = require('lodash');
var utils = require('./utils');
var GruntOModuleContext = require('./GruntOModuleContext');
var gruntOTaskInitialize = require('../tasks/gruntoTask');

/**
 * @class GruntO
 * @property {grunt} grunt
 * @property {Object} config
 * @property {Object} _contextOptions
 * @property {Array} _moduleScanParamsArray
 * @param {Object} grunt - task runner
 */
var GruntO = module.exports = function GruntO (grunt) {
	this.grunt = grunt || require('grunt');

	this._config = {};
	this._taskAliases = {};
	this._moduleTaskRefs = {};
	this._contextOptions = {};
	this._moduleScanParamsArray = [];
};

GruntO.prototype = {

	constructor: GruntO,

	/**
	 * @this GruntO
	 * @public
	 * @param {!Object|Array|String} filesScanObject - array of file glob-patterns for scanning
	 * @returns {GruntO} this
	 */
	scan: function scan (filesScanObject) {
		if (!_.isPlainObject(filesScanObject)) {
			throw new Error('Invalid scan type, must be object');
		}

		var that = this;

		this.grunt.file.expand(filesScanObject, filesScanObject.src).forEach(function (fRelPath) {
			var fAbsPath = path.resolve(filesScanObject.cwd, fRelPath);

			var targetPrefixString = that._compilePrefix(fRelPath, filesScanObject.targetPrefix);

			that.module(targetPrefixString, fAbsPath);
		});

		return this;
	},

	module: function (targetPrefixString, moduleFunctionOrPathToModule) {
		if (!targetPrefixString || !moduleFunctionOrPathToModule) {
			throw new Error('grunto: target prefix and module function must be specified!');
		}

		this._checkPrefix(targetPrefixString);

		var moduleFunction = _.isString(moduleFunctionOrPathToModule) ? require(path.resolve(process.cwd(), moduleFunctionOrPathToModule)) : moduleFunctionOrPathToModule;

		var context = new GruntOModuleContext(this.grunt, this._taskAliases, this._moduleTaskRefs, this._config, targetPrefixString, this._contextOptions);

		var config = moduleFunction.call(context, this.grunt, this._contextOptions);

		this.addConfig(config);

		return this;
	},

	_checkPrefix: function (targetPrefixString) {
		if (/\\/.test(targetPrefixString)) {
			throw new Error('invalid target prefix. it must not contains \\ symbol');
		}
	},

	_compilePrefix: function (filePathRel, targetPrefixString) {
		if (_.isFunction(targetPrefixString)) {
			targetPrefixString = targetPrefixString(filePathRel);
		}

		targetPrefixString = targetPrefixString ? String(targetPrefixString) : filePathRel.replace(/^[\/]?(.+?)(?:\/default)?(?:\.js)?$/, '$1');

		targetPrefixString = targetPrefixString.replace(/\\/g, '/').replace(/\/+$/, '').replace(/^\/+/, '');

		return targetPrefixString;
	},

	/**
	 * @this GruntO
	 * @public
	 * @param {!Object} params - params for extend the standard GruntO context
	 * @returns {GruntO} this
	 */
	context: function initContextOptions (params) {
		if (!_.isPlainObject(params)) {
			throw new Error('Invalid options type, must be object');
		}

		_.extend(this._contextOptions, params);

		return this;
	},

	/**
	 * @this GruntO
	 * @public
	 * @param {!Object} config - config object for adding to main config
	 * @returns {GruntO} this
	 */
	addConfig: function addConfig (config) {
		if (config == null) {
			return this;
		}

		if (!_.isPlainObject(config)) {
			throw new Error('invalid config value, must be object');
		}

		_.each(config, function (v, k) {
			this._config[k] = this._config.hasOwnProperty(k) ? _.extend(this._config[k], v) : v;
		}, this);

		return this;
	},

	addTaskNames: function addTaskNames (taskOrArray) {
		if (!_.isArray(taskOrArray)) {
			taskOrArray = [taskOrArray];
		}

		_.each(taskOrArray, function (taskName) {
			GruntOModuleContext.addTask(taskName);
		});

		return this;
	},

	_commit: function commitConfigsAndAliasTasks () {
		var that = this;
		var grunt = this.grunt;

		_.each(this._taskAliases, function (tasksArray, name) {
			tasksArray = _.map(tasksArray, function (taskName) {
				if (that._moduleTaskRefs.hasOwnProperty(taskName)) {
					return taskName;
				}

				var tmpTaskName = utils.genUniqueTaskName();

				grunt.task.registerTask(tmpTaskName, [taskName]);

				return tmpTaskName;
			});

			grunt.task.registerTask(name, tasksArray);
		});

		grunt.task.registerTask('_grunto', []);

		grunt.initConfig(this._config);
	}
};

GruntO.run = function gruntORun (grunt, initializeFunction) {
	var gruntO = new GruntO(grunt);

	GruntO.shimGruntMethods(gruntO, function (grunt) {
		gruntOTaskInitialize(grunt);

		var configMayBe = initializeFunction.call(gruntO, grunt);

		gruntO.addConfig(configMayBe);
	});

	gruntO._commit();
};

GruntO.shimGruntMethods = function shimGruntMethods (gruntO, method) {
	var grunt = gruntO.grunt;
	var oldGruntRegisterTask = grunt.task.registerTask;
	var oldGruntInitConfig = grunt.initConfig;

	grunt.task.registerTask = function (taskName) {
		gruntO.addTaskNames(taskName);

		return oldGruntRegisterTask.apply(this, arguments);
	};

	grunt.initConfig = function (config) {
		gruntO.addConfig(config);
	};

	method(grunt);

	// rollback
	grunt.task.registerTask = oldGruntRegisterTask;
	grunt.initConfig = oldGruntInitConfig;

	oldGruntInitConfig = null;
	oldGruntRegisterTask = null;
};
