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
                script: 'server.js'
            }
        },
        concurrent: {
            tasks: ['nodemon', 'watch'],
            options: {
                logConcurrentOutput: true
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
};
