#Grunto
> Organize Your Grunt config

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide,
as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.
Once you're familiar with that process, you may install this plugin with this command:
```shell
$ npm install grunto --save-dev
```

## Расширение возможностей Grunt. Организация больших конфигов

Вы можете использовать все как вы раньше использовали, добавляя синтаксический сахар к скучным неподдерживаемым конфигам для системы grunt.

1. Можно разложить проект сборки на мелкие смысловые кусочки. Тем самым упрощая поддержку этой системы.
2. Добавить генерацию конфигов таска в момент исполнения. Помогает в некоторых сложных случаях (например с r.js)
3. Так же можно использовать утилитарные методы для создания grunt-тасков
4. Не нужно руками загружать grunt-модули

### History
Мы использовали grunt более года. Это прекрасный инструмент для обработки файлов, сборки и деплоймента проектов.
Grunt делал за нас много работы. Нам все нравилось.
Но в один прекрасный момент мы сталкнулись с проблемой поддержки конфигурации тасков.
В нашем проекте было более 35 тасков (включая самописные), 180 сабтасков, 20 алиасов, для того что бы все организовать. Gruntfile.js имел более 2500 строк (Не включая самописные таски).
Мы пробывали структуру организации конфигов на основе отделенния всех тасков по названиям тасков, таких как "copy" или "clean" - они лежали в отдельных файлах. Немного стало проще.
Но это скорее временное решение. Основной проблемы поддержки этих строк оно всеравно не решало, даже стало неудобней их искать.

Как в нормальном программировании необходимо была организация по смысловым отрезкам а не по названию таска.
1. Мы разделили конфигурацию на отдельные файлы и положили все в папку "grunt" в корне проекта.
2. Разделили Все саб-таски по смыслу.
Конечная структура получилась примерно вот такой

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
По структуре видно какие части системы работают с grunt, какие нужно потом минифицировать, заливать на удаленный сервер и там разворачивать.
Абсолютно понятно куда положить новые части системы.

Чтобы запустить задачу `grunt/client/compile/templates` нужно запустить всеголишь:
```shell
$ grunt client/compile/template
```

Чтобы запустить компиляцию всех элементов клиента, а затем сминифицировать все и подготовить к загрузке на удаленный сервер:
```shell
$ grunt client/compile client/minify
```
При этом сработает задачи из файла `grunt/client/compile/default.js` а затем все задачи из файла `grunt/client/minify/default.js`.
Согласитесь, предсказуемо.

Договорились, что в задачах, которые лежат `**/default.js`, запускают все вложенные в эту папку задачи в нужном порядке.
Мы не настаиваем, это решение принимать каждой команде в своем проекте. Нам было это удобно.


##Getted Started

Gruntfile.js
```js
var grunto = require('./lib/grunto');
module.exports = grunto(function(grunt) {
	// put your code here
});
```

### Init configs

Usually used for init general config for all similar task (with eq names, such copy or clean)

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

You should not use multiple initializing of config. It usually add dissonance for configuration.


# Advanced Use

You has grunt modules fs
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

	// if you want to load custom tasks - you should add here
	require('path/to/my/grunt/task')(grunt); // grunt task should has `grunt.task.registerMultiTask ...`


	// scan dir for search grunt modules
	grunt.scan({
		cwd: 'grunt', // required - this dir need for first point of prefix calc
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
	// files with "default" name in nested dir has prefix such as dirpath from scan cwd (in this case "grunt/")

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
			'copy:prefix/nameForTask', // 5. run task "copy" from dir "grunt/prefix", named as "nameForTask"
			'alias/name', // 6. run task with name 'alias/name', from path "grunt/alias/name.js" or "grunt/alias/name/default.js"

			'./relativeFromThisFile/AliasName', // 7. runt inside of this dir task with relative name
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

for run this task

```shell
$ grunt build/styles
```

## Итого

Можно создавать сложные композиции не повторяя код и не путаясь в конфигурации.
Этот подход помогает организовать структуру приложения сборки сложного проекта.
Структура сборки проекта становится понятной, предсказуемой и простой.
