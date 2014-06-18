"use strict";

var _ = require('lodash');
var utils = require('./utils');

function Context (grunt, aliases, refsObj, config, prefix, context) {
	_.extend(this, context);

	if (aliases[prefix] != null) {
		grunt.fail.fatal('duplicate module name "' + prefix + '"');
	}
	aliases[prefix] = [];
	refsObj[prefix] = true;

	this.CURRENT_PREFIX = prefix;
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

	include: function (arrTasks) {
		if (_.isString(arrTasks)) {
			arrTasks = [arrTasks];
		}

		if (!_.isArray(arrTasks) || _.isEmpty(arrTasks)) {
			this.$prop$.grunt.fail.fatal(this.$prop$.prefix + ': Invalid tasks type. Must be string or array');
		}

		_.each(arrTasks, function (task) {
			this.$prop$.current.push(task);
		}, this);

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