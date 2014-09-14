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
			task = /^./.test(task) ? path.join(this.CURRENT_PREFIX, task) : task;
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

		var that = this;
		var fullTargetName;

		this.gruntoTask(function () {
			var taskConfig = callback.call(this);

			if (!name) {
				that.grunt.log.ok(taskConfig || 'done');
				return;
			}

			if (taskConfig == null) {
				that.grunt.fail.fatal('Empty config for task "' + name + ':' + fullTargetName + '"');
			}

			if (that.$prop$.config[name] == null) {
				that.$prop$.config[name] = {};
			}

			that.$prop$.config[name][fullTargetName] = taskConfig;
			that.grunt.log.ok('Created config for "' + name + ':' + fullTargetName + '"');
		});

		if (name) {
			targetName = targetName ? targetName : this.$prop$.num + 1;
			fullTargetName = this.$prop$.prefix + '/' + targetName;
			this.$$run(name + ':' + targetName, {});
		}

		return this;
	},

	$$run: function (name, config) {
		var that = this,
			$pref = this.$prop$.prefix,
			target = $pref + '/' + (++this.$prop$.num),
			ref;

		if (!_.isObject(config) && !_.isArray(config) && !_.isFunction(config)) {
			this.$prop$.grunt.fail.fatal(that.$prop$.prefix + ': invalid config param of "' + name +'", must use array|object|function type');
		}

		name = name.replace(/^([^:]+):*(.*)$/, function (w, $1, $2) {
			target = $2.trim() ? utils.joinPaths($pref, $2.trim()) : target;
			return $1.trim();
		});

		ref = name + ':' + target;

		that.$prop$.refs[ref] = true;

		if (that.$prop$.config[name] == null) {
			that.$prop$.config[name] = {};
		}

		that.$prop$.config[name][target] = config;

		that.$prop$.current.push(ref);

		return this;
	}

};

module.exports = Context;