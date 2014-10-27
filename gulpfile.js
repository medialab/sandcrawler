var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha');

// Files
var files = [
  './phantom/*.js',
  './src/**/*.js',
  './test/**/*.js'
];

// Lint
gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Test
gulp.task('test', function() {
  return gulp.src('./test/endpoint.js', {read: false})
    .pipe(mocha({reporter: 'spec'}));
});

// Macro-tasks
gulp.task('default', ['lint', 'test']);
