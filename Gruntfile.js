module.exports = function(grunt) {

  var jsFiles = [];

  // Project configuration:
  grunt.initConfig({
    closureLint: {
      app: {
        closureLinterPath: '/usr/local/bin',
        command: 'gjslint',
        src: jsFiles,
        options: {
          stdout: true,
          strict: true,
          opt: '--disable 6,13,110 --nojsdoc'
        }
      }
    },
    jshint: {
      all: jsFiles,
      options: {
        '-W055': true,
        '-W040': true,
        '-W064': true,
        '-W061': true,
        '-W103': true,
        '-W002': true
      }
    }
  });

  // Loading modules
  grunt.loadNpmTasks('grunt-closure-linter');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default tasks
  grunt.registerTask(
    'default',
    [
      'closureLint',
      'jshint'
    ]
  );
};
