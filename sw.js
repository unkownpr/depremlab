/* depremlab service worker — çevrimdışı kullanım.
 *
 * İki strateji:
 *   uygulama kabuğu (html/js/css/ikon) -> önce önbellek, arkada tazele
 *   harita karoları                    -> önce ağ, başarısızsa önbellek
 *
 * Sürüm değişince eski önbellekler silinir.
 */
const SURUM = 'depremlab-v1';
const KABUK = `${SURUM}-kabuk`;
const KARO = `${SURUM}-karo`;

const ON_YUKLE = [
  './',
  './index.html',
  './harita.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(KABUK)
      // tek bir kaynak düşerse kurulum tamamen çökmesin
      .then(c => Promise.allSettled(ON_YUKLE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(
        adlar.filter(a => !a.startsWith(SURUM)).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

const karoMu = url =>
  /arcgisonline\.com|basemaps\.cartocdn\.com|tile\.openstreetmap\.org/.test(url);

self.addEventListener('fetch', e => {
  const istek = e.request;
  if (istek.method !== 'GET') return;
  const url = istek.url;

  if (karoMu(url)) {
    // karolar: ağ önce, düşerse önbellekten ver
    e.respondWith(
      fetch(istek).then(y => {
        if (y && y.status === 200) {
          const kopya = y.clone();
          caches.open(KARO).then(c => c.put(istek, kopya));
        }
        return y;
      }).catch(() => caches.match(istek))
    );
    return;
  }

  // kabuk: önbellek önce, arkada tazele
  e.respondWith(
    caches.match(istek).then(onbellek => {
      const ag = fetch(istek).then(y => {
        if (y && y.status === 200 && (y.type === 'basic' || y.type === 'cors')) {
          const kopya = y.clone();
          caches.open(KABUK).then(c => c.put(istek, kopya));
        }
        return y;
      }).catch(() => onbellek);
      return onbellek || ag;
    })
  );
});
