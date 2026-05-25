/**
 * PWA motorista — cache do shell (HTML/JS/CSS) para abrir offline.
 * Dados de negócio ficam no IndexedDB (app React).
 */
const CACHE_VERSION = "transpo-motorista-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/motorista",
  "/motorista/dashboard",
  "/motorista/viagens",
  "/manifest.webmanifest",
];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isMotoristaPath(pathname) {
  return pathname === "/motorista" || pathname.startsWith("/motorista/");
}

function isAppAsset(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/icons/") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".woff") ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest"
  );
}

function shouldHandle(url, request) {
  if (!isSameOrigin(url)) return false;
  if (request.method !== "GET") return false;
  return isMotoristaPath(url.pathname) || isAppAsset(url.pathname);
}

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  await Promise.allSettled(
    urls.map(async (path) => {
      const res = await fetch(path, { credentials: "same-origin" });
      if (res.ok) await cache.put(path, res);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map((path) =>
            fetch(path, { credentials: "same-origin" }).then((res) => {
              if (res.ok) return cache.put(path, res);
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data?.type === "CACHE_MOTORISTA_ROUTES" && Array.isArray(data.urls)) {
    event.waitUntil(cacheUrls(data.urls));
  }
});

async function networkFirstWithCache(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await runtime.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return (
        (await caches.match("/motorista/dashboard")) ||
        (await caches.match("/motorista")) ||
        (await caches.match("/motorista", { ignoreSearch: true }))
      );
    }
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) runtime.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || network || (await network);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!shouldHandle(url, request)) return;

  if (isAppAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirstWithCache(request));
});
