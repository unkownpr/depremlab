#!/usr/bin/env python3
"""
depremlab — PWA dosyalarını üretir: manifest, service worker, ikonlar.

Çıktı:  manifest.webmanifest · sw.js · icons/*.png

PWA yalnızca HTTPS veya localhost üzerinde çalışır — file:// ile açıldığında
sayfa normal çalışır ama kurulabilir olmaz.
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
IKON = ROOT / "icons"

KAGIT = (250, 247, 241)
MUREKKEP = (36, 32, 28)
AKSAN = (176, 82, 42)

# manifest ikon boyutları + maskable için güvenli alan payı
BOYUTLAR = [192, 512]


def ikon_ciz(px, maskable=False):
    """Sismogram dalgası — markanın görsel çekirdeği."""
    img = Image.new("RGBA", (px, px), KAGIT + (255,))
    d = ImageDraw.Draw(img)

    # maskable ikonlarda kenarların kırpılacağını varsayıp içeriği %80'e sıkıştır
    pay = 0.20 if maskable else 0.12
    ic = px * (1 - 2 * pay)
    x0 = y0 = px * pay

    # taban çizgisi
    orta = y0 + ic / 2
    d.line([(x0, orta), (x0 + ic, orta)], fill=MUREKKEP + (70,),
           width=max(1, px // 128))

    # sismogram: sönümlenen salınım
    noktalar = []
    n = 240
    for i in range(n + 1):
        t = i / n
        x = x0 + ic * t
        # merkeze yaklaştıkça genlik artar, sonra söner
        zarf = math.exp(-((t - 0.42) ** 2) / 0.038)
        dalga = math.sin(t * 21) * 0.55 + math.sin(t * 44) * 0.2
        y = orta - dalga * zarf * ic * 0.46
        noktalar.append((x, y))

    kalem = max(2, round(px / 26))
    d.line(noktalar, fill=AKSAN + (255,), width=kalem, joint="curve")

    # ana darbe: dikey vurgu
    zx = x0 + ic * 0.42
    d.line([(zx, orta - ic * 0.44), (zx, orta + ic * 0.44)],
           fill=MUREKKEP + (255,), width=max(2, round(px / 40)))
    return img


def main():
    IKON.mkdir(exist_ok=True)
    yazilan = []
    for b in BOYUTLAR:
        p = IKON / f"icon-{b}.png"
        ikon_ciz(b).save(p)
        yazilan.append(p.name)
        pm = IKON / f"icon-{b}-maskable.png"
        ikon_ciz(b, maskable=True).save(pm)
        yazilan.append(pm.name)

    # Apple touch icon (maskable değil, köşeleri iOS yuvarlar)
    ikon_ciz(180).save(IKON / "apple-touch-icon.png")
    yazilan.append("apple-touch-icon.png")

    manifest = {
        "name": "depremlab — deprem risk değerlendirmesi",
        "short_name": "depremlab",
        "description": "İstanbul için konum, zemin, fay uzaklığı ve bina "
                       "bilgisiyle deprem risk değerlendirmesi.",
        "start_url": "./index.html",
        "scope": "./",
        "display": "standalone",
        "orientation": "portrait-primary",
        "background_color": "#faf7f1",
        "theme_color": "#faf7f1",
        "lang": "tr",
        "dir": "ltr",
        "categories": ["utilities", "education"],
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png",
             "purpose": "any"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png",
             "purpose": "any"},
            {"src": "icons/icon-192-maskable.png", "sizes": "192x192",
             "type": "image/png", "purpose": "maskable"},
            {"src": "icons/icon-512-maskable.png", "sizes": "512x512",
             "type": "image/png", "purpose": "maskable"},
        ],
        "shortcuts": [
            {"name": "Bina değerlendirmesi", "url": "./index.html#basla"},
            {"name": "Harita", "url": "./harita.html"},
        ],
    }
    (ROOT / "manifest.webmanifest").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    (ROOT / "sw.js").write_text(SW, encoding="utf-8")

    print("PWA dosyaları yazıldı:")
    print("  manifest.webmanifest")
    print("  sw.js")
    for n in yazilan:
        print(f"  icons/{n}")
    print("\nNot: PWA yalnızca HTTPS veya localhost üzerinde kurulabilir.")


SW = r"""/* depremlab service worker — çevrimdışı kullanım.
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
"""


if __name__ == "__main__":
    main()
