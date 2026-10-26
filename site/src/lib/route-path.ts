/** The route path the window shows, from its hash: `#/components/button` gives `/components/button`. */
export function currentPath(): string {
  const path = window.location.hash.replace(/^#/, '').split('?')[0] ?? '';
  return path === '' ? '/' : path;
}
