
let meta = null;

export default async function themeColor(ctx, next) {
  // change mobile top theme color
  if (!meta) {
    meta = document.querySelector('[name="theme-color"]');
  }
  
  meta.content = ctx.to.meta.themeColor || '#fff';
  await next();
}