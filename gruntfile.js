"use strict";

module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    watch: {
      options: {
        livereload: grunt.file.isFile("./config/cert/localhost-key.pem")
          ? {
              key: grunt.file.read("./config/cert/localhost-key.pem"),
              cert: grunt.file.read("./config/cert/localhost-cert.pem"),
            }
          : true,
      },
      serverViews: {
        files: ["app/views/**"],
      },
      serverJS: {
        files: ["gruntfile.js", "server.js", "config/**/*.js", "app/**/*.js"],
      },
      clientViews: {
        files: ["public/modules/**/views/*.html"],
      },
      clientJS: {
        files: ["public/**/*.js"],
      },
      clientCSS: {
        files: ["public/**/*.css"],
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
          "public/dist/application.min.css": ["public/modules/**/*.css"],
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
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-concurrent");
  grunt.loadNpmTasks("grunt-nodemon");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-cssmin");

  // Making grunt default to force in order not to break the project.
  grunt.option("force", true);

  // Default task(s).
  grunt.registerTask("default", ["concurrent"]);

  // Build task(s).
  grunt.registerTask("build", ["uglify", "cssmin"]);
};
