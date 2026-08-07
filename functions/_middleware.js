// Cloudflare Pages middleware: block direct access to non-site files.
//
// On Pages, static assets are served before _redirects is consulted, so the
// _redirects force-404 rules never fire for real files like /PROGRESS.md or
// /CONCEPT.md. This middleware runs ahead of asset serving and returns a plain
// 404 for any blocked path. The _redirects file is kept as a belt-and-braces
// fallback.
//
// Matching is case-insensitive on the URL pathname.

const BLOCK_EXACT = [
  '/concept.md',
  '/progress.md',
  '/readme.md',
];

const BLOCK_PREFIX = [
  '/references/',
  '/verify/',
  '/functions/',
];

export function onRequest(context) {
  const path = new URL(context.request.url).pathname.toLowerCase();
  if (BLOCK_EXACT.includes(path) || BLOCK_PREFIX.some((p) => path.startsWith(p))) {
    return new Response('Not found', { status: 404 });
  }
  return context.next();
}
