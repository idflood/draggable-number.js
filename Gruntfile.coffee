#global module:false
module.exports = (grunt) ->
  "use strict"
  grunt.initConfig
    compass:
      clean:
        options:
          clean: true

      dev:
        options:
          debugInfo: false

      build:
        options:
          environment: "production"
          outputStyle: "compressed"
          noLineComments: true
          imagesDir: "assets/images"
          fontsDir: "assets/fonts"

    watch:
      sass:
        files: ["src/styles/**"]
        tasks: ["compass:dev"]

      reloadcss:
        options: {livereload: true}
        files: ["assets/styles/*.css"]

      reloadjs:
        options: {livereload: true}
        files: ["src/scripts/**"]

      reloadhtm:
        options: {livereload: true}
        files: ["**.html"]

    notify:
      build:
        options: {message: "Build complete"}

  # Load necessary plugins
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-compass"
  grunt.loadNpmTasks "grunt-notify"

  grunt.registerTask "init", ["compass:clean", "compass:dev"]
  grunt.registerTask "default", ["compass:clean", "compass:dev", "watch"]
  grunt.registerTask "build", ["compass:clean", "compass:build", "notify:build"]
