#global module:false
module.exports = (grunt) ->
  "use strict"
  grunt.initConfig
    watch:
      reloadcss:
        options: {livereload: true}
        files: ["assets/styles/*.css"]

      reloadjs:
        options: {livereload: true}
        files: ["src/**"]

      reloadhtml:
        options: {livereload: true}
        files: ["**.html"]

      jschecks:
        files: ["tests/**", "src/**"]
        tasks: ["jshint", "karma:ci"]

    notify:
      build:
        options: {message: "Build complete"}

    karma:
      options:
        configFile: 'karma.conf.js'
      ci:
        browsers: ['PhantomJS']
        singleRun: true
      coverage:
        browsers: ['PhantomJS']
        reporters: ['coverage']
        preprocessors:
          'src/**/*.js': ['coverage']
        coverageReporter:
          type: 'lcov'
          dir: 'coverage/'
        singleRun: true

    coveralls:
      options:
        debug: true
        coverage_dir: 'coverage'

    jshint:
      all: ['src/**']

    umd:
      vanilla:
        src: 'src/draggable-number.js'
        dest: 'dist/draggable-number.js'
        objectToExport: 'DraggableNumber'
      jquery:
        src: 'src/jquery.draggable-number.js'
        dest: 'dist/jquery.draggable-number.js'
        objectToExport: 'DraggableNumber'

    uglify:
      options:
        report: 'gzip'
      build:
        files:
          'dist/draggable-number.min.js': ['dist/draggable-number.js']

  # Load necessary plugins
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-notify"
  grunt.loadNpmTasks "grunt-umd"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-karma"
  grunt.loadNpmTasks "grunt-karma-coveralls"

  grunt.registerTask "default", ["karma:ci", "jshint", "watch"]
  grunt.registerTask "build", ["karma:ci", "jshint", "umd:vanilla", "uglify", "notify:build"]
  grunt.registerTask "test", ["jshint", "karma:ci"]
  grunt.registerTask "coverage", ["karma:coverage", "coveralls"]
