#global module:false
module.exports = (grunt) ->
  "use strict"
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    banner: '/**!\n
 * <%= pkg.name %>\n
 * <%= pkg.description %>\n
 *\n
 * @license <%= pkg.license %>\n
 * @author <%= pkg.author.name %> - <%= pkg.author.url %>\n
 * @version <%= pkg.version %>\n
 **/'
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

    clean: ['dist']

    concat:
      vanilla:
        src: ['src/draggable-number.js']
        dest: 'dist/draggable-number.js'
      jquery:
        src: ['src/draggable-number.js', 'src/wrappers/jquery.draggable-number.js']
        dest: 'dist/jquery.draggable-number.js'

    umd:
      vanilla:
        src: 'dist/draggable-number.js'
        dest: 'dist/draggable-number.js'
        objectToExport: 'DraggableNumber'
      jquery:
        src: 'dist/jquery.draggable-number.js'
        dest: 'dist/jquery.draggable-number.js'
        objectToExport: 'DraggableNumber'
        deps:
          'default': ['$']
          amd: ['jquery']
          cjs: ['jquery']
          global: ['jQuery']

    uglify:
      options:
        report: 'gzip'
      build:
        files:
          'dist/draggable-number.min.js': ['dist/draggable-number.js']
          'dist/jquery.draggable-number.min.js': ['dist/jquery.draggable-number.js']

    usebanner:
      all:
        options:
          banner: '<%= banner %>'
        files:
          src: ['dist/*.js']

  # Load necessary plugins
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-notify"
  grunt.loadNpmTasks "grunt-umd"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-banner"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-karma"
  grunt.loadNpmTasks "grunt-karma-coveralls"

  grunt.registerTask "default", ["karma:ci", "jshint", "watch"]
  grunt.registerTask "build", ["clean", "karma:ci", "jshint", "concat", "umd", "uglify", "usebanner", "notify:build"]
  grunt.registerTask "test", ["jshint", "karma:ci"]
  grunt.registerTask "coverage", ["karma:coverage", "coveralls"]
