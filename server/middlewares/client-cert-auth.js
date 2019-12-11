module.exports = () => async (ctx, next) => {
  const { req } = ctx;
  if (!req.client.authorized) {
    ctx.status = 401;
    ctx.body = 'User is not authorized'
    return;
  }
  // examine the cert itself, and even validate based on that!
  var cert = req.socket.getPeerCertificate();
  if (!cert.subject) {
    ctx.status = 401;
    ctx.body = 'Cannot find certificate'
    return;
  }

  await next();
}