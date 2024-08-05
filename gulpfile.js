import gulp from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import concat from "gulp-concat";
import uglify from "gulp-uglify-es";
import browserSync from "browser-sync";
import autoprefixer from "gulp-autoprefixer";
import clean from "gulp-clean";
import webp from "gulp-webp";
import imagemin from "gulp-imagemin";
import newer from "gulp-newer";
import svgstore from "gulp-svgstore";
import include from "gulp-include";
import cache from "gulp-cache";
import ghPages from "gulp-gh-pages"

const { src, dest, watch, parallel, series } = gulp;
const scss = gulpSass(dartSass);
const browserSyncInstance = browserSync.create();
const uglifyInstance = uglify.default;

function pages() {
  return src("app/pages/*.html")
    .pipe(
      include({
        includePaths: "app/components",
      })
    )
    .pipe(dest("app"))
    .pipe(browserSyncInstance.stream());
}

function deploy (){
  return src('dist/**/*')
  .pipe(ghPages());
}

function styles() {
  return src("app/scss/style.scss")
    .pipe(autoprefixer({ overrideBrowserslist: ["last 5 versions"] }))
    .pipe(concat("style.min.css"))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(dest("app/css"))
    .pipe(browserSyncInstance.stream());
}

function scripts() {
  return src("app/js/main.js")
    .pipe(concat("main.min.js"))
    .pipe(uglifyInstance())
    .pipe(dest("app/js"))
    .pipe(browserSyncInstance.stream());
}

function imagesWebp() {
  return src("app/images/src/*.*")
    .pipe(newer("app/images/dist"))
    .pipe(webp())
    .pipe(dest("app/images/dist"));
}

function imagesOptimize() {
  return src("app/images/src/*.*")
    .pipe(newer("app/images/dist"))
    .pipe(imagemin())
    .pipe(dest("app/images/dist"));
}

const images = series(imagesWebp, imagesOptimize);

function sprite() {
  return src("app/images/dist/*.svg")
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(dest("app/images/dist"));
}

function watching() {
  browserSyncInstance.init({
    server: {
      baseDir: "app/",
    },
  });
  watch(["app/scss/**/*.scss"], styles);
  watch(["app/images/src"], images);
  watch(["app/js/main.js"], scripts);
  watch(["app/components/*", "app/pages/*"], pages);
  watch(["app/*.html"]).on("change", browserSyncInstance.reload);
}


function cleanDist() {
  return src("dist", { allowEmpty: true }).pipe(clean());
}

function clearCache(done) {
  return cache.clearAll(done);
}

function building() {
  return src(
    [
      "app/css/style.min.css",
      "app/images/dist/*.*",
      "!app/images/dist/*.svg",
      "app/images/dist/dist.svg",
      "app/js/main.min.js",
      "app/*.html",
    ],
    {
      base: "app",
    }
  ).pipe(dest("dist"));
}

export const build = series(cleanDist, building);
export { styles, scripts, watching, images, sprite, building, pages, clearCache, deploy };

export default parallel(clearCache, styles, scripts, pages, watching);
