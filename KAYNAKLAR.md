# depremlab — veri kaynakları

İstanbul deprem risk verisi. Her kaynağın nereden geldiği, nasıl çekildiği ve
nelere dikkat edilmesi gerektiği aşağıda.

Son güncelleme: 2026-08-15

---

## 1. Vs30 (zemin makaslama dalga hızı)

**Site:** https://mapelse.github.io/global_vs30/
**Asıl kaynak:** USGS Global Vs30 Mosaic — https://earthquake.usgs.gov/data/vs30/

Sitenin backend'i yok. Tek veri kaynağı CloudFront'ta duran **4.0 GB
Cloud-Optimized GeoTIFF**; tarayıcı HTTP Range (206) isteğiyle sadece gereken
parçayı okuyor.

```
https://d1f1pd1jtui8d5.cloudfront.net/global_vs30_Cnv_Cnv.tif
  ?Expires=...&Signature=...&Key-Pair-Id=...
```

- Raster: 43201 × 16801, EPSG:4326, piksel 0.008333° (~926 m)
- Kapsam: -180..180 boylam, -56..84 enlem
- İmzalı URL **~3 günde** geçersiz oluyor (`Expires` epoch). Tazelemek için
  sayfayı Playwright'la açıp `window.url_to_geotiff_file` okumak gerekiyor.

**Nasıl çektik:** Playwright ile sayfayı açtık, sayfanın kendi `window.georaster`
nesnesinden İstanbul penceresini tek `getValues()` çağrısıyla aldık (~1 sn).

> **Tuzak:** `georaster.getValues()` **piksel** koordinatı ister, coğrafi değil.
> Coğrafi verirseniz sessizce yanlış bölgeyi okur (bizde Arktik'i okudu, her
> hücre 600 çıktı). Dönüşüm:
> `col = (lon - xmin) / pixelWidth`, `row = (ymax - lat) / pixelHeight`

**Doğrulama:** 40 ilçe noktasında grid değerleri `geoblaze.identify()` ile
karşılaştırıldı → 0 sapma.

> **Yorum uyarısı:** İstanbul hücrelerinin ortancası tam 600 m/s. USGS
> mosaic'inde 600, geniş alanlarda topografik eğimden türetilen **varsayılan**
> değer — saha ölçümü değil. Nokta bazlı yorumda dikkat. 926 m hücre boyutu
> mahalle ölçeği için kabadır.

**Dosya:** `data/vs30/istanbul_vs30.csv` — 27.600 satır (lat, lon, vs30)

---

## 2. Depremler

**Site:** https://mapelse.github.io/latest_earthquakes/
**Asıl kaynak:** USGS FDSN Event Web Service — gerçek, açık, anahtarsız API.

Site tarayıcıdan doğrudan USGS'e gidiyor. Aracıya gerek yok:

```
https://earthquake.usgs.gov/fdsnws/event/1/query
  ?format=geojson
  &starttime=1900-01-01&endtime=2026-08-15
  &minlatitude=40.60&maxlatitude=41.75
  &minlongitude=27.80&maxlongitude=30.00
  &orderby=time&limit=20000
```

> **Tuzak:** `starttime` verilmezse varsayılan **son 30 gün**. İstanbul bbox'ında
> son 30 günde USGS eşiğine giren deprem olmadığı için ilk sorgu 0 kayıt döndü.

**Kapsam uyarısı:** USGS Türkiye'de küçük depremleri eksik kaydeder (genelde
M2.5 altı yok). Tam yerel katalog için AFAD veya Kandilli (KOERI) gerekir —
onları henüz eklemedik.

**Dosya:** `data/earthquakes/ist_eq_all.geojson`, `derived/depremler.csv`
2015 kayıt, 1905–2025. En büyüğü M7.6 (17 Ağustos 1999, Derince).

---

## 3. Fay hatları

**Site:** https://mapelse.github.io/fayHatlari/
**Dosya (doğrudan indirilebilir):**
https://mapelse.github.io/fayHatlari/assets/js/tr_faults_imp.geojson

Statik GeoJSON, 926 LineString, 693 KB. Öznitelikler: `FAULT_NAME`,
`ZONE_NAME`, `RATE` (kayma oranı), `CONF` (güven), `importance`, `AUTH`
(kaynak yayın), `PARM`, `SENS1/2` (fay mekanizması), `UPSIDE`, `TEXT`.

Aynı sayfa ayrıca M6+ depremleri USGS FDSN'den 1500'den itibaren çekiyor.

**İstanbul'a en yakın faylar** (Sultanahmet'ten):
Avcılar 16.7 km · Adalar 16.8 km · Çınarcık/İzmit Körfezi 34.4 km ·
Kuzey Anadolu 57.9 km. 100 km içinde 29 farklı adlandırılmış fay.

**Dosya:** `data/faults/tr_faults_imp.geojson`

---

## 4. Jeoloji haritası — ⚠️ veri çekilemiyor

**Site:** https://mapelse.github.io/istanbulJeoloji/

Harita **raster tile pyramid**: `tiles/{z}/{x}/{y}.png`, zoom **8–14**
(z14'te ~7 m/piksel). Vektör poligon, GeoJSON veya öznitelik verisi **yok**.

Yani formasyon adı, yaş, litoloji gibi bilgiler makine tarafından okunamıyor —
sadece piksel rengi okunup lejantla eşleştirilebilir. Lejant görselleri:
`assets/js/images/lejant2.jpg`, `lejant3.jpg`.

Gerçek jeoloji vektör verisi isteniyorsa MTA (Maden Tetkik ve Arama)
1:100.000 jeoloji haritaları ayrı kaynak olarak aranmalı.

---

## 5. İBB Açık Veri Portalı

**Portal:** https://data.ibb.gov.tr — CKAN API (557 dataset)

```
https://data.ibb.gov.tr/api/3/action/package_list
https://data.ibb.gov.tr/api/3/action/package_show?id=<dataset-adi>
```

### 5a. Deprem senaryosu analiz sonuçları ⭐ en değerli veri

959 mahalle için senaryo deprem sonuçları: can kaybı, ağır/orta/hafif hasarlı
bina, yaralı, altyapı (doğalgaz/içme suyu/atık su) hasarı, **geçici barınma
ihtiyacı**.

> **Tuzak:** Dosya **cp1254 (Windows-1254)** kodlu ve **`;`** ayraçlı. UTF-8
> okumaya çalışırsanız `UnicodeDecodeError` alırsınız.

Dosya: `data/ibb/deprem_senaryosu.csv` → normalize: `derived/mahalle_senaryo.csv`

### 5b. İtfaiye istasyonları (resmi, 2025)

136 istasyon, ilçe + adres + koordinat.
> **Tuzak:** Kolon adları yanıltıcı — `Koordinat(Y)` = **boylam**,
> `Koordinat(X)` = **enlem**.

Dosya: `data/ibb/itfaiye_2025.xlsx`

### 5c. Sağlık kurum ve kuruluşları (resmi)

20.469 kayıt — ama çoğu eczane, medikal satış, diş polikliniği. Alt kategoride
"Hastane" geçenleri filtreledik → 991 hastane.

Dosya: `data/ibb/saglik_tesisleri.xlsx`

### 5d. Kentsel açık ve yeşil alanlar

1371 poligon (Polygon + MultiPolygon), toplam **5.489 hektar**. İlçe ve tür
(Park vb.) bilgisi var. Resmi toplanma alanı verisi bulunamadığı için
**toplanma alanı proxy'si** olarak kullanıldı.

> **Kapsam uyarısı:** Bu, İBB'nin kendi yönettiği alanların envanteri
> (YAYSİS). İlçe belediyelerinin parkları, okul bahçeleri, stadyumlar,
> üniversite kampüsleri ve boş araziler **dahil değil**. Dolayısıyla
> `barinma_basina_m2` kolonu gerçek açık alan kapasitesinin **alt sınırıdır** —
> ilçeler arası karşılaştırma için anlamlı, mutlak yeterlilik yargısı için
> değil.

Dosya: `data/ibb/yesil_alanlar.geojson` → `derived/yesil_alanlar.csv`

### 5e. 1. derece acil ulaşım yolları

Afet sonrası öncelikli açık tutulacak yol ağı — UKOME kararıyla belirlenmiş.
621 kayıt (220 LineString + 401 MultiLineString), 68.927 vertex. Öznitelikler:
`YOL_ISMI`, `ILCE_ADI`, `YAKA`, `UZUNLUK`, `UKOME_GIRIS`.

MultiLineString'ler tek tek parçalanıp Douglas-Peucker ile (tolerans ~40 m)
basitleştirildi → **3.175 çizgi parçası**. Hem haritada katman olarak var, hem
wizard'da "en yakın acil ulaşım yolu" mesafesi olarak hesaplanıyor.

Dosya: `data/ibb/acil_ulasim.geojson`

---

## 6. OpenStreetMap (Overpass API)

Hastane, itfaiye, polis ve toplanma alanı noktaları + ilçe sınırları.

```
[out:json][timeout:180];
(
  nwr["amenity"="hospital"](40.75,27.90,41.75,29.95);
  nwr["amenity"="fire_station"](40.75,27.90,41.75,29.95);
  nwr["amenity"="police"](40.75,27.90,41.75,29.95);
  nwr["emergency"="assembly_point"](40.75,27.90,41.75,29.95);
);
out center tags;
```

İlçe sınırları ayrı sorgu (`admin_level=6`, relation, `out geom`) → 39 ilçe.

**Sonuç:** 463 hastane, 274 polis, 139 itfaiye, 245 toplanma alanı.

> **Kapsam uyarısı:** OSM'deki 248 toplanma alanı gerçeği yansıtmıyor —
> İstanbul'un resmi acil toplanma alanı sayısı binlerle ifade edilir. Aşağıya
> bakın.

---

## 7. ⚠️ Bulunamayan: resmi acil toplanma alanları

Aranan ama **açık API'si bulunamayan** veri:

- İBB açık veri portalında "toplanma" araması → 0 sonuç (557 dataset tarandı)
- `sehirharitasi.ibb.gov.tr` bir SPA, açık ArcGIS REST ucu yok
- AFAD'ın toplanma alanı sorgulaması e-Devlet üzerinden, girişli

Şu an elimizdeki en iyi vekiller:
1. OSM `emergency=assembly_point` — 248 nokta, eksik ama gerçek etiket
2. İBB kentsel açık/yeşil alanlar — 1371 alan, 5.489 ha, resmi ama toplanma
   alanı olarak onaylı değil

---

## Uygulama dosyaları

| Dosya | Ne yapar |
|---|---|
| `index.html` | Değerlendirme uygulaması (wizard). Tek dosya, veri gömülü, sunucu gerekmez. |
| `harita.html` | Katmanlı keşif haritası. `?lat=..&lon=..&skor=..&seviye=..&ilce=..` parametrelerini okur. |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA — telefona kurulabilir, çevrimdışı açılır. |
| `tokens.css` | Tasarım sistemi tokenları (63 adet), taşınabilir. |

**Üretim zinciri** (sırayla):

```bash
python3 scripts/build.py       # ham veri -> derived/*.csv     (~12 sn)
python3 scripts/app_data.py    # -> scripts/_app_data.json     (293 KB)
python3 scripts/build_app.py   # -> index.html                 (0.34 MB)
python3 scripts/build_map.py   # -> harita.html                (0.5 MB)
python3 scripts/build_pwa.py   # -> manifest + sw.js + icons
```

`scripts/risk_engine.js` saf fonksiyonlardan oluşur ve Node ile ayrıca test
edilebilir — `build_app.py` onu `index.html` içine gömer.

### Risk puanı nasıl hesaplanıyor?

Yapısal skor 0–100 (yüksek = kötü), dört kalemin toplamı:

| Kalem | Azami | Mantık |
|---|---|---|
| Zemin (Vs30) | 30 | 760 m/s kaya referansı; yumuşadıkça puan artar |
| Faya uzaklık | 20 | 45 km'de sıfıra yaklaşır |
| Yapım dönemi | 30 | Yönetmelik kuşağı: 1975 öncesi 30 → 2018 sonrası 3 |
| Kat sayısı | 20 | 10 puan yükseklik + 10 puan zemin-bina rezonansı |

Rezonans yaklaşımı: zemin periyodu `Ts ≈ 120 / Vs30`, bina periyodu
`Tb ≈ 0.1 × kat`. İkisi yakınsa bina zeminle aynı ritimde salınır, puan artar.
Bu yüzden **yumuşak zeminde alçak bina, sert zeminde yüksek bina** daha çok
zorlanabilir — sonuç bazen sezgiye ters gelir, fizik böyle.

Eşikler: 0–25 güvenli · 26–50 az güvenli · 51–75 yüksek risk · 76–100 kritik.

Ev içi skoru ayrı: yedi maddenin ağırlıklı toplamı (dolap 20, kaçış 15,
çanta 15, buluşma 15, yatak 15, cam 10, vana 10).

### Eylem planı nasıl üretiliyor?

Skor tek başına bir şey yaptırmaz; `eylemPlani()` sonucu **dört zaman
kutusuna** çevirir: bugün (para gerekmez) · bu hafta (küçük harcama) ·
bu ay (binanın kendisi) · bu yıl (kalıcı hazırlık).

Maddeler koşullu — kullanıcının kendi verisine göre girer ya da girmez:

| Koşul | Ne değişir |
|---|---|
| Toplanma alanı > 1.5 km | "liste eksik, kendi noktanızı seçin" metnine döner |
| Acil ulaşım yolu ≤ 1 km | Yol adıyla birlikte "tahliye yolunuz" maddesi eklenir |
| Zemin puanı ≥ 20 | Mobilya sabitleme maddesine yumuşak zemin gerekçesi eklenir |
| 1998 öncesi kuşak | Riskli yapı tespiti maddesi **vurgulu** olarak en öne çıkar |
| Yapım yılı bilinmiyor | Özet cümle "önce yapım yılını öğrenin"e döner, madde vurgulanır |
| Rezonans yakınlığı > 0.7 | Mühendise sorulacak somut soru maddesi eklenir |
| Faya uzaklık puanı ≥ 14 | "Yakın fay ne demek, ne demek değil" açıklaması eklenir |
| İlçe m²/kişi < 15 | İlçenin açık alan darlığı ve şehir dışı planı maddesi eklenir |

Ayrıca tek cümlelik bir özet üretilir — kullanıcı yalnızca onu okusa ne
okumalı sorusunun cevabı.

> Bu formül bir mühendislik hesabı değil, kaba bir göstergedir. Taşıyıcı
> sistem, malzeme kalitesi, zemin etüdü ve tadilat geçmişi hesapta yok —
> gerçekte belirleyici olan çoğu zaman bunlardır.

---

## Türetilen dosyalar (`derived/`)

| Dosya | İçerik |
|---|---|
| `istanbul_ilce_ozet.csv` | 39 ilçe × 22 kolon — ana özet tablo |
| `mahalle_senaryo.csv` | 959 mahalle, İBB senaryo sonuçları (UTF-8'e çevrilmiş) |
| `tesisler.csv` | 1788 tesis (OSM + İBB birleşik, ilçeye atanmış) |
| `yesil_alanlar.csv` | 1371 açık/yeşil alan, alan hesabı (ha) ile |
| `grid_erisim.csv` | 27.600 hücre × en yakın hastane/itfaiye/polis/toplanma mesafesi |
| `depremler.csv` | 2015 deprem, 1905–2025 |
| `istanbul_ilce_risk.csv` | ilk basit tablo (Vs30 + fay mesafesi) |

Hepsini yeniden üretmek: `python3 scripts/build.py` (~12 sn)

**Bağımlılıklar:** Python 3, `openpyxl`, `numpy`

---

## Metodoloji notları

- **Mesafeler** yerel düzlem projeksiyonuyla hesaplandı (İstanbul ölçeğinde
  hatası ihmal edilebilir). Kuş uçuşu — yol mesafesi değil, gerçek ulaşım
  süresi trafikte belirgin şekilde daha kötü olur.
- **İlçe ataması** nokta-poligon testiyle yapıldı. 219 tesis atanamadı; bunlar
  Overpass bbox'ının İstanbul dışına (Çerkezköy, Kocaeli) taşan kısmında.
- **Grid erişim analizi** 27.600 Vs30 hücresinin 8.428'i İstanbul sınırı içinde.
  Her hücre için en yakın tesise mesafe hesaplandı.
- **`barinma_basina_m2`** = ilçedeki açık/yeşil alan (m²) ÷ senaryo geçici
  barınma ihtiyacı (kişi). Kaba bir yeterlilik göstergesi; alanların gerçekten
  barınmaya uygun olup olmadığı denetlenmedi.

## Bu veriler ne değildir

Genel bilgilendirme ve analiz amaçlıdır. Bina bazlı risk değerlendirmesi,
mühendislik kararı veya resmi afet planlaması yerine geçmez. Vs30 ve senaryo
verileri modellerdir, ölçüm değil. Karar öncesi ilgili uzmana danışın.
