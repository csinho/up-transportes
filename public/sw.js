/**
 * PWA motorista — cache do shell + roteamento offline quando já logado.
 */
const CACHE_VERSION = "transpo-motorista-v5";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const AUTH_DB = "erp_transp_motorista_sw_auth_v1";
const AUTH_STORE = "meta";

const PRECACHE_URLS = [
  "/motorista/dashboard",
  "/motorista/viagens",
  "/motorista",
  "/manifest.webmanifest",
];

const SHELL_URLS = ["/motorista", "/motorista/dashboard", "/motorista/viagens"];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isMotoristaPath(pathname) {
  return pathname === "/motorista" || pathname.startsWith("/motorista/");
}

function isMotoristaEntry(pathname) {
  return pathname === "/motorista" || pathname === "/motorista/";
}

function isMotoristaRelatedAsset(pathname) {
  if (!pathname.startsWith("/assets/")) return false;
  const lower = pathname.toLowerCase();
  return (
    lower.includes("motorista") ||
    lower.includes("motoristashell") ||
    lower.includes("use-motorista-data") ||
    lower.includes("viagemprogresso") ||
    lower.includes("viagemeventos") ||
    lower.includes("viagem-progresso")
  );
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

function openAuthDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(AUTH_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(AUTH_STORE)) {
        req.result.createObjectStore(AUTH_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getMotoristaLoggedIn() {
  try {
    const db = await openAuthDb();
    return new Promise((resolve) => {
      const tx = db.transaction(AUTH_STORE, "readonly");
      const req = tx.objectStore(AUTH_STORE).get("loggedIn");
      req.onsuccess = () => resolve(req.result === true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function setMotoristaLoggedIn(value) {
  const db = await openAuthDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUTH_STORE, "readwrite");
    tx.objectStore(AUTH_STORE).put(!!value, "loggedIn");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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

async function matchCachedPath(paths) {
  for (const path of paths) {
    const hit =
      (await caches.match(path)) || (await caches.match(path, { ignoreSearch: true }));
    if (hit) return hit;
  }
  return undefined;
}

async function resolveOfflineNavigation(request) {
  const url = new URL(request.url);
  const loggedIn = await getMotoristaLoggedIn();

  if (loggedIn && isMotoristaEntry(url.pathname)) {
    const dash = await matchCachedPath(["/motorista/dashboard", "/motorista/viagens"]);
    if (dash) return dash;
  }

  const exact = await caches.match(request);
  if (exact) return exact;

  if (loggedIn) {
    const dash = await matchCachedPath(["/motorista/dashboard", url.pathname, "/motorista"]);
    if (dash) return dash;
  }

  return matchCachedPath([url.pathname, "/motorista/dashboard", "/motorista"]);
}

async function networkFirstNavigation(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await runtime.put(request, response.clone());
    return response;
  } catch {
    const offline = await resolveOfflineNavigation(request);
    if (offline) return offline;
    throw new Error("offline");
  }
}

async function networkFirstWithCache(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await runtime.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
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

/** Offline: chunks do motorista já visitados — cache primeiro. */
async function cacheFirstAsset(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await runtime.put(request, response.clone());
    return response;
  } catch {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw new Error("offline");
  }
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
            .filter((k) => !k.startsWith(CACHE_VERSION) && k !== AUTH_DB)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data?.type) return;

  if (data.type === "MOTORISTA_OFFLINE_AUTH") {
    event.waitUntil(
      (async () => {
        await setMotoristaLoggedIn(!!data.loggedIn);
        if (data.loggedIn && Array.isArray(data.urls)) {
          await cacheUrls(data.urls);
        }
      })(),
    );
    return;
  }

  if (
    (data.type === "CACHE_MOTORISTA_ROUTES" || data.type === "CACHE_MOTORISTA_ASSETS") &&
    Array.isArray(data.urls)
  ) {
    event.waitUntil(cacheUrls(data.urls));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!shouldHandle(url, request)) return;

  if (isAppAsset(url.pathname)) {
    event.respondWith(
      isMotoristaRelatedAsset(url.pathname)
        ? cacheFirstAsset(request)
        : staleWhileRevalidate(request),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(networkFirstWithCache(request));
});
