#!/usr/bin/env python3
"""
depremlab — wizard uygulamasının veri paketini üretir.

Çıktı: scripts/_app_data.json  (build_app.py bunu HTML'e gömer)

build_map.py'deki hazırlayıcıları yeniden kullanır; ek olarak parallax
katmanları için fay geometrisini SVG path'lerine çevirir.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_map import (acil_yollar, faylar, ilce_poligonlari,  # noqa: E402
                       tesisler, vs30_gridi)

# Parallax SVG'nin çizim kutusu — İstanbul ve Marmara'nın kuzeyi
PARALLAX_KUTU = {"bati": 27.80, "dogu": 30.00, "guney": 40.55, "kuzey": 41.70}
SVG_EN, SVG_BOY = 1200, 420


def svg_path(pts, kutu, en, boy):
    """[[lat,lon],...] -> SVG path 'd' dizesi."""
    dx = kutu["dogu"] - kutu["bati"]
    dy = kutu["kuzey"] - kutu["guney"]
    parca = []
    for i, (lat, lon) in enumerate(pts):
        x = (lon - kutu["bati"]) / dx * en
        y = (kutu["kuzey"] - lat) / dy * boy
        parca.append(f"{'M' if i == 0 else 'L'}{x:.1f} {y:.1f}")
    return "".join(parca)


def parallax_katmanlari(fay_listesi):
    """Fayları önem derecesine göre üç parallax katmanına ayırır."""
    katman = {"on": [], "orta": [], "arka": []}
    for f in fay_listesi:
        d = svg_path(f["pts"], PARALLAX_KUTU, SVG_EN, SVG_BOY)
        onem = f.get("onem") or 0
        if onem >= 6:
            katman["on"].append(d)
        elif onem >= 4:
            katman["orta"].append(d)
        else:
            katman["arka"].append(d)
    return katman


def main():
    fay = faylar()
    # Acil yollar wizard'da yalnızca "en yakın yol" mesafesi için kullanılıyor;
    # çizilmediği için haritadakinden daha sert basitleştirilebilir.
    yollar = [{"ad": y["ad"], "pts": y["pts"]} for y in acil_yollar()]
    veri = {
        "vs30": vs30_gridi(),
        "ilceler": ilce_poligonlari(),
        "faylar": fay,
        "yollar": yollar,
        "tesisler": tesisler(),
        "parallax": {
            "en": SVG_EN, "boy": SVG_BOY,
            "katmanlar": parallax_katmanlari(fay),
        },
    }
    hedef = Path(__file__).resolve().parent / "_app_data.json"
    hedef.write_text(json.dumps(veri, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print(f"_app_data.json — {hedef.stat().st_size / 1024:.0f} KB")
    print(f"  vs30 {veri['vs30']['w']}×{veri['vs30']['h']} · ilçe {len(veri['ilceler'])} "
          f"· fay {len(fay)} · acil yol {len(yollar)}")
    print("  parallax katman: " + " · ".join(
        f"{k}={len(v)}" for k, v in veri["parallax"]["katmanlar"].items()))
    for k, v in veri["tesisler"].items():
        print(f"  {k}: {len(v)}")


if __name__ == "__main__":
    main()
