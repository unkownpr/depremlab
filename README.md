# Bina Güvenliği (depremlab)

İstanbul için deprem hazırlığı değerlendirme aracı. İki bağımsız modül ve
bunları birleştiren bir hazırlık planı sunar:

1. **Yapısal Ön Değerlendirme** — binanız hakkında bildiklerinizi gözden
   geçirir ve profesyonel değerlendirmeye ne kadar öncelik verilmesi
   gerektiğini gösterir.
2. **Yapısal Olmayan Risk Kontrolü** — ev içinde devrilebilecek, düşebilecek
   veya çıkışı engelleyebilecek riskleri 10 soruluk bir kontrol listesiyle
   tarar.

Kullanıcı iki modülden hangisiyle isterse başlayabilir. Biri tamamlanmadan
diğerine geçmek engellenmez, özet ekranı tek modülle de çalışır.

## Bu uygulama ne yapmaz

- Resmî bina risk tespiti veya riskli yapı tespiti **yapmaz**.
- Deprem performans analizi **yapmaz**.
- Göçme olasılığı veya sayısal güvenlik skoru **üretmez**.
- Gerçek zemin etüdü **değildir**.
- Hukuki veya mühendislik danışmanlığı **değildir**.
- Binanın güvenli olduğuna dair hiçbir güvence **vermez**.

## Gizlilik

- **Kayıt yok.** Üyelik, giriş, e-posta, telefon, parola, TC kimlik numarası
  veya profil istenmez. Ürünün hiçbir yerinde hesapla ilgili bir çağrı yoktur.
- **Sunucu yok.** Girilen hiçbir bilgi bir sunucuya gönderilmez. Uygulama
  statik dosyalardan ibarettir; arka uç, veritabanı ve API çağrısı yoktur.
- **Analitik yok.** İzleme pikseli, çerez veya analitik betiği kullanılmaz.
- **Kalıcı depolama yok.** `localStorage`, `sessionStorage`, `IndexedDB` ve
  çerez kullanılmaz. Bütün durum yalnızca bellekte tutulur.
- **Sayfayı yenilediğinizde veya kapattığınızda girilen bilgiler silinir.**
- Adres alanları yalnızca ilçe ölçekli bölgesel bilgiyi göstermek için
  kullanılır ve tarayıcıdan çıkmaz.

Tek dış istek Google Fonts'a yapılan yazı tipi isteğidir. Kullanıcı verisi
taşımaz. Tamamen çevrimdışı çalıştırmak isterseniz `scripts/build_app.py`
içindeki `ISKELET` sabitinden font `<link>` etiketlerini çıkarın.

Servis çalışanı (`sw.js`) yalnızca uygulama dosyalarını çevrimdışı kullanım
için önbelleğe alır; kullanıcı yanıtlarını saklamaz.

## Bölgesel veri ile yapısal sonuç arasındaki ayrım

Bu iki şey kasıtlı olarak birbirinden ayrılmıştır:

**Bölgesel bilgiler gerçektir.** İlçe ölçeğinde İBB + Kandilli deprem
senaryosu, USGS Vs30 zemin ızgarası ve Türkiye diri fay verisinden gelir.
Kaynakları `KAYNAKLAR.md` içinde listelidir. Ekranda niteliksel olarak
sunulur ve **yapısal sonucu etkilemez**. Bir bölgenin deprem tehlikesi ile
bir binanın yapısal performansı aynı şey değildir.

**Yapısal sonuç bir prototiptir.** `deriveDemoStructuralPriority()` yalnızca
bir arayüz yönlendirme mantığıdır — mühendislik modeli değildir, sayısal
değer üretmez ve bölgesel veriyi girdi olarak almaz. Üretimde doğrulanmış
bir değerlendirme servisiyle değiştirilmek üzere izole tutulmuştur.

Önceki sürümdeki 0–100 risk skoru, `SEVIYELER` bantları ve puan tabanlı
zemin/fay/kat ağırlıklandırması kaldırılmıştır.

## Çalıştırma

Sunucu gerekmez. `index.html` çift tıkla açılır.

```bash
python3 -m http.server 8000    # istenirse
```

Servis çalışanı yalnızca `https` veya `localhost` üzerinde etkinleşir;
`file://` ile açıldığında sessizce atlanır.

## Derleme

Kaynaklar `scripts/` altındadır, `build_app.py` hepsini tek bir `index.html`
dosyasına gömer.

```bash
python3 scripts/build.py        # ham veri -> derived/*.csv   (yalnızca veri değişince)
python3 scripts/app_data.py     # derived/*.csv -> scripts/_app_data.json
python3 scripts/build_app.py    # -> index.html
python3 scripts/build_map.py    # -> harita.html  (ayrı sayfa)
python3 scripts/build_pwa.py    # -> manifest + sw.js + ikonlar
```

Gömme sırası: `app_style.css` → `app_body.html` → `_app_data.json` (global
`D`) → `risk_engine.js` → `nonstructural.js` → `app_main.js`. Modül sistemi
yoktur; her betik bir öncekinin global tanımlarını görür.

`risk_engine.js` ve `nonstructural.js` dosyalarının sonundaki
`module.exports` bloğu Node ile test edebilmek içindir; `build_app.py`
tarayıcı çıktısından bu bloğu siler.

## Kaynak dosyalar

| Dosya | Sorumluluk |
|---|---|
| `scripts/app_body.html` | Bütün ekranların işaretlemesi. 11 bölüm, biri görünür. |
| `scripts/app_style.css` | Stiller. |
| `scripts/risk_engine.js` | Coğrafi yardımcılar, 7 yapısal soru, sonuç türetme, bölgesel bağlam, birleşik özet. |
| `scripts/nonstructural.js` | 10 maddelik ev içi kontrol listesi ve görev/yüzde yardımcıları. Tek doğruluk kaynağı. |
| `scripts/app_main.js` | Akış kontrolü, durum, çizim. |
| `scripts/build_app.py` | Tek dosyaya paketleme. |

Ev içi kontrol listesi yalnızca `nonstructural.js` içinde tanımlıdır ve
kentsel dönüşüm süreç verisinden türetilmez.

## Yapısal sonuç durumlarını açma

Dört durum sorgu parametresiyle doğrudan açılabilir:

```
index.html?scenario=priority        Öncelikli uzman değerlendirmesi öneriliyor
index.html?scenario=detailed        Daha ayrıntılı değerlendirme faydalı olabilir
index.html?scenario=clear           Belirgin bir uyarı tespit edilmedi
index.html?scenario=insufficient    Değerlendirme için bilgi yetersiz
```

Senaryo modunda ekranın sağ üstünde bir etiket görünür. Sonuç, üretimdeki
mantığın aynısıyla temsili bir yanıt kümesinden türetilir.

## harita.html

Katmanlı keşif haritası ayrı bir sayfadır ve bu değerlendirme akışının
parçası değildir. Genel bilgi amaçlıdır. Kendi Leaflet bağımlılığını
kullanır; değerlendirme sihirbazı harita veya konum servisi kullanmaz.

## Doğrulama

İki takım vardır ve ikisi de bu depoda değil, geliştirme sırasında
üretilmiştir:

- Kabul kriterleri (brief §22) için Node tabanlı statik denetim — 64 kontrol.
- Headless Chromium ile uçtan uca akış denetimi — 45 kontrol; 375, 768, 1024
  ve 1440 piksel genişliklerinde yatay kaydırma, dokunma hedefi boyutu, form
  etiketleri, depolama kullanımı ve dış istekler dahil.

Son çalıştırmada ikisi de tam geçti.

## Üretim öncesi değiştirilmesi gerekenler

- `deriveDemoStructuralPriority()` doğrulanmış bir değerlendirme servisiyle
  değiştirilmelidir. Bugünkü hâli üretim güvenlik algoritması değildir.
- Kontrol listesi metinleri ve öncelikler bir uzman tarafından gözden
  geçirilmelidir.
- Bölgesel veri ilçe ölçeğindedir. Mahalle ölçeği için `derived/`
  içindeki mahalle senaryosu veri paketine eklenmelidir.
- Toplanma alanı listesi eksiktir; resmî AFAD verisi açık değildir.

Bu uygulama üretime hazır değildir ve gerçek bir yapısal değerlendirme
yapmaz.
