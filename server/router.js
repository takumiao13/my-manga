
module.exports = app => {
  const { router, controller } = app;

  router.get('/', controller.index.render);

  router.get('/api/manga/folder/:baseDir/:path?', controller.manga.folder);
  router.get('/api/manga/list/:baseDir/:path?', controller.manga.list);

  router.get('/api/settings', controller.settings.get);
  router.post('/api/settings', controller.settings.post);

  router.get('/img/:baseDir/:path?', controller.image.show);
  
  router.get('/(.*)', controller.index.render);

  return router;
};