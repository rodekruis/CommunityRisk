"use strict";

module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    watch: {
      serverViews: {
        files: ["app/views/**"],
        options: {
          livereload: true,
        },
      },
      serverJS: {
        files: ["gruntfile.js", "server.js", "config/**/*.js", "app/**/*.js"],
        options: {
          livereload: true,
        },
      },
      clientViews: {
        files: ["public/modules/**/views/*.html"],
        options: {
          livereload: true,
        },
      },
      clientJS: {
        files: ["public/**/*.js"],
        options: {
          livereload: true,
        },
      },
      clientCSS: {
        files: ["public/**/*.css"],
        options: {
          livereload: true,
        },
      },
    },
    uglify: {
      production: {
        options: {
          mangle: false,
        },
        files: {
          "public/dist/application.min.js": [
            "public/config.js",
            "public/application.js",
            "public/modules/*/*.js",
            "public/modules/**/*.js",
          ],
        },
      },
    },
    cssmin: {
      combine: {
        files: {
          "public/dist/application.min.css": [
            "public/modules/*[!dashboards]*/**/*.css",
          ],
        },
      },
    },
    nodemon: {
      dev: {
        script: "server.js",
      },
    },
    concurrent: {
      tasks: ["nodemon", "watch"],
      options: {
        logConcurrentOutput: true,
      },
    },
  });

  // Load NPM tasks
  require("load-grunt-tasks")(grunt);

  // Making grunt default to force in order not to break the project.
  grunt.option("force", true);

  // Default task(s).
  grunt.registerTask("default", ["concurrent"]);

  // Build task(s).
  grunt.registerTask("build", ["uglify", "cssmin"]);
};
