'use strict';

var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var path = require('path');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');
var util = require('gulp-util');
var templateCache = require('gulp-angular-templatecache');
var cache = require('gulp-cache');

global.paths = {
  js: [
    './src/js/module.js',
    './src/js/**/*.js',
    './tmp/*.js'
  ],
  templates: './src/**/*.html',
  less: './src/less/*.less',
  dist: './dist',
  tmp: './tmp'
};

gulp.task('lintjs', function () {
  return gulp.src(global.paths.js)
    .pipe(cache('lintjs'))
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('less', function() {
  return gulp.src(global.paths.less)
    .pipe(sourcemaps.init())
    .pipe(less({paths: [ path.join(__dirname, 'less', 'includes') ]}))
    .pipe(concat('angular-chat.css'))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(global.paths.dist))
  ;
});

gulp.task('css', ['less'], function() {
  return gulp.src(global.paths.dist + '/angular-chat.css')
    .pipe(sourcemaps.init())
    .pipe(minifyCss())
    .pipe(sourcemaps.write())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(global.paths.dist));
});

gulp.task('watch', function() {
  gulp.watch([global.paths.js], ['lintjs', 'templates', 'js']).on('change', logChanges);
  gulp.watch([global.paths.less], ['less']).on('change', logChanges);
  gulp.watch([global.paths.dist + '/angular-chat.css'], ['css']).on('change', logChanges);
});

gulp.task('js', ['templates'], function() {
  return gulp.src(global.paths.js)
    .pipe(sourcemaps.init())
    .pipe(concat('angular-chat.js'))
    .pipe(gulp.dest(global.paths.dist))
    .pipe(rename("angular-chat.min.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(global.paths.dist))
});

gulp.task('templates', function() {
  return gulp.src(global.paths.templates)
    .pipe(templateCache('templates.js', {
      module: 'angular-chat',
      moduleSystem: 'iife',
      transformUrl: function(url) {
        return url.replace(/js\/templates\//, '')
      }
    }))
    .pipe(gulp.dest(global.paths.tmp))
});

gulp.task('build', ['css', 'js']);
gulp.task('default', ['watch']);

function logChanges(event) {
  util.log(
    util.colors.green('File ' + event.type + ': ') +
    util.colors.magenta(path.basename(event.path))
  );
}
