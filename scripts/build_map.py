#!/usr/bin/env python3
"""
depremlab — türetilmiş veriyi tek dosyalık interaktif Leaflet haritasına paketler.

Girdi:  data/**, derived/**
Çıktı:  harita.html  (çift tıkla açılır, sunucu gerektirmez)

Çalıştırma:  python3 scripts/build_map.py
"""
import csv
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DERIVED = ROOT / "derived"

# İstanbul merkezine bu mesafeden uzaktaki faylar haritaya girmez (km)
FAY_YARICAP = 160
MERKEZ = (28.98, 41.02)
R = 6371.0


def haversine(lon1, lat1, lon2, lat2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))


def basitlestir(pts, tol):
    """Douglas-Peucker. Poligon nokta sayısını kırpar, dosya boyutunu düşürür."""
    if len(pts) < 3:
        return pts
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    enuzak, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        if L == 0:
            d = math.hypot(px - ax, py - ay)
        else:
            t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
            d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
        if d > enuzak:
            enuzak, idx = d, i
    if enuzak <= tol:
        return [pts[0], pts[-1]]
    return basitlestir(pts[:idx + 1], tol)[:-1] + basitlestir(pts[idx:], tol)


# --------------------------------------------------------------------------
# katman verileri
# --------------------------------------------------------------------------
def vs30_gridi():
    """Vs30'u düzenli grid dizisine çevirir — canvas'ta çizmek için."""
    lats, lons, val = set(), set(), {}
    with open(DATA / "vs30" / "istanbul_vs30.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            la, lo = round(float(r["lat"]), 5), round(float(r["lon"]), 5)
            lats.add(la)
            lons.add(lo)
            val[(la, lo)] = float(r["vs30"])
    lats = sorted(lats, reverse=True)   # kuzeyden güneye
    lons = sorted(lons)
    duz = []
    for la in lats:
        for lo in lons:
            v = val.get((la, lo))
            duz.append(-1 if v is None else round(v))
    yarim_lat = (lats[0] - lats[1]) / 2 if len(lats) > 1 else 0.004
    yarim_lon = (lons[1] - lons[0]) / 2 if len(lons) > 1 else 0.004
    return {
        "w": len(lons), "h": len(lats),
        "kuzey": lats[0] + yarim_lat, "guney": lats[-1] - yarim_lat,
        "bati": lons[0] - yarim_lon, "dogu": lons[-1] + yarim_lon,
        "v": duz,
    }


def ilce_poligonlari():
    # build.py'deki halka birleştiricisini kullan: OSM relation üyeleri kopuk
    # way parçalarıdır, uç uca eklenmeden çizilirse Leaflet onları delik sanır.
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from build import birlestir_halkalar

    raw = json.loads((DATA / "facilities" / "ilce_sinirlari_raw.json").read_text())
    ozet = {}
    with open(DERIVED / "istanbul_ilce_ozet.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            ozet[r["ilce"]] = r

    cikti = []
    for el in raw["elements"]:
        ad = el["tags"].get("name")
        if not ad:
            continue
        parcalar = [[(p["lon"], p["lat"]) for p in m["geometry"]]
                    for m in el.get("members", [])
                    if m.get("role") == "outer" and m.get("geometry")]
        if not parcalar:
            continue
        sys.setrecursionlimit(20000)
        halkalar = []
        for h in birlestir_halkalar(parcalar):
            s = basitlestir(h, 0.0012)
            if len(s) >= 3:
                halkalar.append([[round(y, 5), round(x, 5)] for x, y in s])
        if not halkalar:
            continue
        o = ozet.get(ad, {})
        cikti.append({
            "ad": ad,
            "halkalar": halkalar,
            "can": int(o.get("senaryo_can_kaybi") or 0),
            "hasar": int(o.get("senaryo_agir_hasarli_bina") or 0),
            "barinma": int(o.get("senaryo_gecici_barinma") or 0),
            "m2kisi": float(o.get("barinma_basina_m2") or 0),
            "vs30": float(o.get("vs30_ort") or 0),
            "fay_km": float(o.get("fay_km") or 0),
            "fay_ad": o.get("en_yakin_fay", ""),
            "hast": int(o.get("hastane_sayisi") or 0),
            "itfa": int(o.get("itfaiye_sayisi") or 0),
            "pol": int(o.get("polis_sayisi") or 0),
            "topl": int(o.get("toplanma_alani_sayisi") or 0),
            "yesil_ha": float(o.get("acik_yesil_alan_ha") or 0),
            "g_itfa": float(o.get("grid_ort_itfaiye_km") or 0),
            "g_itfa_kotu": float(o.get("grid_enkotu_itfaiye_km") or 0),
            "g_hast": float(o.get("grid_ort_hastane_km") or 0),
            "g_topl": float(o.get("grid_ort_toplanma_km") or 0),
        })
    return cikti


def faylar():
    gj = json.loads((DATA / "faults" / "tr_faults_imp.geojson").read_text())
    out = []
    for f in gj["features"]:
        c = f["geometry"]["coordinates"]
        if not c:
            continue
        if min(haversine(MERKEZ[0], MERKEZ[1], p[0], p[1]) for p in c) > FAY_YARICAP:
            continue
        p = f["properties"]
        s = basitlestir([(x[0], x[1]) for x in c], 0.002)
        out.append({
            "ad": (p.get("FAULT_NAME") or p.get("ZONE_NAME") or "?").strip(),
            "onem": p.get("importance", 0),
            "oran": p.get("RATE", ""),
            "pts": [[round(y, 5), round(x, 5)] for x, y in s],
        })
    return out


def acil_yollar():
    """İBB 1. derece acil ulaşım yolları. MultiLineString'ler tek tek parçalanır."""
    gj = json.loads((DATA / "ibb" / "acil_ulasim.geojson").read_text())
    out = []
    for f in gj["features"]:
        g, p = f["geometry"], f["properties"]
        parcalar = ([g["coordinates"]] if g["type"] == "LineString"
                    else g["coordinates"] if g["type"] == "MultiLineString" else [])
        for c in parcalar:
            if len(c) < 2:
                continue
            s = basitlestir([(x[0], x[1]) for x in c], 0.0004)
            if len(s) < 2:
                continue
            out.append({
                "ad": (p.get("YOL_ISMI") or "").strip(),
                "ilce": (p.get("ILCE_ADI") or "").strip(),
                "pts": [[round(y, 5), round(x, 5)] for x, y in s],
            })
    return out


def depremler():
    out = []
    with open(DERIVED / "depremler.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            try:
                m = float(r["mag"])
            except (TypeError, ValueError):
                continue
            out.append([round(float(r["lat"]), 4), round(float(r["lon"]), 4),
                        round(m, 1), r["tarih_utc"][:10],
                        round(float(r["derinlik_km"] or 0), 1), r["yer"][:60]])
    return out


def tesisler():
    grup = defaultdict(list)
    with open(DERIVED / "tesisler.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            grup[r["tip"]].append([round(float(r["lat"]), 5), round(float(r["lon"]), 5),
                                   r["ad"][:60], r["kaynak"]])
    return grup


def yesil():
    out = []
    with open(DERIVED / "yesil_alanlar.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            ha = float(r["alan_ha"])
            if ha < 0.1:
                continue
            out.append([round(float(r["lat"]), 5), round(float(r["lon"]), 5),
                        round(ha, 2), r["ad"][:50], r["tur"][:30]])
    return out


# --------------------------------------------------------------------------
HTML = r"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>depremlab — İstanbul Deprem Risk Haritası</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  :root {
    --bg: #12151a; --panel: #1a1f27; --line: #2a3240;
    --ink: #e6ebf2; --ink2: #9aa7b8; --acc: #4da3ff;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
               background: var(--bg); color: var(--ink); }
  #map { position: absolute; inset: 0; }
  .panel {
    position: absolute; top: 12px; right: 12px; width: 310px; max-height: calc(100% - 24px);
    overflow-y: auto; background: rgba(26,31,39,.95); border: 1px solid var(--line);
    border-radius: 10px; padding: 14px; z-index: 1000; backdrop-filter: blur(8px);
  }
  .panel h1 { font-size: 15px; margin: 0 0 2px; }
  .panel .sub { color: var(--ink2); font-size: 11px; margin-bottom: 12px; }
  .grp { border-top: 1px solid var(--line); padding-top: 10px; margin-top: 10px; }
  .grp h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .07em;
            color: var(--ink2); margin: 0 0 7px; }
  label { display: flex; align-items: center; gap: 7px; padding: 3px 0; cursor: pointer; }
  input[type=checkbox], input[type=radio] { accent-color: var(--acc); margin: 0; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
  select, input[type=range] { width: 100%; margin-top: 4px; }
  select { background: var(--bg); color: var(--ink); border: 1px solid var(--line);
           border-radius: 6px; padding: 5px; font-size: 12px; }
  .lej { display: flex; height: 11px; border-radius: 3px; overflow: hidden; margin: 7px 0 3px; }
  .lej i { flex: 1; }
  .lejtxt { display: flex; justify-content: space-between; color: var(--ink2); font-size: 10px; }
  .note { color: var(--ink2); font-size: 10.5px; margin-top: 9px; line-height: 1.45; }
  .leaflet-popup-content-wrapper { background: var(--panel); color: var(--ink); border-radius: 8px; }
  .leaflet-popup-tip { background: var(--panel); }
  .leaflet-popup-content { margin: 11px 13px; font-size: 12px; }
  .pop b { color: var(--acc); }
  .pop table { border-collapse: collapse; margin-top: 6px; }
  .pop td { padding: 1px 9px 1px 0; }
  .pop td:last-child { text-align: right; color: var(--ink2); }
  .toggle { position: absolute; top: 12px; right: 12px; z-index: 1001; display: none;
            background: var(--panel); border: 1px solid var(--line); color: var(--ink);
            border-radius: 8px; padding: 8px 11px; cursor: pointer; }
  @media (max-width: 700px) {
    .panel { width: calc(100% - 24px); max-height: 55%; }
    .toggle { display: block; }
    .panel.gizli { display: none; }
  }
</style>
</head>
<body>
<div id="map"></div>
<button class="toggle" onclick="document.querySelector('.panel').classList.toggle('gizli')">☰</button>
<div class="panel">
  <h1>İstanbul Deprem Risk Haritası</h1>
  <div class="sub">depremlab · veri kaynakları için KAYNAKLAR.md</div>

  <div class="grp">
    <h2>Zemin haritası</h2>
    <select id="zemin">
      <option value="Uydu + etiket" selected>Uydu + etiket</option>
      <option value="Uydu">Uydu (sade)</option>
      <option value="Koyu">Koyu</option>
      <option value="Açık">Açık</option>
    </select>
  </div>

  <div class="grp">
    <h2>İlçe boyaması</h2>
    <select id="metrik">
      <option value="yok">— yok —</option>
      <option value="can" selected>Senaryo: can kaybı</option>
      <option value="hasar">Senaryo: ağır hasarlı bina</option>
      <option value="barinma">Senaryo: geçici barınma ihtiyacı</option>
      <option value="m2kisi">Açık alan (m²/kişi) — düşük kötü</option>
      <option value="vs30">Vs30 ortalaması — düşük kötü</option>
      <option value="g_itfa">İtfaiyeye ortalama mesafe</option>
      <option value="g_itfa_kotu">İtfaiye — en kötü nokta</option>
      <option value="g_hast">Hastaneye ortalama mesafe</option>
      <option value="g_topl">Toplanma alanına ort. mesafe</option>
    </select>
    <div class="lej" id="lej"></div>
    <div class="lejtxt"><span id="lejmin"></span><span id="lejmax"></span></div>
  </div>

  <div class="grp">
    <h2>Katmanlar</h2>
    <label><input type="checkbox" id="k_vs30"> <span class="dot" style="background:linear-gradient(90deg,#d7191c,#2c7bb6)"></span> Vs30 zemin gridi</label>
    <label><input type="checkbox" id="k_fay" checked> <span class="dot" style="background:#ff4d4d"></span> Fay hatları</label>
    <label><input type="checkbox" id="k_eq"> <span class="dot" style="background:#ffd166"></span> Depremler (1905–2025)</label>
    <label><input type="checkbox" id="k_hast"> <span class="dot" style="background:#ff5c8a"></span> Hastane</label>
    <label><input type="checkbox" id="k_itfa"> <span class="dot" style="background:#ff8c42"></span> İtfaiye</label>
    <label><input type="checkbox" id="k_pol"> <span class="dot" style="background:#4da3ff"></span> Polis</label>
    <label><input type="checkbox" id="k_topl"> <span class="dot" style="background:#2ecc71"></span> Toplanma alanı (OSM)</label>
    <label><input type="checkbox" id="k_yesil"> <span class="dot" style="background:#7bd389"></span> Açık/yeşil alan (İBB)</label>
    <label><input type="checkbox" id="k_yol"> <span class="dot" style="background:#ffe066"></span> 1. derece acil ulaşım yolu</label>
  </div>

  <div class="grp" id="eqgrp" style="display:none">
    <h2>Deprem filtresi — <span id="eqlbl">M≥4.0</span></h2>
    <input type="range" id="eqmin" min="0" max="7" step="0.5" value="4">
    <div class="lejtxt"><span>M0</span><span id="eqsay"></span><span>M7</span></div>
  </div>

  <div class="grp">
    <h2>Saydamlık</h2>
    <label style="display:block;color:var(--ink2);font-size:11px">İlçe boyaması
      <input type="range" id="ilop" min="0" max="100" value="50"></label>
    <label style="display:block;color:var(--ink2);font-size:11px;margin-top:6px">Vs30 gridi
      <input type="range" id="vsop" min="0" max="100" value="70"></label>
  </div>

  <div class="note" id="note"></div>
</div>

<script>
const D = __VERI__;

// İstanbul dışına çıkılamasın: görünüm bu kutuya kilitli.
// Güney kenarı Marmara'daki fayları kapsayacak kadar bırakıldı.
const IST_SINIR = L.latLngBounds([[40.62, 27.80], [41.68, 29.98]]);
const map = L.map('map', {
  center: [41.02, 28.95], zoom: 10, zoomControl: true, preferCanvas: true,
  maxBounds: IST_SINIR, maxBoundsViscosity: 1.0, minZoom: 10, maxZoom: 18,
});

const ATIF = 'veri: USGS, İBB, OSM';
const zeminler = {
  'Uydu': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Esri, Maxar, Earthstar Geographics | ' + ATIF, maxZoom: 19 }),
  'Uydu + etiket': L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri, Maxar | ' + ATIF, maxZoom: 19 }),
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, opacity: 0.9 }),
  ]),
  'Koyu': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution: '&copy; OpenStreetMap &copy; CARTO | ' + ATIF, maxZoom: 19 }),
  'Açık': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    { attribution: '&copy; OpenStreetMap &copy; CARTO | ' + ATIF, maxZoom: 19 }),
};
zeminler['Uydu + etiket'].addTo(map);
let aktifZemin = zeminler['Uydu + etiket'];
function zeminSec(ad) {
  if (aktifZemin) map.removeLayer(aktifZemin);
  aktifZemin = zeminler[ad];
  aktifZemin.addTo(map);
  if (aktifZemin.eachLayer) aktifZemin.eachLayer(l => l.bringToBack && l.bringToBack());
  else aktifZemin.bringToBack();
}

/* ---------- Vs30 canvas overlay ---------- */
function vs30Renk(v) {
  // 180 (yumuşak/riskli) -> 900 (sert) : kırmızı -> mavi
  const t = Math.max(0, Math.min(1, (v - 180) / (900 - 180)));
  const duraklar = [[215,25,28],[253,174,97],[255,255,191],[171,221,164],[43,131,186]];
  const x = t * (duraklar.length - 1), i = Math.min(Math.floor(x), duraklar.length - 2), f = x - i;
  const a = duraklar[i], b = duraklar[i + 1];
  return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
}
const g = D.vs30;
const cv = document.createElement('canvas');
cv.width = g.w; cv.height = g.h;
const cx = cv.getContext('2d');
const img = cx.createImageData(g.w, g.h);
for (let i = 0; i < g.v.length; i++) {
  const v = g.v[i];
  if (v < 0) { img.data[i*4+3] = 0; continue; }
  const [r, gg, b] = vs30Renk(v);
  img.data[i*4] = r; img.data[i*4+1] = gg; img.data[i*4+2] = b; img.data[i*4+3] = 255;
}
cx.putImageData(img, 0, 0);
const vs30Katman = L.imageOverlay(cv.toDataURL(),
  [[g.guney, g.bati], [g.kuzey, g.dogu]], { opacity: 0.7 });

/* ---------- ilçe choropleth ---------- */
const METRIK = {
  can:        { ad: 'can kaybı',            birim: 'kişi', ters: false },
  hasar:      { ad: 'ağır hasarlı bina',    birim: 'bina', ters: false },
  barinma:    { ad: 'geçici barınma',       birim: 'kişi', ters: false },
  m2kisi:     { ad: 'açık alan',            birim: 'm²/kişi', ters: true },
  vs30:       { ad: 'Vs30 ort.',            birim: 'm/s', ters: true },
  g_itfa:     { ad: 'itfaiye ort. mesafe',  birim: 'km', ters: false },
  g_itfa_kotu:{ ad: 'itfaiye en kötü',      birim: 'km', ters: false },
  g_hast:     { ad: 'hastane ort. mesafe',  birim: 'km', ters: false },
  g_topl:     { ad: 'toplanma ort. mesafe', birim: 'km', ters: false },
};
function skalaRenk(t) {
  const duraklar = [[44,123,182],[171,217,233],[255,255,191],[253,174,97],[215,25,28]];
  const x = Math.max(0,Math.min(1,t)) * (duraklar.length - 1);
  const i = Math.min(Math.floor(x), duraklar.length - 2), f = x - i;
  const a = duraklar[i], b = duraklar[i+1];
  return `rgb(${a[0]+(b[0]-a[0])*f|0},${a[1]+(b[1]-a[1])*f|0},${a[2]+(b[2]-a[2])*f|0})`;
}
const ilceKatman = L.layerGroup().addTo(map);
let ilcePoly = [];
D.ilceler.forEach(il => {
  // Her kapalı halka AYRI polygon: tek L.polygon'a çoklu halka verilirse
  // ilki dış sınır, kalanlar delik sayılır (Adalar gibi çok parçalı ilçelerde hata).
  const p = L.featureGroup(il.halkalar.map(h => L.polygon([h], {
    color: '#5b6b80', weight: 1, fillOpacity: 0.5, fillColor: '#39424f'
  })));
  p.bindPopup(`<div class="pop"><b>${il.ad}</b><table>
    <tr><td>Senaryo can kaybı</td><td>${il.can.toLocaleString('tr')}</td></tr>
    <tr><td>Ağır hasarlı bina</td><td>${il.hasar.toLocaleString('tr')}</td></tr>
    <tr><td>Geçici barınma</td><td>${il.barinma.toLocaleString('tr')} kişi</td></tr>
    <tr><td>Açık alan</td><td>${il.m2kisi || '—'} m²/kişi</td></tr>
    <tr><td>Vs30 ortalaması</td><td>${il.vs30} m/s</td></tr>
    <tr><td>En yakın fay</td><td>${il.fay_km} km — ${il.fay_ad}</td></tr>
    <tr><td>Hastane / itfaiye / polis</td><td>${il.hast} / ${il.itfa} / ${il.pol}</td></tr>
    <tr><td>İtfaiye ort. / en kötü</td><td>${il.g_itfa} / ${il.g_itfa_kotu} km</td></tr>
    <tr><td>Açık yeşil alan</td><td>${il.yesil_ha} ha</td></tr>
    </table></div>`);
  p.addTo(ilceKatman);
  ilcePoly.push({ il, p });
});
let ilceOpaklik = 0.5, sonMetrik = 'can';
function boyaIlce(metrik) {
  sonMetrik = metrik;
  const lej = document.getElementById('lej');
  if (metrik === 'yok') {
    ilcePoly.forEach(({p}) => p.setStyle({ fillColor: '#39424f', fillOpacity: 0 }));
    lej.innerHTML = ''; lejmin.textContent = lejmax.textContent = '';
    return;
  }
  const M = METRIK[metrik];
  const vals = ilcePoly.map(({il}) => il[metrik]).filter(v => v > 0);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  ilcePoly.forEach(({il, p}) => {
    const v = il[metrik];
    if (!v) { p.setStyle({ fillColor: '#2a3240', fillOpacity: ilceOpaklik * 0.6 }); return; }
    let t = (v - mn) / (mx - mn || 1);
    if (M.ters) t = 1 - t;
    p.setStyle({ fillColor: skalaRenk(t), fillOpacity: ilceOpaklik });
  });
  lej.innerHTML = Array.from({length: 24}, (_, i) =>
    `<i style="background:${skalaRenk(i/23)}"></i>`).join('');
  lejmin.textContent = (M.ters ? mx : mn).toLocaleString('tr') + ' ' + M.birim;
  lejmax.textContent = (M.ters ? mn : mx).toLocaleString('tr') + ' ' + M.birim;
}

/* ---------- faylar ---------- */
const fayKatman = L.layerGroup().addTo(map);
D.faylar.forEach(f => {
  L.polyline(f.pts, {
    color: '#ff4d4d', weight: Math.max(1.5, (f.onem || 2) / 2), opacity: 0.85
  }).bindPopup(`<div class="pop"><b>${f.ad}</b><table>
      <tr><td>Önem</td><td>${f.onem}</td></tr>
      <tr><td>Kayma oranı</td><td>${f.oran}</td></tr></table></div>`).addTo(fayKatman);
});

/* ---------- depremler ---------- */
const eqKatman = L.layerGroup();
let eqCizili = [];
function eqCiz(minMag) {
  eqKatman.clearLayers(); eqCizili = [];
  D.depremler.forEach(([la, lo, m, tar, der, yer]) => {
    if (m < minMag) return;
    const c = L.circleMarker([la, lo], {
      radius: Math.max(2.5, Math.pow(2, m) / 8),
      color: m >= 6 ? '#ff2d55' : m >= 5 ? '#ff8c42' : '#ffd166',
      weight: 1, fillOpacity: 0.35
    }).bindPopup(`<div class="pop"><b>M${m.toFixed(1)}</b> — ${tar}<table>
        <tr><td>Derinlik</td><td>${der} km</td></tr>
        <tr><td>Yer</td><td>${yer}</td></tr></table></div>`);
    c.addTo(eqKatman); eqCizili.push(c);
  });
  document.getElementById('eqsay').textContent = eqCizili.length + ' deprem';
}

/* ---------- tesisler ---------- */
function tesisKatmani(liste, renk, etiket) {
  const gr = L.layerGroup();
  (liste || []).forEach(([la, lo, ad, kaynak]) => {
    L.circleMarker([la, lo], {
      radius: 4, color: renk, weight: 1.5, fillColor: renk, fillOpacity: 0.75
    }).bindPopup(`<div class="pop"><b>${ad || etiket}</b><br>
        <span style="color:#9aa7b8">${etiket} · kaynak: ${kaynak}</span></div>`).addTo(gr);
  });
  return gr;
}
const katHast = tesisKatmani(D.tesisler.hastane, '#ff5c8a', 'Hastane');
const katItfa = tesisKatmani(D.tesisler.itfaiye, '#ff8c42', 'İtfaiye');
const katPol  = tesisKatmani(D.tesisler.polis, '#4da3ff', 'Polis');
const katTopl = tesisKatmani(D.tesisler.toplanma_alani, '#2ecc71', 'Toplanma alanı');

/* ---------- 1. derece acil ulaşım yolları ---------- */
const katYol = L.layerGroup();
D.yollar.forEach(y => {
  const cizgi = L.polyline(y.pts, {
    color: '#ffe066', weight: 3.5, opacity: 0.9, lineCap: 'round',
  });
  cizgi.bindPopup(`<div class="pop"><b>${y.ad || 'Acil ulaşım yolu'}</b><table>
      <tr><td>Derece</td><td>1. derece</td></tr>
      ${y.ilce ? `<tr><td>Kapsam</td><td>${y.ilce}</td></tr>` : ''}
      </table>
      <div style="margin-top:6px;color:#9aa7b8;font-size:11px">
        Afet sonrası öncelikli açık tutulacak yol ağı — İBB / UKOME
      </div></div>`);
  cizgi.addTo(katYol);
});

const katYesil = L.layerGroup();
D.yesil.forEach(([la, lo, ha, ad, tur]) => {
  L.circleMarker([la, lo], {
    radius: Math.max(3, Math.min(16, Math.sqrt(ha) * 2.2)),
    color: '#7bd389', weight: 1, fillColor: '#7bd389', fillOpacity: 0.3
  }).bindPopup(`<div class="pop"><b>${ad}</b><table>
      <tr><td>Tür</td><td>${tur}</td></tr>
      <tr><td>Alan</td><td>${ha} ha</td></tr></table></div>`).addTo(katYesil);
});

/* ---------- kontroller ---------- */
function bagla(id, katman, ekstra) {
  const el = document.getElementById(id);
  const uygula = () => {
    if (el.checked) map.addLayer(katman); else map.removeLayer(katman);
    if (ekstra) ekstra(el.checked);
  };
  el.addEventListener('change', uygula);
  uygula();
}
bagla('k_vs30', vs30Katman);
bagla('k_fay', fayKatman);
bagla('k_eq', eqKatman, on => {
  document.getElementById('eqgrp').style.display = on ? 'block' : 'none';
  if (on && eqCizili.length === 0) eqCiz(parseFloat(document.getElementById('eqmin').value));
});
bagla('k_hast', katHast);
bagla('k_itfa', katItfa);
bagla('k_pol', katPol);
bagla('k_topl', katTopl);
bagla('k_yesil', katYesil);
bagla('k_yol', katYol);

document.getElementById('zemin').addEventListener('change', e => zeminSec(e.target.value));
document.getElementById('metrik').addEventListener('change', e => boyaIlce(e.target.value));
document.getElementById('eqmin').addEventListener('input', e => {
  document.getElementById('eqlbl').textContent = 'M≥' + parseFloat(e.target.value).toFixed(1);
  eqCiz(parseFloat(e.target.value));
});
document.getElementById('vsop').addEventListener('input', e => {
  vs30Katman.setOpacity(e.target.value / 100);
});
document.getElementById('ilop').addEventListener('input', e => {
  ilceOpaklik = e.target.value / 100;
  boyaIlce(sonMetrik);
});

boyaIlce('can');
document.getElementById('note').innerHTML = D.not;

/* ---------- değerlendirmeden gelen konum ----------
 * index.html "Haritada incele" derken konumu ve skoru URL'e koyar:
 *   harita.html?lat=41.017&lon=28.879&skor=74&seviye=yuksek&ilce=Güngören
 * Parametre yoksa hiçbir şey değişmez.
 */
(function gelenKonum() {
  const p = new URLSearchParams(location.search);
  const lat = parseFloat(p.get('lat')), lon = parseFloat(p.get('lon'));
  if (!isFinite(lat) || !isFinite(lon)) return;

  const SEVIYE_RENK = {
    guvenli: '#2e7d32', az: '#b8860b', yuksek: '#d2691e', kritik: '#c62828',
  };
  const SEVIYE_AD = {
    guvenli: 'GÜVENLİ', az: 'AZ GÜVENLİ', yuksek: 'YÜKSEK RİSK', kritik: 'KRİTİK',
  };
  const seviye = p.get('seviye') || '';
  const renk = SEVIYE_RENK[seviye] || '#111';
  const skor = p.get('skor');
  const ilce = p.get('ilce') || '';

  const halka = L.circleMarker([lat, lon], {
    radius: 16, color: renk, weight: 4, fillColor: renk, fillOpacity: 0.15,
  }).addTo(map);
  L.circleMarker([lat, lon], {
    radius: 6, color: '#fff', weight: 2, fillColor: renk, fillOpacity: 1,
  }).addTo(map);

  halka.bindPopup(`<div class="pop">
      <b>Değerlendirdiğiniz konum</b>
      <table>
        ${ilce ? `<tr><td>İlçe</td><td>${ilce}</td></tr>` : ''}
        ${skor ? `<tr><td>Risk puanı</td><td>${skor} / 100</td></tr>` : ''}
        ${seviye ? `<tr><td>Sonuç</td><td>${SEVIYE_AD[seviye] || seviye}</td></tr>` : ''}
      </table>
      <div style="margin-top:8px"><a href="index.html">← Değerlendirmeye dön</a></div>
    </div>`).openPopup();

  map.setView([lat, lon], 14);

  // konum geldiyse ilgili katmanları aç: kullanıcı çevresini görmek ister
  for (const id of ['k_hast', 'k_itfa', 'k_topl']) {
    const el = document.getElementById(id);
    if (el && !el.checked) { el.checked = true; el.dispatchEvent(new Event('change')); }
  }
  document.getElementById('ilop').value = 25;
  document.getElementById('ilop').dispatchEvent(new Event('input'));
})();
</script>
</body>
</html>
"""


def main():
    veri = {
        "vs30": vs30_gridi(),
        "ilceler": ilce_poligonlari(),
        "faylar": faylar(),
        "depremler": depremler(),
        "tesisler": tesisler(),
        "yesil": yesil(),
        "yollar": acil_yollar(),
        "not": ("Senaryo verisi İBB'nin mahalle bazlı deprem senaryosudur — tahmindir, "
                "kesinlik değil. Mesafeler kuş uçuşudur, trafik hesaba katılmaz. "
                "Toplanma alanları OSM'den; resmi İBB/AFAD listesi açık API'de yok, "
                "eksiktir. Açık/yeşil alan verisi yalnızca İBB'nin yönettiği alanları "
                "kapsar (ilçe parkları, okul bahçeleri hariç)."),
    }
    html = HTML.replace("__VERI__", json.dumps(veri, ensure_ascii=False, separators=(",", ":")))
    hedef = ROOT / "harita.html"
    hedef.write_text(html, encoding="utf-8")

    print(f"harita.html yazıldı — {hedef.stat().st_size / 1024 / 1024:.1f} MB")
    print(f"  Vs30 gridi     : {veri['vs30']['w']}×{veri['vs30']['h']}")
    print(f"  ilçe           : {len(veri['ilceler'])}")
    print(f"  fay            : {len(veri['faylar'])} (İstanbul'a {FAY_YARICAP} km içi)")
    print(f"  deprem         : {len(veri['depremler'])}")
    for k, v in veri["tesisler"].items():
        print(f"  {k:<15}: {len(v)}")
    print(f"  yeşil alan     : {len(veri['yesil'])}")
    print(f"  acil yol       : {len(veri['yollar'])} parça")


if __name__ == "__main__":
    main()
