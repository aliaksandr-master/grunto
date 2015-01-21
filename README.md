[![npm](http://img.shields.io/npm/v/grunto.svg?style=flat-square)](https://www.npmjs.com/package/grunto)
[![npm](http://img.shields.io/npm/l/grunto.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/aliaksandr-pasynkau/grunto.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/grunto)
[![devDependency Status](https://david-dm.org/aliaksandr-pasynkau/grunto/dev-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/grunto#info=devDependencies)
[![Build Status](https://travis-ci.org/aliaksandr-pasynkau/grunto.svg?branch=master&style=flat-square)](https://travis-ci.org/aliaksandr-pasynkau/grunto)

#Grunto
> Organize Your Grunt config

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide,
as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.
Once you're familiar with that process, you may install this plugin with this command:
```shell
$ npm install grunto --save-dev
```

## Expanding the capabilities of Grunt. Maintenance of large config fles. 

You can continue as you used to adding syntactical sugar to boring unmainteined Grunt canfigs. 

1. You can cut grunt build projects into litte pieces simplifying the maintenance.
2. You can add runtime generation of task configs. That can help in some complex cases (e.g. with r.js).
3. You can also use utilities to create grunt tasks.

### History
We're using grunt for more than a year. It's a superb file handling, build and deployment tool. It's done a lot work for us so far and we're happy with it.
But at some point we're facing issues with maintenance of task configs. 
We end up with 35 tasks (including custom ones), 180 subtasks, 20 aliases to maintain everything. Gruntfle.js s as fat as 2500 liines (not including custom tasks).
We try arranging the task configs based on task names e.g. moving "copy" or "clean" to separate files. That helps a bit but is still a make-do. It doesn't solve the maintenance of the lines. Worse, it complicates search.

So we come up with purpose-based arrangement - the one employed in usual programming.
1. cut config into files and put them in the "grunt" folder in the project root.
2. split tasks based on their purpose
The final structure looks something like

```shell
.
├──grunt/
|   ├──database
|   |   └──install.js
|   |
|   ├──api-tester.js
|   |   ├──compile
|   |   |  ├──templates.js
|   |   |  ├──styles.js
|   |   |  ├──scripts.js
|   |   |  └──environment.js
|   |   ├──default.js
|   |   ├──build.js
|   |   ├──install.js
|   |   └──watcher.js
|   |
|   ├──opt
|   |   ├──install.js
|   |   ├──deploy.js
|   |   └──watcher.js
|   |
|   ├──client
|   |   ├──compile
|   |   |  ├──templates.js
|   |   |  ├──styles.js
|   |   |  ├──scripts.js
|   |   |  ├──router.js
|   |   |  ├──locale.js
|   |   |  ├──images.js
|   |   |  └──default.js
|   |   |
|   |   └──minify
|   |   |  ├──styles.js
|   |   |  ├──scripts.js
|   |   |  ├──images.js
|   |   |  └──default.js
|   |   |
|   |   ├──install.js
|   |   ├──deploy.js
|   |   └──default.js
|   ...
└──Gruntfile.js
```
Here you can see which parts of the system work with Grunt, which are then to be minified, deployed and processed. It's easy to choose place for your new system components.

To start the task `grunt/client/compile/templates` you should only execute:
```shell
$ grunt client/compile/template
```

To start compiling all the the client's components, minify and prepare everything for deployment:
```shell
$ grunt client/compile client/minify
```
First all tasks from `grunt/client/compile/default.js` and then all tasks from `grunt/client/minify/default.js` will be fired. 
Predictable, you must admit.

We aggreed that all all tasks named `**/default.js`, fire all tasks in it's folder in the right order.
We don't insist on that so it's up to your team but it worked fine for us.

##Getting Started

Gruntfile.js
```js
var grunto = require('./lib/grunto');
module.exports = grunto(function(grunt) {
	// put your code here
});
```

### Init configs

Usually used to init general config for all similar task (with eq names, such as copy or clean)

```js

// first case (default for grunt)
module.exports = grunto(function (grunt) {
    grunt.initConfig({
		clean: {
			targetName: [
				'tmp/dir/for/clean'
			]
		}
    });
});

// second case
module.exports = grunto(function (grunt) {
    return {
		clean: {
			targetName: [
				'tmp/dir/for/clean'
			]
		}
    };
});

// third case
module.exports = grunto(function(grunt) {
	this.config({
		clean: {
			targetName: [
				'tmp/dir/for/clean'
			]
		}
	});
});
```

You should not use multiple config inits. It usually adds dissonance to configuration.


# Advanced Usage

You have grunt modules fs
```shell
.
├──grunt/
├──default.js
├──build/
|   ├──default.js
|   ├──styles.js
|   └── ...
├── ...
└── Gruntfile.js
```

Gruntfile.js:
```js
module.exports = grunto(function (grunt) {

	// if you want to load custom tasks - you should add them here
	require('path/to/my/grunt/task')(grunt); // grunt task should have `grunt.task.registerMultiTask ...`


	// scan dir for search grunt modules
	grunt.scan({
		cwd: 'grunt', // required - this dir is needed for first point of prefix calc
		src: '**/*.js', // all files with nedd glob template for search, for expamle all js files in "/grunt" dir
	});

	// extend gunto-module context for config inside tasks, optional
	grunt.context({
		BUILD_DIR: 'path/to/build/dir',
		CWD: process.cwd()
	});

	// global options for tasks
	return {
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			}
		}
	};
});
```


grunt/build/styles.js
```js
module.exports = function (grunt, contextOptions) {

	var buildDir = this.BUILD_DIR; // eq contextOptions.BUILD_DIR (from params)
	this.grunt; // eq grunt (from params) - grunt object

	this.CURRENT_PREFIX; // build/styles - (absolute) name of alias.
	// all inside task targets named with this prefix, example "copy:build/styles/1", "clean:build/styles/nameOfTarget"
	// files with "default" name in nested dir have prefix such as dirpath from scan cwd (in this case "grunt/")

	// init config
	this
		// 1. run copy task with params
		.copy({
			options: {},
			files: [{
				expand: true,
				cwd: 'some/src/path',
				src: ['**/*'],
				dest: 'some/dest/path'
			}]
		})

		// 2. run "clean:build/styles/nameOfTargetForClean" task
		.clean("nameOfTargetForClean", [
			'path/to/clean'
		])

		// 3. run function on this runtime moment
		.grunto(function () {
			console.log('log in this moment');

			// this task is simple, has all possibilities and context, that has grunt task (see http://gruntjs.com/api/inside-tasks)
		})

		// 4. run copy task with params, that was compiled after execute function in runtime
		.grunto('copy', function () {
			return {
				options: {},
				files: [{
					expand: true,
					cwd: 'some/src/path',
					src: ['**/*'],
					dest: 'some/dest/path'
				}]
			};
		})

		// 5. run "copy:build/styles/nameOfTarget" task with params, that was compiled after execute function in runtime
		.grunto('copy', 'nameOfTarget', function () {
			return {
				options: {},
				files: [{
					expand: true,
					cwd: 'some/src/path',
					src: ['**/*'],
					dest: 'some/dest/path'
				}]
			};
		})

		// run other tasks (in other dirs)
		.include([
			'copy:prefix/nameForTask', // 5. run task "copy" from dir "grunt/prefix", named "nameForTask"
			'alias/name', // 6. run task with name 'alias/name', from path "grunt/alias/name.js" or "grunt/alias/name/default.js"

			'./relativeFromThisFile/AliasName', // 7. run task with relative name (within the dir)
			'../relativeFromThisFile/AliasName' // 8.
		])
	;

	// global config initializing
	return {
		jshint: {
			options: {
				config: ".jshintrc"
			}
		}
	};
};
```

to run this task

```shell
$ grunt build/styles
```

## Sum up

You can create complex setups avoiding code duplication and config confusion.
This approach helps you to arrange appropriate structure for building complex projects that is clear, predictable and simple.
