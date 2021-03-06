
module.exports = app => {
  const { router, controller } = app;

  router.use(async (ctx, next) => {
    await next();
    const { url, ip } = ctx;
    if (url === '/' || url === '/api/login' || url === '/api/auth/check') {
      ctx.logger('visit').info(`${ip} ${url}`);
    } else {
      ctx.logger('access').debug(ctx);
    }
  });

  router.get('/', controller.index.render);

  router.get('/api/mangas/:dirId/:path?/folder', controller.manga.folder);
  router.get('/api/mangas/:dirId/:path?/list', controller.manga.list);
  router.get('/api/mangas/:dirId/:path?/pick', controller.manga.pick);
  router.get('/api/mangas/:dirId/:path?/search', controller.manga.search);
  router.get('/api/mangas/:dirId/versions', controller.manga.versions);
  router.get('/api/mangas/:dirId/latest', controller.manga.latest);
  router.post('/api/mangas/share', controller.manga.share);

  router.get('/api/settings', controller.settings.get);
  router.post('/api/settings', controller.settings.post);

  router.post('/api/login', controller.auth.login);
  router.get('/api/auth/check', controller.auth.check);

  router.get('/img/:dirId/:path?', controller.image.show);
  router.get('/vid/:dirId/:path?', controller.video.show);
  router.get('/pdf/:dirId/:path?', controller.pdf.show);

  router.get('/s/:shortId', controller.manga.expand);
  router.get('/(.*)', controller.index.render);

  return router;
};