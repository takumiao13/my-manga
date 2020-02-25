
module.exports = app => {
  const { router, controller } = app;

  router.get('/', controller.index.render);

  router.get('/api/mangas/:dirId/:path?/folder', controller.manga.folder);
  router.get('/api/mangas/:dirId/:path?/list', controller.manga.list);
  router.get('/api/mangas/:dirId/:path?/pick', controller.manga.pick);
  router.get('/api/mangas/:dirId/:path?/search', controller.manga.search);
  router.get('/api/mangas/:dirId/version', controller.manga.version);
  router.get('/api/mangas/:dirId/latest', controller.manga.latest);
  router.post('/api/mangas/share', controller.manga.share);

  router.get('/api/settings', controller.settings.get);
  router.post('/api/settings', controller.settings.post);

  router.get('/img/:dirId/:path?', controller.image.show);
  router.get('/vid/:dirId/:path?', controller.video.show);
  router.get('/pdf/:dirId/:path?', controller.pdf.show);

  router.get('/s/:shortId', controller.manga.expand);
  router.get('/(.*)', controller.index.render);

  return router;
};