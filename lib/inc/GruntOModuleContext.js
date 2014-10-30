"use strict";

var _ = require('lodash');
var utils = require('./utils');
var path = require('path');

function Context (grunt, aliases, refsObj, config, prefix, context) {
	_.extend(this, context);

	if (aliases[prefix] != null) {
		grunt.fail.fatal('duplicate module name "' + prefix + '"');
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
}

Context.prototype = {

	include: function (tasks) {
		if (_.isString(tasks)) {
			tasks = [tasks];
		}

		if (!_.isArray(tasks) || _.isEmpty(tasks)) {
			this.$prop$.grunt.fail.fatal(this.$prop$.prefix + ': Invalid tasks type. Must be string or array');
		}

		_.each(tasks, function (task) {
			task = /^\./.test(task) ? path.join(this.CURRENT_PREFIX, task) : task;
			this.$prop$.current.push(task.replace('\\', '/'));
		}, this);

		return this;
	},

	grunto: function (name, targetName, callback) {
		if (_.isFunction(name)) {
			callback = name;
			name = null;
			targetName = null;
		} else if (_.isFunction(targetName)) {
			callback = targetName;
			targetName = null;
		}


		var that = this,
			task = null;

		this.gruntoTask(function () {
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
		});

		if (name) {
			task = this.$$taskName(name);
			this.$$run(task, {});
		}

		return this;
	},

	$$taskName: function (name, target) {
		if (Object.prototype.toString.call(name) === '[object Object]') {
			return _.clone(name);
		}

		if (target != null) {
			name = name + ':' + target;
		}

		var that = this;
		target = that.$prop$.prefix + '/' + (++this.$prop$.num);

		name = name.replace(/^([^:]+):*(.*)$/, function (w, $1, $2) {
			$2 = $2.trim();
			target = $2 ? utils.joinPaths(that.$prop$.prefix, $2) : target;
			return $1.trim();
		});

		return {
			name: name,
			target: target,
			ref: name + ':' + target
		}
	},

	$$run: function (name, config) {
		if (!_.isObject(config) && !_.isArray(config) && !_.isFunction(config)) {
			this.$prop$.grunt.fail.fatal(this.$prop$.prefix + ': invalid config param of "' + name +'", must use array|object|function type');
		}

		var task = this.$$taskName(name);

		if (this.$prop$.config[task.name] == null) {
			this.$prop$.config[task.name] = {};
		}

		this.$prop$.config[task.name][task.target] = config;

		this.$prop$.refs[task.ref] = true;
		this.$prop$.current.push(task.ref);

		return this;
	}

};

module.exports = Context;