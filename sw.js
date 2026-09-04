const CACHE_NAME = "pdr-v10";

// Push bildirimi (FCM) — uygulama kapalıyken/arka plandayken gelen
// bildirimleri göstermek için Firebase Messaging bu service worker
// içinde de başlatılıyor. Ana firebaseConfig ile birebir aynı olmalı.
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyAhS-sfwpZa2zb8GKSqcvihLdrBMtPOCTQ",
  authDomain: "rehber-pusula.firebaseapp.com",
  projectId: "rehber-pusula",
  storageBucket: "rehber-pusula.firebasestorage.app",
  messagingSenderId: "880787609777",
  appId: "1:880787609777:web:2987584e47fc78a2fc2a90",
});
const pdrSwMessaging = firebase.messaging();
pdrSwMessaging.onBackgroundMessage((payload) => {
  const baslik = (payload.notification && payload.notification.title) || "Rehber Pusula";
  const govde = (payload.notification && payload.notification.body) || "";
  self.registration.showNotification(baslik, { body: govde, icon: "./icon.png" });
});

const CACHE_URLS = [
  "./manifest.json",
  "./icon.png",
  "https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js",
  "https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.2/babel.min.js",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .catch(err => console.log("Cache error:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // API isteklerini cache'leme
  if (event.request.url.includes("anthropic.com") ||
      event.request.url.includes("workers.dev")) {
    return;
  }

  const isHTML = event.request.mode === "navigate" ||
    event.request.url.endsWith("index.html") ||
    event.request.url.endsWith("/");

  if (isHTML) {
    // Ana sayfa: önce ağdan taze veri çek, sadece çevrimdışıysa önbellekten göster.
    // Böylece güncellemeler her zaman anında yansır, eski sürüm takılı kalmaz.
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match("./index.html")))
    );
    return;
  }

  // Statik kütüphaneler (React, Babel vb.): önce önbellek, hızlı yükleme için.
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          });
      })
  );
});
