
export default async function log(ctx, next) {
  await next();
}