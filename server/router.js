
module.exports = app => {
  const { router, controller } = app;

  router.get('/', controller.index.render);

  // TODO: combind folder & list later
  router.get('/api/manga/folder/:dirId/:path?', controller.manga.folder);
  router.get('/api/manga/list/:dirId/:path?', controller.manga.list);
  router.post('/api/manga/share', controller.manga.share);

  router.get('/api/settings', controller.settings.get);
  router.post('/api/settings', controller.settings.post);

  router.get('/img/:dirId/:path?', controller.image.show);
  router.get('/vid/:dirId/:path?', controller.video.show);
  router.get('/pdf/:dirId/:path?', controller.pdf.show);

  router.get('/s/:shortId', controller.manga.expand);
  router.get('/(.*)', controller.index.render);

  return router;
};