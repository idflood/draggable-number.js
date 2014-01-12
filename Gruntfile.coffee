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
        tasks: ["jshint", "mocha"]

    notify:
      build:
        options: {message: "Build complete"}

    mocha:
      all:
        options:
          mocha:
            ignoreLeaks: false
          reporter: 'Spec'
          # URLs passed through as options
          urls: ["tests.html"]
          # Indicates whether 'mocha.run()' should be executed in 'bridge.js'
          run: true

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

    uglify:
      options:
        report: 'gzip'
      build:
        files:
          'dist/draggable-number.min.js': ['src/draggable-number.js']

  # Load necessary plugins
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-mocha"
  grunt.loadNpmTasks "grunt-notify"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-karma"
  grunt.loadNpmTasks "grunt-karma-coveralls"

  grunt.registerTask "default", ["mocha", "jshint", "watch"]
  grunt.registerTask "build", ["mocha", "jshint", "uglify", "notify:build"]
  grunt.registerTask "test", ["jshint", "karma:ci"]
  grunt.registerTask "coverage", ["karma:coverage", "coveralls"]
