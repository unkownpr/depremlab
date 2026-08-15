/* Bu dosya depo köküne göre çalışır:  node tests/verify.js  */
const KOK = require('path').resolve(__dirname, '..');
/* Deprem Rehberim — kabul kriteri doğrulaması (brief §22).
 * Çalıştırma: node verify.js   (repo kökünden)
 */
const E = require(KOK + '/scripts/risk_engine.js');
const N = require(KOK + '/scripts/nonstructural.js');
const fs = require('fs');
const R = KOK + '/';

let gecti = 0, kaldi = 0;
const t = (ad, kosul, detay) => {
  if (kosul) { gecti++; console.log(`  ok   ${ad}`); }
  else { kaldi++; console.log(`  FAIL ${ad}${detay ? ' — ' + detay : ''}`); }
};
const oku = f => fs.readFileSync(R + f, 'utf8');
const kaynaklar = ['scripts/risk_engine.js', 'scripts/nonstructural.js',
  'scripts/app_main.js', 'scripts/app_body.html', 'scripts/app_style.css'];
const hepsi = kaynaklar.map(oku).join('\n');
const html = oku('index.html');

/* ---- gövdedeki sayısal alan avcısı ---- */
function sayiVarMi(o, yol = '') {
  if (o === null || o === undefined) return null;
  if (typeof o === 'number') return yol;
  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i++) { const h = sayiVarMi(o[i], `${yol}[${i}]`); if (h) return h; }
    return null;
  }
  if (typeof o === 'object') {
    for (const k of Object.keys(o)) { const h = sayiVarMi(o[k], `${yol}.${k}`); if (h) return h; }
    return null;
  }
  return null;
}

console.log('\n— Yapısal sonuç modeli —');

const senaryolar = {
  priority_review: { donem: 'once1999', kat: 'k5_8', mudahale: 'evet', gorunur: 'yok', hasar: 'hayir', ilave: 'hayir', onceki: 'evet' },
  detailed_review: { donem: 'once1999', kat: 'k5_8', mudahale: 'hayir', gorunur: 'yok', hasar: 'hayir', ilave: 'hayir', onceki: 'evet' },
  no_prominent_warning: { donem: 'sonra2019', kat: 'k1_4', mudahale: 'hayir', gorunur: 'yok', hasar: 'hayir', ilave: 'hayir', onceki: 'evet' },
  insufficient_information: { donem: 'bilmiyorum', kat: 'bilmiyorum', mudahale: 'bilmiyorum', gorunur: 'emin_degilim', hasar: 'bilmiyorum', ilave: 'bilmiyorum', onceki: 'bilmiyorum' },
};
const basliklar = {
  priority_review: 'Öncelikli uzman değerlendirmesi öneriliyor',
  detailed_review: 'Daha ayrıntılı değerlendirme faydalı olabilir',
  no_prominent_warning: 'Paylaştığınız bilgilerde belirgin bir uyarı tespit edilmedi',
  insufficient_information: 'Değerlendirme için bilgi yetersiz',
};

for (const [bek, cev] of Object.entries(senaryolar)) {
  const r = E.deriveDemoStructuralPriority(cev);
  t(`§22.15 durum ulaşılabilir: ${bek}`, r.priority === bek, `geldi: ${r.priority}`);
  t(`  başlık birebir: ${bek}`, r.title === basliklar[bek], `geldi: "${r.title}"`);
  const s = sayiVarMi(r);
  t(`§22.12 sayısal alan yok: ${bek}`, s === null, `sayı bulundu: ${s}`);
  t(`  isDemo işaretli: ${bek}`, r.isDemo === true);
}

/* güçlü uyarıların her biri tek başına priority_review vermeli */
const temiz = { donem: 'sonra2019', kat: 'k1_4', mudahale: 'hayir', gorunur: 'yok', hasar: 'hayir', ilave: 'hayir', onceki: 'evet' };
for (const [alan, deger] of [['mudahale', 'evet'], ['gorunur', 'catlak'], ['gorunur', 'demir'], ['gorunur', 'egilme'], ['hasar', 'orta_agir']]) {
  const r = E.deriveDemoStructuralPriority({ ...temiz, [alan]: deger });
  t(`§9.4 güçlü uyarı ${alan}=${deger} → priority_review`, r.priority === 'priority_review', `geldi: ${r.priority}`);
}

/* §22.14 bilinmeyen yanıtlar yetersiz bilgi üretebilmeli */
const cokBilmiyorum = { ...temiz, mudahale: 'bilmiyorum', gorunur: 'emin_degilim', hasar: 'bilmiyorum', ilave: 'bilmiyorum' };
t('§22.14 3+ bilmiyorum → insufficient_information',
  E.deriveDemoStructuralPriority(cokBilmiyorum).priority === 'insufficient_information');

/* §22.11 bölgesel veri sonucu etkilemez */
const kaynak = E.deriveDemoStructuralPriority.toString();
t('§22.11 türetme fonksiyonu bölgesel veriye dokunmuyor',
  !/vs30|fay_km|bolgesel|ilce|D\./i.test(kaynak));
t('§22.9 adres hash yok', !/charCodeAt|hashCode|adresHash|estimateZemin/i.test(hepsi));

console.log('\n— Kontrol listesi —');
t('§22.16 tam 10 madde', N.EV_ICI_KONTROL.length === 10, `geldi: ${N.EV_ICI_KONTROL.length}`);
t('  order 1..10 eksiksiz',
  JSON.stringify(N.EV_ICI_KONTROL.map(m => m.order).sort((a, b) => a - b)) === JSON.stringify([1,2,3,4,5,6,7,8,9,10]));
const kritik = N.EV_ICI_KONTROL.filter(m => m.priority === 'critical').map(m => m.id).sort();
t('  critical = kombi + cikis', JSON.stringify(kritik) === JSON.stringify(['cikis','kombi']), kritik.join(','));
const uzman = N.EV_ICI_KONTROL.filter(m => m.professionalSupport).map(m => m.id).sort();
t('  professionalSupport = avize + kombi', JSON.stringify(uzman) === JSON.stringify(['avize','kombi']), uzman.join(','));
t('§22.17 processData türevi değil', !/processData|prepChecklist|stage.?s0/i.test(hepsi));
t('§11 "en yaygın ölüm nedeni" iddiası yok',
  !/en\s+(yaygın|sık|çok)\s+.{0,30}(ölüm|yaralanma)\s+nedeni/i.test(hepsi));

/* görev üretimi */
const hepsiEvet = {}, hepsiHayir = {}, hepsiEmin = {}, hepsiGecersiz = {};
N.EV_ICI_KONTROL.forEach(m => {
  hepsiEvet[m.id] = 'evet'; hepsiHayir[m.id] = 'hayir';
  hepsiEmin[m.id] = 'emin_degilim'; hepsiGecersiz[m.id] = 'gecerli_degil';
});
t('§22.18 "hayır" → düzeltme görevi',
  N.gorevUret(hepsiHayir).length === 10 && N.gorevUret(hepsiHayir).every(g => g.tur === 'duzeltme'));
t('§22.19 "emin değilim" → doğrulama görevi',
  N.gorevUret(hepsiEmin).length === 10 && N.gorevUret(hepsiEmin).every(g => g.tur === 'dogrulama'));
t('§22.20 "geçerli değil" → görev yok', N.gorevUret(hepsiGecersiz).length === 0);
t('§12 "evet" → görev yok', N.gorevUret(hepsiEvet).length === 0);

/* sıralama */
const sirali = N.gorevUret(hepsiHayir);
const rank = { critical: 0, high: 1, medium: 2 };
let sirasiDogru = true;
for (let i = 1; i < sirali.length; i++) {
  const a = sirali[i - 1], b = sirali[i];
  if (rank[a.priority] > rank[b.priority]) sirasiDogru = false;
  if (rank[a.priority] === rank[b.priority]) {
    const ma = N.EV_ICI_KONTROL.find(m => m.id === a.maddeId);
    const mb = N.EV_ICI_KONTROL.find(m => m.id === b.maddeId);
    if (ma && mb && ma.order > mb.order) sirasiDogru = false;
  }
}
t('§22.21 görevler critical→high→medium→order sıralı', sirasiDogru,
  sirali.map(g => g.priority[0] + (N.EV_ICI_KONTROL.find(m => m.id === g.maddeId) || {}).order).join(' '));

/* yüzde */
t('§13 yüzde sıfıra bölünmüyor', N.tamamlanmaYuzdesi(hepsiGecersiz, []) === 0,
  String(N.tamamlanmaYuzdesi(hepsiGecersiz, [])));
t('§13 hepsi evet → %100', N.tamamlanmaYuzdesi(hepsiEvet, []) === 100,
  String(N.tamamlanmaYuzdesi(hepsiEvet, [])));
t('§13 hepsi hayır, hiç tamamlanmadı → %0', N.tamamlanmaYuzdesi(hepsiHayir, []) === 0);
t('§22.23 görev tamamlama sayacı ilerletir',
  N.tamamlananOnlemSayisi(hepsiHayir, [N.EV_ICI_KONTROL[0].id]) === 1,
  String(N.tamamlananOnlemSayisi(hepsiHayir, [N.EV_ICI_KONTROL[0].id])));
t('§22.22 yüzde açıklaması "güvenlik skoru değildir" diyor',
  /güvenlik skoru değildir/i.test(N.YUZDE_ACIKLAMASI));
t('§13 ilkUcGorev en fazla 3', N.ilkUcGorev(sirali, []).length === 3);

console.log('\n— Birleşik özet (§22.24) —');
const yapSonuc = E.deriveDemoStructuralPriority(senaryolar.detailed_review);
const evDurum = { cevaplar: hepsiHayir, tamamlananIdler: ['mobilya'], gorevler: sirali };
for (const [ad, y, e] of [
  ['iki modül de tam', yapSonuc, evDurum],
  ['sadece yapısal', yapSonuc, { cevaplar: {}, tamamlananIdler: [], gorevler: [] }],
  ['sadece ev içi', null, evDurum],
  ['ikisi de boş', null, { cevaplar: {}, tamamlananIdler: [], gorevler: [] }],
]) {
  let ok = false, hata = '';
  try { const o = E.birlesikOzet(y, e); ok = !!(o && o.binan && o.evin && o.ilkOnceligin); }
  catch (err) { hata = err.message; }
  t(`  özet bloke olmuyor: ${ad}`, ok, hata);
}

console.log('\n— Gizlilik / kayıt (§22.2–8) —');
t('§22.5 depolama API kullanımı yok',
  !/localStorage|sessionStorage|indexedDB|document\.cookie/.test(hepsi));
t('§22.3 kayıt/giriş alanı yok',
  !/type=["']password|signup|signin|<input[^>]+type=["']email|name=["']telefon/i.test(hepsi));
t('§3.1 hesap CTA metni yok',
  !/(kayıt ol|giriş yap|üye ol|hesap oluştur|şifremi unuttum)/i.test(hepsi));
t('§3.3 KVKK onay dili yok',
  !/(KVKK imzala|kişisel verilerimin işlenmesini kabul)/i.test(hepsi));
/* Harita SDK'sı ve dış tile servisi yasak (brief §3.2/§9.2).
 * navigator.geolocation kullanıcı kararıyla bilinçli olarak korunuyor:
 * opt-in düğmeye bağlı ve koordinat yerel poligonlarla ilçeye çevriliyor,
 * dışarıya coğrafi kodlama isteği gitmiyor. */
t('§3.2 wizard\'da harita SDK yok',
  !/L\.map\(|L\.tileLayer|leaflet/i.test(oku('scripts/app_main.js')));
t('§3.2 dış coğrafi kodlama servisi yok',
  !/nominatim|geocod|maps\.google|mapbox|arcgisonline|basemaps\./i.test(hepsi));
t('konum yalnızca opt-in düğmeyle isteniyor',
  /#adres-konum'\)\.addEventListener/.test(oku('scripts/app_main.js')));
t('§19 window.alert/confirm/prompt yok',
  !/window\.alert|(?<![.\w])alert\(|(?<![.\w])confirm\(|(?<![.\w])prompt\(/.test(oku('scripts/app_main.js')));

console.log('\n— Yasak dil (§9.5, §13) —');
const yasak = [
  [/[Bb]inanız güvenli(?!liği)/, 'Binanız güvenli'],
  [/göçme riski/i, 'göçme riski'],
  [/[Bb]inanız risk altında/, 'Binanız risk altında'],
  [/güvenli görünüyor/i, 'güvenli görünüyor'],
  [/[Ee]viniz artık güvenli/, 'Eviniz artık güvenli'],
];
for (const [re, ad] of yasak) t(`  "${ad}" geçmiyor`, !re.test(hepsi));
t('§9.5 zorunlu sınır metni mevcut', /güvenli veya güvensiz olduğunu göstermez/.test(hepsi));
t('§9.2 zorunlu bölgesel uyarı mevcut',
  /yapısal performansı aynı şey değildir/.test(hepsi));

console.log('\n— UX revizyonu (v2) —');
const N2 = require(KOK + '/scripts/nonstructural.js');
const css = oku('scripts/app_style.css');
const body = oku('scripts/app_body.html');
const main = oku('scripts/app_main.js');
const buildpy = oku('scripts/build_app.py');

/* R10 — isim tutarlılığı */
t('V1 arayüzde "depremlab" geçmiyor',
  !/depremlab/i.test(body), (body.match(/depremlab/i) || [])[0] || '');
t('V1 arayüzde "Bina Güvenliği" geçmiyor',
  !/Bina Güvenliği/.test(body), (body.match(/.{0,30}Bina Güvenliği.{0,20}/) || [])[0] || '');
t('V1 sekme başlığı Deprem Rehberim', /<title>Deprem Rehberim/.test(buildpy));
t('V1 marka üst barda Deprem Rehberim', /marka[^>]*>\s*Deprem Rehberim/.test(body));
t('V1 PWA adı Deprem Rehberim',
  /"short_name": "Deprem Rehberim"/.test(oku('scripts/build_pwa.py')));

/* V2 — deck paleti varsayılan temada */
for (const [ad, hex] of [['zemin','#f5f7fa'], ['lacivert','#1a2e4a'],
                         ['turuncu','#e8762c'], ['mavi','#1a4a9a']]) {
  t(`V2 deck rengi ${ad} (${hex})`, new RegExp(hex, 'i').test(css));
}
t('V2 Monzo teması korundu', /\[data-tema=["']canli["']\]/.test(css) && /#ff4f40/i.test(css));

/* V3 — bilgi tarzı bileşenleri */
for (const c of ['goz-ustu', 'baslik-cizgi', 'rozet-no', 'pill', 'panel-koyu', 'alinti-kutu']) {
  t(`V3 .${c} CSS'te tanımlı`, new RegExp('\\.' + c + '\\b').test(css));
}
t('V3 JS bilgi tarzı sınıflarını kullanıyor',
  /goz-ustu|panel-koyu|alinti-kutu/.test(main));

/* Ton — emoji/alarm görseli olmamalı (brief §17) */
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
t('§17 JS\'te emoji simge yok', !emoji.test(main),
  (main.match(emoji) || [])[0] || '');
t('§17 markup\'ta emoji yok', !emoji.test(body),
  (body.match(emoji) || [])[0] || '');

/* R7 — tipografi */
t('R7 Instrument Serif kaldırıldı',
  !/Instrument\s*Serif/i.test(css) && !/Instrument\+Serif/i.test(buildpy));
t('R7 Open Sans yükleniyor', /Open\+Sans/.test(buildpy));
t('R7 başlıklarda Open Sans', /Open Sans/i.test(css));
t('R7 gövdede Arial', /Arial/i.test(css));

/* R8 — iki tema */
t('R8 sade teması tanımlı', /\[data-tema=["']sade["']\]/.test(css));
t('R8 canli teması tanımlı', /\[data-tema=["']canli["']\]/.test(css));
t('R8 mercan vurgu mevcut', /#ff4f40/i.test(css));
t('R8 tema düğmesi bağlı', /#tema-degistir['"]\)\??\.addEventListener/.test(main));
t('R8 tema hiçbir yere kaydedilmiyor',
  !/localStorage|sessionStorage/.test(main));

/* R6 — print */
t('R6 print stylesheet var', /@media\s+print/.test(css));
t('R6 yalnızca rapor basılıyor', /\.rapor:not\(\[hidden\]\)/.test(css));
t('R6 PDF düğmeleri window.print çağırıyor',
  /rapor-yazdir-yapisal/.test(main) && /rapor-yazdir-ev/.test(main) && /window\.print\(\)/.test(main));

/* R1 — tek ekran */
t('R1 bolumGoster hero ve veriyi gizliyor',
  /#hero|'hero'/.test(main) && /'veri'|#veri/.test(main));

/* R3 — yan yana kısa şıklar */
t('R3 kısa şık ızgarası CSS\'te', /\[data-kisa=["']1["']\]/.test(css));
t('R3 JS data-kisa koyuyor', /data-kisa|dataset\.kisa/.test(main));

/* R4 — rapora yeniden erişim */
t('R4 özetten bina raporu', /ozet-yapisal-rapor/.test(main) && /ozet-yapisal-rapor/.test(body));
t('R4 özetten ev raporu', /ozet-ev-rapor/.test(main) && /ozet-ev-rapor/.test(body));

/* R5 — kaynak bölümü */
t('R5 bina raporu kaynak montajı', /rapor-neye-dayaniyorsa-yapisal/.test(main));
t('R5 ev raporu kaynak montajı', /rapor-neye-dayaniyorsa-ev/.test(main));

/* Bölgesel veri dürüstlüğü — gerçek veriye "demo" denmemeli */
const bg = E.bolgeselBaglam(
  { ilceler: [{ ad: 'Şişli', vs30: 520, fay_km: 22.4, fay_ad: 'Kuzey Marmara',
                m2kisi: 12.5, yesil_ha: 40 }] }, 'Şişli');
t('bölgesel kaynak "demo" demiyor', !/demo/i.test(bg.kaynak), bg.kaynak.slice(0, 60));
t('bölgesel veri tarihi uydurma değil', !/2024–2026/.test(bg.veriTarihi));
t('bölgesel maddede ölçülen değer var', bg.nitelikselBaglam.every(n => !!n.deger));
t('açık alan sayısı yorumlanmış',
  /dar görünüyor|geniş görünüyor/.test(bg.nitelikselBaglam[2].metin));
t('açık alan alt sınır olduğu yazılı', /alt sınır/.test(bg.nitelikselBaglam[2].metin));

/* Kentsel dönüşüm */
t('kentsel dönüşüm bloğu motorda', !!E.KENTSEL_DONUSUM);
t('  5 adım var', E.KENTSEL_DONUSUM.adimlar.length === 5);
t('  tek malik başlatabilir bilgisi',
  /çoğunluğunun onayı\s+aranmaz|maliklerden birinin/.test(
    E.KENTSEL_DONUSUM.adimlar.map(a => a.metin).join(' ')));
t('  hukuki danışmanlık değildir uyarısı', /hukuki danışmanlık değildir/.test(E.KENTSEL_DONUSUM.uyari));
t('  raporda çiziliyor', /KENTSEL_DONUSUM/.test(main));
t('  emredici dil yok',
  !/(kentsel dönüşüme girin|binayı yıkın|güçlendirme yapın)/i.test(hepsi));

console.log('\n— Build çıktısı —');
t('index.html üretilmiş ve dolu', html.length > 500000, `${(html.length/1024).toFixed(0)} KB`);
t('§22.5 çıktıda depolama API yok',
  !/localStorage|sessionStorage|document\.cookie/.test(html));
t('çıktıda module.exports sızıntısı yok', !/module\.exports/.test(html));
t('çıktıda Leaflet CDN yok (wizard)', !/unpkg\.com\/leaflet/.test(html));
t('§22.28 Türkçe diakritik korunmuş', /değerlendirme/.test(html) && /İstanbul|ilçe/.test(html));
t('D veri paketi gömülü', /const D = \{/.test(html));

const manifest = JSON.parse(oku('manifest.webmanifest'));
t('manifest açıklaması eski cümle kalıntısı taşımıyor',
  !manifest.description.includes('.bilgisiyle'), manifest.description);

console.log(`\n${'='.repeat(46)}`);
console.log(`GEÇTİ: ${gecti}   KALDI: ${kaldi}`);
process.exit(kaldi ? 1 : 0);
