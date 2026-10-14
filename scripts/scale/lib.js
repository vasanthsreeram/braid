window.B = {
  refresh() {
    // One shared refresh; everyone who saw a 401/404 waits on it, then retries.
    if (!B.refreshing || Date.now() - B.refreshedAt > 15000) {
      B.refreshedAt = Date.now();
      B.refreshing = fetch("/auth/refresh", { method: "POST" });
    }
    return B.refreshing;
  },
  async api(path, body, method) {
    let r, v;
    for (let i = 0; i < 4; i++) {
      r = await fetch(path, {
        method: method || (body ? "POST" : "GET"),
        headers: body ? { "content-type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const t = await r.text();
      try { v = JSON.parse(t); } catch { v = t; }
      // Access tokens are short-lived; private repos answer 404 to anonymous callers.
      if ((r.status === 401 || (r.status === 404 && v?.message === "Not found")) && i < 3) { await B.refresh(); continue; }
      break;
    }
    return { status: r.status, v };
  },
  async pool(items, n, fn) {
    const out = new Array(items.length); let i = 0;
    await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
    return out;
  },
};
