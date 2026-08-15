/* Bu dosya depo köküne göre çalışır:  node tests/e2e.js  */
const KOK = require('path').resolve(__dirname, '..');
/* Deprem Rehberim — tarayıcıda uçtan uca duman testi. */
/* CI'da resmi playwright, yerelde playwright-core yeterli. */
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('playwright-core')); }
const os = require('os');
const path = require('path');

const EXE = process.env.CHROMIUM_PATH || undefined;
const URL = 'file://' + KOK + '/index.html';

let gecti = 0, kaldi = 0;
const t = (ad, ok, detay) => {
  if (ok) { gecti++; console.log(`  ok   ${ad}`); }
  else { kaldi++; console.log(`  FAIL ${ad}${detay ? ' — ' + detay : ''}`); }
};

(async () => {
  const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 },
    permissions: ['geolocation'], geolocation: { latitude: 40.9819, longitude: 29.0782 } });
  const page = await ctx.newPage();

  const hatalar = [];
  page.on('console', m => { if (m.type() === 'error') hatalar.push(m.text()); });
  page.on('pageerror', e => hatalar.push('PAGEERROR: ' + e.message));

  const istekler = [];
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith('file://') && !u.startsWith('data:')) istekler.push(u);
  });

  await page.goto(URL, { waitUntil: 'networkidle' });

  console.log('\n— Yükleme —');
  t('sayfa JS hatasız yüklendi', hatalar.length === 0, hatalar.slice(0, 3).join(' | '));
  const gorunur = await page.locator('#bolum-giris').isVisible();
  t('landing görünür', gorunur);
  t('H1 doğru', (await page.locator('h1').first().innerText()).includes('Depreme ne kadar hazırsın'));

  console.log('\n— Yapısal akış —');
  await page.click('#git-gizlilik-yapisal');
  t('gizlilik ekranı açıldı', await page.locator('#bolum-gizlilik').isVisible());
  const gizMetin = await page.locator('#bolum-gizlilik').innerText();
  t('gizlilik metni birebir', gizMetin.includes('Bu prototip kayıt gerektirmez'));
  t('onay kutusu yok', (await page.locator('#bolum-gizlilik input[type=checkbox]').count()) === 0);

  await page.click('#gizlilik-devam');
  t('adres ekranı açıldı', await page.locator('#bolum-adres').isVisible());

  // konumdan ilçe bulma (yerel poligon eşleştirmesi, dış servis yok)
  await page.click('#adres-konum');
  await page.waitForFunction(() => {
    const e = document.querySelector('#adres-konum-durum');
    return e && e.dataset.tip === 'tamam';
  }, null, { timeout: 15000 }).catch(() => {});
  const konumDurum = await page.locator('#adres-konum-durum').innerText();
  const secilenIlce = await page.locator('#adres-ilce').inputValue();
  t('konumdan ilçe otomatik bulundu', secilenIlce.length > 0, `durum: "${konumDurum}"`);
  t('  doğru ilçe (Kadıköy)', secilenIlce === 'Kadıköy', secilenIlce);
  // testin kalanı elle seçimi denesin diye sıfırla
  await page.selectOption('#adres-ilce', '');

  // doğrulama hatası: ilçe seçmeden devam
  await page.click('#adres-devam');
  const hataMetni = await page.locator('#adres-hata').innerText().catch(() => '');
  t('§19 adres doğrulama hatası gösteriliyor', hataMetni.trim().length > 0, `"${hataMetni}"`);
  t('  hata sonrası adreste kalıyor', await page.locator('#bolum-adres').isVisible());

  const ilceSayisi = await page.locator('#adres-ilce option').count();
  t('ilçe listesi dolu (39+1)', ilceSayisi >= 39, String(ilceSayisi));

  await page.selectOption('#adres-ilce', { label: 'Kadıköy' }).catch(async () => {
    const v = await page.locator('#adres-ilce option').nth(1).getAttribute('value');
    await page.selectOption('#adres-ilce', v);
  });
  await page.fill('#adres-mahalle', 'Kozyatağı');
  await page.fill('#adres-sokak', '<script>alert(1)</script>');
  await page.fill('#adres-bina', '12');
  await page.click('#adres-devam');
  t('bölgesel ekran açıldı', await page.locator('#bolum-bolgesel').isVisible());

  const bolg = await page.locator('#bolum-bolgesel').innerText();
  t('§9.2 zorunlu uyarı ekranda', bolg.includes('yapısal performansı aynı şey değildir'));
  t('§9.2 sayısal skor yok', !/\b\d{1,3}\s*\/\s*100\b|%\s?\d/.test(bolg), bolg.slice(0, 120));
  const xss = await page.evaluate(() => !!document.querySelector('#bolum-bolgesel script, #bolum-ozet script'));
  t('§C8 XSS kaçışı çalışıyor', !xss);

  await page.click('#bolgesel-devam');
  t('soru ekranı açıldı', await page.locator('#bolum-sorular').isVisible());

  // 7 soruyu yanıtla — hep ilk seçenek
  for (let i = 0; i < 7; i++) {
    const radio = page.locator('#soru-govde input[type=radio]').first();
    await radio.check();
    const ileri = page.locator('#soru-ileri');
    if (await ileri.isVisible()) await ileri.click();
    await page.waitForTimeout(60);
  }
  t('gözden geçirme ekranı açıldı', await page.locator('#bolum-gozden-gecir').isVisible());
  await page.click('#gozden-gecir-onayla');
  t('yapısal sonuç açıldı', await page.locator('#bolum-yapisal-sonuc').isVisible());

  const sonuc = await page.locator('#bolum-yapisal-sonuc').innerText();
  t('§9.5 sınır metni sonuçta', sonuc.includes('güvenli veya güvensiz olduğunu göstermez'));
  t('§10 değerlendirme seçenekleri var', /Riskli yapı tespiti|Deprem performans analizi/i.test(sonuc));
  t('sonuçta 0-100 skor yok', !/\b\d{1,3}\s*\/\s*100\b/.test(sonuc));
  t('yasak dil yok', !/Binanız güvenli|göçme riski|risk altında/i.test(sonuc));


  // konum hata yolları: izin reddi ayrı, güvenli olmayan bağlam ayrı
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } }); // izin YOK
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: 'networkidle' });
  await p2.click('#git-gizlilik-yapisal');
  await p2.click('#gizlilik-devam');
  await p2.click('#adres-konum');
  await p2.waitForTimeout(600);
  const redMetin = await p2.locator('#adres-konum-durum').innerText();
  t('konum reddedilince özel mesaj', redMetin.length > 0 && !/^Konum alınamadı\.$/.test(redMetin.trim()), redMetin.slice(0, 90));
  t('  mesaj ne yapılacağını söylüyor', /listeden seçebilirsiniz|izin verebilir/.test(redMetin));
  t('  akış bloke olmuyor', await p2.locator('#adres-ilce').isEnabled());
  await ctx2.close();

  console.log('\n— 4 senaryo override (§9.4) —');
  for (const [q, bekBaslik] of [
    ['priority', 'Öncelikli uzman değerlendirmesi öneriliyor'],
    ['detailed', 'Daha ayrıntılı değerlendirme faydalı olabilir'],
    ['clear', 'Paylaştığınız bilgilerde belirgin bir uyarı tespit edilmedi'],
    ['insufficient', 'Değerlendirme için bilgi yetersiz'],
  ]) {
    await page.goto(`${URL}?scenario=${q}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const gv = await page.locator('#bolum-yapisal-sonuc').isVisible();
    const txt = gv ? await page.locator('#bolum-yapisal-sonuc').innerText() : '';
    t(`?scenario=${q}`, gv && txt.includes(bekBaslik), gv ? txt.slice(0, 70) : 'sonuç görünmedi');
  }

  console.log('\n— Ev içi kontrol listesi —');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.click('#git-gizlilik-evici');
  await page.click('#gizlilik-devam');
  t('kontrol listesi açıldı', await page.locator('#bolum-kontrol').isVisible());

  for (let i = 0; i < 10; i++) {
    const opts = page.locator('#kontrol-govde input[type=radio]');
    const n = await opts.count();
    // sırayla farklı cevap tipleri kullan: evet/hayir/emin/gecerli_degil
    await opts.nth(i % Math.max(1, n)).check();
    const ileri = page.locator('#kontrol-ileri');
    if (await ileri.isVisible()) await ileri.click();
    else if (await page.locator('#kontrol-bitir').isVisible()) { await page.click('#kontrol-bitir'); break; }
    await page.waitForTimeout(60);
  }
  if (await page.locator('#kontrol-bitir').isVisible()) await page.click('#kontrol-bitir');
  await page.waitForTimeout(150);
  t('ev sonucu açıldı', await page.locator('#bolum-ev-sonuc').isVisible());
  const ev = await page.locator('#bolum-ev-sonuc').innerText();
  t('§13 yüzde açıklaması ekranda', ev.includes('güvenlik skoru değildir'));
  t('§13 "Eviniz artık güvenli" yok', !/Eviniz artık güvenli/i.test(ev));

  console.log('\n— Birleşik özet + sıfırlama —');
  if (await page.locator('#ev-sonuc-ozet').isVisible()) {
    await page.click('#ev-sonuc-ozet');
    await page.waitForTimeout(120);
    t('§14 özet tek modülle çalışıyor', await page.locator('#bolum-ozet').isVisible());
    const oz = await page.locator('#bolum-ozet').innerText();
    t('§14 destek cümlesi var', oz.includes('küçük küçük tamamlamak'));
  }

  await page.click('#sifirla');
  await page.waitForTimeout(100);
  const diyalogAcik = await page.evaluate(() => {
    const d = document.querySelector('#sifirla-diyalog');
    return !!(d && d.open);
  });
  t('§C7 sıfırlama <dialog> açıldı', diyalogAcik);
  if (diyalogAcik) {
    await page.click('#sifirla-onayla');
    await page.waitForTimeout(150);
    t('sıfırlama sonrası landing', await page.locator('#bolum-giris').isVisible());
  }

  console.log('\n— Gizlilik / ağ —');
  const depolama = await page.evaluate(() => ({
    ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie.length,
  }));
  t('§22.5 localStorage boş', depolama.ls === 0, String(depolama.ls));
  t('§22.5 sessionStorage boş', depolama.ss === 0, String(depolama.ss));
  t('§22.5 cookie yok', depolama.ck === 0, String(depolama.ck));
  const disIstek = istekler.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u));
  t('§22.4 font dışında dış istek yok', disIstek.length === 0, disIstek.slice(0, 3).join(' '));

  console.log('\n— Responsive —');
  for (const w of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(120);
    const tasma = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    t(`§18 ${w}px yatay kaydırma yok`, !tasma);
  }

  console.log('\n— Erişilebilirlik —');
  await page.setViewportSize({ width: 1440, height: 900 });
  const a11y = await page.evaluate(() => {
    const kucuk = [...document.querySelectorAll('button, a.dugme, input[type=radio], select')]
      .filter(e => e.offsetParent !== null)
      .filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.height < 44; }).length;
    const etiketsiz = [...document.querySelectorAll('input:not([type=radio]):not([type=hidden]), select, textarea')]
      .filter(e => !e.labels?.length && !e.getAttribute('aria-label')).length;
    const h1 = document.querySelectorAll('h1').length;
    return { kucuk, etiketsiz, h1 };
  });
  t('§18 44px altı dokunma hedefi yok', a11y.kucuk === 0, `${a11y.kucuk} adet`);
  t('§18 etiketsiz form alanı yok', a11y.etiketsiz === 0, `${a11y.etiketsiz} adet`);
  t('tek h1', a11y.h1 === 1, String(a11y.h1));

  t('tüm akış boyunca JS hatası yok', hatalar.length === 0, hatalar.slice(0, 3).join(' | '));

  await browser.close();
  console.log(`\n${'='.repeat(46)}`);
  console.log(`GEÇTİ: ${gecti}   KALDI: ${kaldi}`);
  process.exit(kaldi ? 1 : 0);
})().catch(e => { console.error('ÇÖKTÜ:', e.message); process.exit(2); });
