var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    connect = require('gulp-connect'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    awspublish = require('gulp-awspublish'),
    cloudfront = require('gulp-cloudfront-invalidate-aws-publish'),
    AWS = require('aws-sdk'),
    svgSprite = require('gulp-svg-sprite');

var spriteSources = ['images/sprites/**/*.svg'],
    imageSources  = ['images/**/*'],
    fontSources   = ['fonts/**/*'],
    sassSources   = ['styles/**/*.scss'],
    htmlSources   = ['*.html'];

gulp.task('fonts', function() {
  gulp.src(fontSources)
  .pipe(gulp.dest('dist/fonts'))
  .pipe(connect.reload())
});

spriteConfig = {
  mode: {
    css: {
      layout: "vertical",
      sprite: "../images/sprite.css.svg",
      bust: false,
      render: {
        scss: {
          dest: '_sprite.scss'
        }
      }
    },
  }
};
gulp.task('sprites', function() {
  return gulp.src(spriteSources)
    .pipe(svgSprite(spriteConfig))
    .pipe(gulp.dest('build/'))
});

gulp.task('images', ['sprites'], function() {
  return gulp.src(imageSources.concat(['build/images/**/*']))
    .pipe(gulp.dest('dist/images'))
    .pipe(connect.reload())
});

gulp.task('html', function() {
  return gulp.src(htmlSources)
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload())
});

gulp.task('sass', ['images'], function() {
  return gulp.src('styles/style.scss')
    .pipe(sass({style: 'expanded'}))
      .on('error', gutil.log)
    .pipe(gulp.dest('dist/styles'))
    .pipe(connect.reload())
});

gulp.task('watch', function() {
  gulp.watch(fontSources, { interval: 500 }, ['coffee']);
  gulp.watch(spriteSources, { interval: 500 }, ['sass']);
  gulp.watch(imageSources, { interval: 500 }, ['images']);
  gulp.watch(sassSources, { interval: 500 }, ['sass']);
  gulp.watch(htmlSources, { interval: 500 }, ['html']);
});

gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    livereload: true
  })
});

// Publishing to S3 and cloudfront
//
///////////////////////////////////////////////////////////////////////////////
var publisher = awspublish.create({
  region: 'us-east-1',
  params: {
    Bucket: 'resume.alexianus.com'
  }
}, {
  cacheFileName: '.awspublish-cache'
});

var headers = {
  'Cache-Control': 'max-age=315360000, no-transform, public'
};

var cfSettings = {
  distribution: 'E1JXUJO27G4UDE', // Cloudfront distribution ID
  wait: true,                     // Wait until invalidation is completed
  indexRootPath: true             // Invalidate index.html root paths (`foo/index.html` and `foo/`) (default: false)
}

gulp.task('publish', ['html', 'fonts', 'images', 'sprites', 'sass'], function () {
  return gulp.src('dist/**/*')
    .pipe(publisher.publish(headers))
    .pipe(cloudfront(cfSettings))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter());
});
///////////////////////////////////////////////////////////////////////////////

gulp.task('default', ['html', 'fonts', 'images', 'sprites', 'sass', 'connect', 'watch']);
