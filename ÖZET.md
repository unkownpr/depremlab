# İstanbul deprem verisi — bulgu özeti

Bu dosya **ne bulduğumuzu** anlatır. Verinin nereden geldiği ve teknik tuzaklar
için `KAYNAKLAR.md`'ye bakın.

Tarih: 2026-08-15 · Harita: `harita.html` · Yeniden üretim: `scripts/build.py`

---

## Bir bakışta

| | |
|---|---|
| Vs30 zemin hücresi | 27.600 (8.428'i İstanbul sınırı içinde) |
| Deprem kaydı | 2.015 (1905–2025, USGS) |
| Fay segmenti | 926 Türkiye geneli · 77 tanesi İstanbul'un 160 km çevresinde |
| Mahalle senaryosu | 959 mahalle (İBB) |
| Tesis | 991 hastane · 275 itfaiye · 274 polis · 248 toplanma alanı |
| Açık/yeşil alan | 1.371 alan · 5.489 hektar (İBB envanteri) |

---

## 1. Zemin (Vs30)

Vs30, zeminin üst 30 metresindeki ortalama makaslama dalga hızı. **Düşük =
yumuşak zemin = sarsıntı büyümesi.**

İstanbul aralığı **180–900 m/s**, ortalama 522.7, ortanca 600.

**En yumuşak zeminli ilçe merkezleri:**

| İlçe | Vs30 (m/s) |
|---|---|
| Büyükçekmece | 244.7 |
| Sancaktepe | 264.9 |
| Tuzla | 282.8 |
| Pendik | 289.4 |
| Esenler | 310.2 |
| Arnavutköy | 310.5 |
| Yeşilköy | 312.9 |

**En sert:** Çatalca 714.7 · Sarıyer 600.0 · Beykoz 552.3

> **Dikkat:** Ortancanın tam 600 çıkması tesadüf değil — USGS mosaic'inde 600,
> geniş alanlarda topoğrafik eğimden türetilen varsayılan değerdir, saha ölçümü
> değil. Ayrıca hücre boyutu ~926 m; mahalle ölçeğinde bina bazlı yorum için
> fazla kaba.

---

## 2. Faylar

İstanbul'un altında değil, **güneyindeki Marmara denizinde**. Sultanahmet'ten
mesafeler:

| Fay | km | Önem |
|---|---|---|
| Avcılar | 16.7 | 4 |
| Adalar | 16.8 | 6 |
| Çınarcık / İzmit Körfezi | 34.4 | 6 |
| Güney İmralı Havzası, Armutlu | 41.0 | 6 |
| Darıca (1999 İzmit) | 41.6 | 6 |
| Kuzey Anadolu | 57.9 | 6 |

100 km içinde **29 farklı adlandırılmış fay**.

**Faya en yakın ilçeler:** Adalar 8.5 km · Tuzla 9.6 km · Avcılar 10.2 km ·
Beylikdüzü 11.1 km · Bakırköy 11.6 km

---

## 3. Deprem geçmişi (USGS, 1905–2025)

En büyükleri:

| Mag | Tarih | Yer |
|---|---|---|
| M7.6 | 1999-08-17 | Derince (Gölcük depremi) |
| M6.2 | 2025-04-23 | Marmara Ereğlisi 24 km GD |
| M6.1 | 1963-09-18 | Koruköy |
| M5.8 | 1905-10-22 | Marmara Ereğlisi 30 km GD |
| M5.7 | 2019-09-26 | Marmara Ereğlisi 17 km DGD |

Kayıtların on yıllık dağılımı 1990'larda yığılıyor (1.370 kayıt) — bu sismik
aktivite artışı değil, **1999 artçı serisi + ağ kapsamının iyileşmesi**.

> 2.015 kaydın 795'inde magnitude değeri yok (çoğu 1999 artçısı). Kaynakta
> eksik; haritada gösterilemiyorlar.

---

## 4. İBB senaryo sonuçları — en ağır veri

959 mahalle için modellenmiş senaryo deprem sonuçları.

**En yüksek can kaybı beklenen ilçeler:**

| İlçe | Can kaybı | Ağır hasarlı bina | Geçici barınma |
|---|---|---|---|
| Bahçelievler | 1.633 | 2.286 | 61.199 |
| Küçükçekmece | 1.515 | 3.856 | 72.774 |
| Fatih | 1.484 | 5.579 | 46.784 |
| Bağcılar | 1.179 | 2.621 | 59.513 |
| Bakırköy | 1.046 | 2.088 | 28.910 |
| Esenyurt | 1.003 | 2.331 | 67.410 |

Dikkat çeken: **Fatih ağır hasarlı bina sayısında birinci** (5.579) ama can
kaybında üçüncü. Silivri 2.151 ağır hasarlı binaya karşılık 58 can kaybı —
yapı stoğu ile nüfus yoğunluğunun ayrıştığı yer.

---

## 5. Açık alan yetersizliği

Senaryo barınma ihtiyacı başına düşen açık/yeşil alan:

| İlçe | m²/kişi | Barınma ihtiyacı | Yeşil alan |
|---|---|---|---|
| Güngören | **1.1** | 27.478 | 2.9 ha |
| Bahçelievler | **2.8** | 61.199 | 17.2 ha |
| Arnavutköy | 11.1 | 5.815 | 6.5 ha |
| Esenler | 12.6 | 29.747 | 37.5 ha |
| Bağcılar | 12.7 | 59.513 | 75.5 ha |
| Gaziosmanpaşa | 14.6 | 13.963 | 20.4 ha |
| Esenyurt | 17.7 | 67.410 | 119.0 ha |

Karşılaştırma için: afet barınma planlamasında kişi başı 3–4 m² asgari
kabul edilir, insani standartlarda 45 m²/kişi (Sphere) hedeflenir.

> **Bu sayılar alt sınırdır.** İBB yeşil alan envanteri yalnızca kendi
> yönettiği alanları kapsıyor — ilçe belediyesi parkları, okul bahçeleri,
> stadyumlar, üniversite kampüsleri dahil değil. İlçeler arası kıyas için
> anlamlı, mutlak yeterlilik yargısı için değil.

---

## 6. Acil servis erişimi

İlçe alanına yayılmış grid ortalaması (kuş uçuşu km, trafik yok):

| İlçe | İtfaiye ort. | İtfaiye en kötü nokta | Hastane ort. | Toplanma ort. |
|---|---|---|---|---|
| Pendik | 4.79 | **10.97** | 6.07 | 9.93 |
| Çatalca | 4.78 | **17.58** | 11.10 | 22.72 |
| Eyüpsultan | 4.32 | 9.82 | 4.95 | 9.97 |
| Silivri | 4.03 | 8.95 | 6.74 | 9.60 |
| Çekmeköy | 3.88 | 8.11 | 6.85 | 6.72 |
| Tuzla | 3.85 | 10.74 | 4.19 | 7.81 |
| Şile | 3.72 | 8.76 | 9.98 | 27.54 |

Şile'de toplanma alanına ortalama 27.5 km, Çatalca'da 22.7 km — bu iki ilçe
OSM verisinde neredeyse hiç kayıtlı toplanma alanı olmadığı için de böyle
çıkıyor; gerçek durum bilinmiyor (aşağıya bakın).

---

## 7. Kesişim: kötü zemin + yakın fay + yoğun nüfus

Üç faktörün üst üste bindiği ilçeler:

**Bahçelievler** — Vs30 ort. 379, faya 14.4 km, senaryo 1.633 can kaybı,
açık alan 2.8 m²/kişi. Dört göstergede de kötü tarafta.

**Küçükçekmece** — Vs30 ort. 416, faya 11.8 km, 1.515 can kaybı, 72.774 kişilik
barınma ihtiyacı (İstanbul'un en yükseği).

**Güngören** — Vs30 340 (en düşüklerden), 754 can kaybı, açık alan 1.1 m²/kişi
(İstanbul'un en kötüsü).

**Avcılar** — Adı verilen fay ilçenin kendisinden geçiyor (10.2 km), 1999'da
ağır hasar görmüştü, 34.941 kişilik barınma ihtiyacı.

---

## Eksikler ve sonraki adımlar

**Bulunamayan veri:**
- Resmi acil toplanma alanları (İBB portalında yok, AFAD e-Devlet arkasında).
  Elimizdeki 248 OSM noktası gerçeğin çok altında.
- İstanbul jeoloji haritası vektör verisi — site sadece raster tile sunuyor,
  formasyon/litoloji okunamıyor. MTA ayrı kaynak olarak aranmalı.
- AFAD/Kandilli yerel deprem kataloğu (USGS Türkiye'de M2.5 altını kaçırıyor).

**Henüz analize girmeyen elimizdeki veri:**
- 1. derece acil ulaşım yolları (`data/ibb/acil_ulasim.geojson`, 3.6 MB)
- Mahalle senaryosu ilçe düzeyinde toplandı; mahalle koordinatı yok ama
  UAVT koduyla mahalle sınırlarına eşlenebilir.

---

## Bu veriler ne değildir

Genel bilgilendirme ve analiz amaçlıdır. Bina bazlı risk değerlendirmesi,
mühendislik kararı veya resmi afet planlaması yerine geçmez. Vs30 ve senaryo
verileri modellerdir. Karar öncesi ilgili uzmana danışın.
