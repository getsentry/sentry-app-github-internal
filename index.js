const Koa = require("koa");
const Router = require("koa-router");
const serve = require('koa-static');

const app = new Koa();
const router = new Router();

const PROJECT_TO_REPO = new Map([
  ['relay', 'semaphore'],
]);

try {

  console.log('starting');
router.get("/stacktrace/:service/:org/:repo", (ctx, next) => {
  const { params, request } = ctx;
  const { org, repo: repoFromParams, service } = params;
  const { query } = request;
  const {projectSlug, filename,lineNo } = query;


  if (service === "github") {
    console.log(ctx.request.query);

    const repo = getRepo(projectSlug, filename);
    let url = `https://github.com/${org}/${repo}/blob/master`;
    let projectPathPrefix = "/";

    const isGetSentry = filename.includes(
      "src/getsentry/static/getsentry"
    );

    // hard-coded project slug here
    if (projectSlug === "javascript") {
      if (!isGetSentry) {
        projectPathPrefix = "/src/sentry/static/sentry/";
      }
    }
    if (projectSlug === "sentry") {
      projectPathPrefix = "/src/";
    }

    ctx.redirect(
      `${url}${projectPathPrefix}${sanitizeFilename(filename)}#L${
        lineNo
      }`
    );
  }
});

// router.get("/", (ctx, next) => {
  // ctx.body = "Visit <a href=\"https://github.com/getsentry/sentry-app-github-internal\">https://github.com/getsentry/sentry-app-github-internal</a> to update";
// });

/**
 * Checks if source code belongs to getsentry repo, current only detects getsentry javascript
 */
function isGetSentry(filename) {
    return filename.includes(
      "src/getsentry/static/getsentry"
    );
}

/**
 * Clean up file paths so that it maps nicely to github
 */
function sanitizeFilename(filename) {
  return filename.replace(/^\.\//, "").replace(/^\/usr\/src\/getsentry\//, "");
}

function getRepo(project, filename) {
  if (PROJECT_TO_REPO.has(project)) {
    return PROJECT_TO_REPO.get(project);
  }

  if (isGetSentry(filename)) {
    return 'getsentry';
  }

  // default
  return 'sentry';
}

app.use(router.routes()).use(router.allowedMethods());
app.use(serve('./public'));
app.listen(3000);
} catch (err) {
  console.error(err);
}
module.exports = app.callback();
