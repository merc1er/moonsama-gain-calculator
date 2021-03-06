// Imports

const gulp         = require('gulp'),
      del          = require('del'),
      rename       = require('gulp-rename'),
      // Templating
      nunjucks     = require('gulp-nunjucks-render'),
      htmlmin      = require('gulp-htmlmin'),
      // CSS processing
      purgecss     = require('gulp-purgecss'),
      postcss      = require('gulp-postcss'),
      tailwindcss  = require('tailwindcss'),
      autoprefixer = require('autoprefixer'),
      cleanCSS     = require('gulp-clean-css'),
      // JavaScript
      webpack      = require('webpack-stream'),
      // BrowserSync
      browserSync  = require('browser-sync'),
      reload       = browserSync.reload;


// TASKS

// Clean previous build

gulp.task('clean', function(done) {
  // Deletes all files from dist/
  del.sync('dist/', {force: true});
  done();
});


// Reload the browser

gulp.task('reload', function(done){
  reload();
  done();
});


// Nunjucks

gulp.task('nunjucks', function() {
  // Get all .html files in pages
  return gulp.src('src/**/*.html')
  // Render template with nunjucks
  .pipe(nunjucks({
    path: ['src/templates/']
  }))
  .pipe(htmlmin({ // minify HTML
    collapseWhitespace: true,
    removeComments: true
  }))
  // Output files in dist folder
  .pipe(gulp.dest('dist'))
});


// CSS processing

function TailwindExtractor(content) {
  // Extract tailwindcss classes
  // https://tailwindcss.com/docs/optimizing-for-production#writing-purgeable-html
  return content.match(/[^<>"'`\s]*[^<>"'`\s:]/g);
}

// Process CSS to be as small as possible with postCSS and purgeCSS
// This task takes a few seconds - only use it in production
gulp.task('css-prod', function() {
  return gulp.src('src/css/style.css')
    // postcss
    .pipe(postcss([
      tailwindcss,
      autoprefixer
    ]))
    // purgecss
    .pipe(purgecss({
      content: ['src/**/*.html', 'src/**/*.njk', 'src/**/*.svg'],
      extractors: [{
        extractor: TailwindExtractor,
        extensions: ['html', 'njk', 'svg']
      }]
    }))
    // Minifies CSS
    .pipe(cleanCSS({compatibility: 'ie9'}))
    // output files in dist folder
    .pipe(gulp.dest('dist/static/css/'));
});

// Use the complete tailwind.min.css file for development only
gulp.task('css-dev', function() {
  return gulp.src('src/css/style.css')
    // postcss
    .pipe(postcss([
      tailwindcss
    ]))
    // output files in dist folder
    .pipe(gulp.dest('dist/static/css/'));
});


// JavaScript

// Bundle and minify JavaScript
gulp.task('js', () =>
  gulp.src('src/js/app.js')
    .pipe(webpack({mode: 'production'}))
    .pipe(gulp.dest('dist/static/js/'))
);


// Copy all static files

gulp.task('copy-static', function(done){
  gulp.src('src/static/**/*').pipe(gulp.dest('dist/static/'));
  done();
});


// Start browserSync

gulp.task('serve', function(done){
  browserSync({
    server: {
      baseDir: './dist',
      index: "index.html",
      serveStaticOptions: {
        extensions: ['html']
      }
    }
  });
  done();
});


// Watch for changes

gulp.task('watch', function(done){
  // Watch HTML pages
  gulp.watch('src/**/*',          gulp.series('nunjucks', 'reload'));
  // Watch CSS files
  gulp.watch('src/css/**/*.css',  gulp.series('css-dev'));
  // Watch JS files
  gulp.watch('src/js/**/*',       gulp.series('js', 'reload'));
  // Watch static files
  gulp.watch('src/static/**/*.*', gulp.series('copy-static', 'reload'));
  done();
});


// Series

// Default task
gulp.task('default', gulp.series('clean', 'css-dev', 'nunjucks', 'js',
  'copy-static', 'serve', 'watch'));

// Deployment task
gulp.task('build', gulp.series('clean', 'css-prod', 'nunjucks', 'js',
  'copy-static'));
