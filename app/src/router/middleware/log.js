
export default async function log(ctx, next) {
  console.log(ctx.to.name);
  await next();
}