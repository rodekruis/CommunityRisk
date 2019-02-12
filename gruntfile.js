'use strict';

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            serverViews: {
                files: ['app/views/**'],
                options: {
                    livereload: true,
                }
            },
            serverJS: {
                files: ['gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js'],
                options: {
                    livereload: true,
                }
            },
            clientViews: {
                files: ['public/modules/**/views/*.html'],
                options: {
                    livereload: true,
                }
            },
            clientJS: {
                files: ['public/js/**/*.js', 'public/modules/**/*.js'],
                options: {
                    livereload: true,
                }
            },
            clientCSS: {
                files: ['public/**/css/*.css'],
                options: {
                    livereload: true,
                }
            }
        },
        uglify: {
            production: {
                options: {
                    mangle: false
                },
                files: {
                    'public/dist/application.min.js': '<%= applicationJavaScriptFiles %>'
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'public/dist/application.min.css': '<%= applicationCSSFiles %>'
                }
            }
        },
        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    nodeArgs: ['--debug']
                }
            }
        },
        concurrent: {
            tasks: ['nodemon', 'watch'],
            options: {
                logConcurrentOutput: true
            }
        },
        env: {
            test: {
                NODE_ENV: 'test'
            }
        },
        mochaTest: {
            src: ['app/tests/**/*.js'],
            options: {
                reporter: 'spec',
                require: 'server.js'
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },
	'node-inspector': {
	    custom: {
	      options: {
		'web-port': 8080,
		'web-host': '127.0.0.1',
		'debug-port': 5858,
		//'ssl-key': './config/cert/localhost-win.key',
        //'ssl-cert': './config/cert/localhost-win.cert',
		'save-live-edit': true,
		'no-preload': true,
		'stack-trace-limit': 4,
		'hidden': ['node_modules']
	      }
	    }
	},
	nggettext_extract: {
	    pot: {
		files: {
		    'po/template.pot': ['public/modules/*/*/*.js', 'public/modules/*/views/*.html', 'public/modules/*/views/settings/*.html']
		}
	    }
	},
	nggettext_compile: {
	    all: {
		files: {
		    'public/dist/translations.js': ['po/*.po']
		}
	    }
	}
    });

    // Load NPM tasks
    require('load-grunt-tasks')(grunt);

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    // A Task for loading the configuration object
    grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
    	var init = require('./config/init')();
    	var config = require('./config/config');

    	grunt.config.set('applicationJavaScriptFiles', config.assets.js);
    	grunt.config.set('applicationCSSFiles', config.assets.css);
    });

    // Default task(s).
    grunt.registerTask('default', ['concurrent']);

    // Build task(s).
    grunt.registerTask('build', [
        'loadConfig',
        'uglify',
        'cssmin'
    ]);

    // Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);

    // Load debugger
    grunt.loadNpmTasks('grunt-node-inspector');

    // Load Gettext
    grunt.loadNpmTasks('grunt-angular-gettext');
};
