
module.exports = app => {
  const { router, controller } = app;

  router.get('/', controller.index.render);

  router.get('/api/manga/folder/:dirId/:path?', controller.manga.folder);
  router.get('/api/manga/list/:dirId/:path?', controller.manga.list);
  router.post('/api/manga/share', controller.manga.share);

  router.get('/api/settings', controller.settings.get);
  router.post('/api/settings', controller.settings.post);

  router.get('/img/:dirId/:path?', controller.image.show);

  router.get('/s/:shortId', controller.manga.expand);
  router.get('/(.*)', controller.index.render);

  return router;
};