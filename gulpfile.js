var gulp = require('gulp'),
	inject = require('gulp-inject'),
	wiredep = require('wiredep').stream,
	sass = require('gulp-sass');

gulp.task('default', ['styles', 'inject'], function () {});

gulp.task('inject', function () {
	var sources = gulp.src([
		'./javascript/**/*.js',
		'./css/*.css'],
		{read: false});
	return gulp.src('./index.html')
			.pipe(wiredep({ directory: 'bower_components' }))
			.pipe(inject(sources))
			.pipe(gulp.dest('./'));
});

gulp.task('styles', function () {
	gulp.src('./css/scss/**/*.scss')
		.pipe(
			sass(({outputStyle: 'compressed'}))
			.on('error', sass.logError))
		.pipe(gulp.dest('./css'));
});

gulp.task('watch', ['styles', 'inject'], function () {
	gulp.watch('./css/scss/**/*.scss', ['styles']);
});
