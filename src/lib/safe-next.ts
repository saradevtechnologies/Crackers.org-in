/** Only allow same-site paths as a post-login redirect ("/orders", not "//evil.com" or "https://…"). */
export function safeNext(next: string | null | undefined, fallback = '/') {
  const n = (next || '').trim();
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : fallback;
}
