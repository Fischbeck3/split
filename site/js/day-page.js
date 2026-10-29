// A date's own page (d/2026-10-29/) carries that day's link preview. The game
// itself still reads ?day=, so the page restores it before anything else runs.

/** The address a day page plays at, or null when this is not a day page. Self-contained: the build inlines it. */
export function playAddress(href){
  const url = new URL(href);
  const match = /^(.*\/)d\/(\d{4}-\d{2}-\d{2})\/(?:index\.html)?$/.exec(url.pathname);
  if (!match || new URLSearchParams(url.search).has('day')) return null;
  url.pathname = match[1];
  url.search = '?day=' + match[2] + (url.search.length > 1 ? '&' + url.search.slice(1) : '');
  return url.href;
}

/** The share link for a date: its own page, with the benchmark in a short query. */
export function dayPageAddress(href){
  const url = new URL(href), key = url.searchParams.get('day');
  if (!key) return url.href;
  url.searchParams.delete('day');
  url.pathname = url.pathname.replace(/\/?$/, '/') + 'd/' + key + '/';
  // Commas are valid in a query; leaving them literal keeps the sip scores legible.
  url.search = url.searchParams.toString().replace(/%2C/g, ',');
  return url.href;
}
