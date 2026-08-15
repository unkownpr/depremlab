#!/usr/bin/env python3
"""
depremlab — wizard uygulamasını tek dosyaya paketler.

Girdi:  scripts/_app_data.json · app_style.css · app_body.html
        risk_engine.js · app_main.js
Çıktı:  index.html  (çift tıkla açılır, sunucu gerektirmez)

Çalıştırma:
    python3 scripts/app_data.py     # veri paketi (önce bu)
    python3 scripts/build_app.py    # index.html
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
S = Path(__file__).resolve().parent

ISKELET = """<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>depremlab — Eviniz depreme ne kadar hazır?</title>
<meta name="description" content="İstanbul için konum, zemin, fay uzaklığı ve bina bilgisiyle deprem risk değerlendirmesi. Açık veriye dayanır, hiçbir bilgi kaydedilmez.">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#faf7f1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="depremlab">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0&family=Inter:wght@400;600&display=swap">
<style>
__STIL__
</style>
</head>
<body>
__GOVDE__
<script>
const D = __VERI__;
</script>
<script>
__MOTOR__
</script>
<script>
__KONTROL__
</script>
<script>
__ANA__
</script>
<script>
/* PWA — yalnızca güvenli kaynakta (https / localhost) çalışır.
   file:// ile açıldığında sessizce atlanır, sayfa normal işler. */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
</script>
</body>
</html>
"""


def motoru_temizle(js):
    """risk_engine.js'in module.exports bloğunu tarayıcı için çıkarır."""
    return re.sub(r"\nif \(typeof module.*?\n\}\n", "\n", js, flags=re.S)


def main():
    veri = (S / "_app_data.json").read_text(encoding="utf-8")
    stil = (S / "app_style.css").read_text(encoding="utf-8")
    govde = (S / "app_body.html").read_text(encoding="utf-8")
    motor = motoru_temizle((S / "risk_engine.js").read_text(encoding="utf-8"))
    kontrol = motoru_temizle((S / "nonstructural.js").read_text(encoding="utf-8"))
    ana = (S / "app_main.js").read_text(encoding="utf-8")

    html = (ISKELET
            .replace("__STIL__", stil)
            .replace("__GOVDE__", govde)
            .replace("__VERI__", veri)
            .replace("__MOTOR__", motor)
            .replace("__KONTROL__", kontrol)
            .replace("__ANA__", ana))

    hedef = ROOT / "index.html"
    hedef.write_text(html, encoding="utf-8")

    d = json.loads(veri)
    print(f"index.html yazıldı — {hedef.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"  vs30 {d['vs30']['w']}×{d['vs30']['h']} · ilçe {len(d['ilceler'])} "
          f"· fay {len(d['faylar'])}")
    print(f"  parallax path: " + " · ".join(
        f"{k}={len(v)}" for k, v in d["parallax"]["katmanlar"].items()))


if __name__ == "__main__":
    main()
