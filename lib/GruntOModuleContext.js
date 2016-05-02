'use strict';

var _ = require('lodash');
var utils = require('./utils');
var path = require('path');

/**
 * @class GruntOModuleContext
 * @property {String} CURRENT_PREFIX
 * @property {grunt} grunt
 * @property {Object} $prop$
 * @constructor
 * @param {grunt} grunt - task runner
 * @param {Object} aliases - ref of object with task aliases
 * @param {Object} refsObj - ref of tasks
 * @param {Object} config - ref of configs object
 * @param {String} prefix - current module prefix
 * @param {?Object} context - context options
 * */
var GruntOModuleContext = module.exports = function GruntOModuleContext (grunt, aliases, refsObj, config, prefix, context) {
	_.extend(this, context);

	if (_.has(aliases, prefix)) {
		grunt.fail.fatal('duplicate module name "' + prefix + '"');
		return;
	}

	aliases[prefix] = [];
	refsObj[prefix] = true;

	this.CURRENT_PREFIX = prefix;
	this.grunt = grunt;
	this.$prop$ = {
		num: 0,
		refs: refsObj,
		grunt: grunt,
		prefix: prefix,
		config: config,
		current: aliases[prefix]
	};
};

GruntOModuleContext.prototype = {

	constructor: GruntOModuleContext,

	/**
	 * @public
	 * @param {String|Array} tasks - task name or array
	 * @returns {GruntOModuleContext} this
	 * */
	$run: function $run (tasks) {
		if (_.isString(tasks)) {
			tasks = [tasks];
		}

		if (!_.isArray(tasks) || _.isEmpty(tasks)) {
			this.$prop$.grunt.fail.fatal(this.$prop$.prefix + ': Invalid tasks type. Must be string or array');
			return this;
		}

		var that = this;

		_.each(tasks, function (task) {
			task = /^\./.test(task) ? path.normalize(path.join(that.CURRENT_PREFIX, task)) : task;
			that.$prop$.current.push(task.replace('\\', '/'));
		});

		return this;
	},

	/**
	 * @public
	 * @param {String} name - name of task, that will replaced
	 * @param {String} targetName - subtask name
	 * @param {function} callback - function that will call
	 * @returns {GruntOModuleContext} this
	 * */
	$task: function $task (name, targetName, callback) {
		if (_.isFunction(name)) {
			callback = name;
			name = null;
			targetName = null;
		} else if (_.isFunction(targetName)) {
			callback = targetName;
			targetName = null;
		}

		var that = this;
		var task = null;

		this.grunto$task({
			options: {
				$$run: function () {
					var taskConfig = callback.call(this);

					if (!name) {
						that.grunt.log.ok(taskConfig || 'done');
						return;
					}

					if (taskConfig == null) {
						that.grunt.fail.fatal('Empty config for task "' + task.ref + '"');
					}

					if (that.$prop$.config[name] == null) {
						that.$prop$.config[name] = {};
					}

					that.$prop$.config[name][task.target] = taskConfig;
					that.grunt.log.ok('Created config for "' + task.ref + '"');
				}
			}
		});

		if (name) {
			task = this.$$taskName(name);
			this.$$run(task, {});
		}

		return this;
	},

	/**
	 * @method
	 * @private
	 * @param {String} name - name of task
	 * @param {String} target - subtask name
	 * @returns {GruntOModuleContext} this
	 * */
	$$taskName: function $$taskName (name, target) {
		var that = this;

		if (_.isPlainObject(name)) {
			return _.clone(name);
		}

		if (target != null) {
			name = name + ':' + target;
		}

		target = this.$prop$.prefix + '/' + (++this.$prop$.num);

		name = name.replace(/^([^:]+):*(.*)$/, function (w, $1, $2) {
			$2 = $2.trim();
			target = $2.length ? utils.joinPaths(that.$prop$.prefix, $2) : target;
			return $1.trim();
		});

		return {
			name: name,
			target: target,
			ref: name + ':' + target
		};
	},

	/**
	 * @method
	 * @private
	 * @param {String} targetName - name of task
	 * @param {String|Object|Array|Function} config - config object
	 * @returns {GruntOModuleContext} this
	 * */
	$$run: function $$run (targetName, config) {
		if (!_.isPlainObject(config) && !_.isArray(config) && !_.isFunction(config)) {
			this.$prop$.grunt.fail.fatal(this.$prop$.prefix + ': invalid config param of "' + targetName + '", must use array|object|function type');

			return this;
		}

		var task = this.$$taskName(targetName);

		if (!_.has(this.$prop$.config, task.name)) {
			this.$prop$.config[task.name] = {};
		}

		this.$prop$.config[task.name][task.target] = config;

		this.$prop$.refs[task.ref] = true;
		this.$prop$.current.push(task.ref);

		return this;
	}
};

GruntOModuleContext.addTask = function addTask (taskName) {
	if (!_.isString(taskName)) {
		throw new TypeError('invalid type of task name for adding. must be string');
	}

	this.prototype[taskName] = function (targetName, config) {
		if (!_.isString(targetName)) {
			config = targetName;
			targetName = '';
		}

		targetName = targetName ? taskName + ':' + targetName : taskName;

		return this.$$run(targetName, config);
	};
};
