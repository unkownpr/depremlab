/* Bu dosya depo köküne göre çalışır:  node tests/shots.js  */
const KOK = require('path').resolve(__dirname, '..');
/* Akışı yürüt ve her ekranı hem masaüstü hem mobil boyutta yakala. */
/* CI'da resmi playwright, yerelde playwright-core yeterli. */
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('playwright-core')); }
const os = require('os'), path = require('path'), fs = require('fs');

const EXE = process.env.CHROMIUM_PATH || undefined;
const URL = 'file://' + KOK + '/index.html';
const OUT = KOK + '/tests/shots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['geolocation'], geolocation: { latitude: 40.9819, longitude: 29.0782 },
  });
  const p = await ctx.newPage();
  const cek = async ad => {
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${OUT}/${ad}.png`, fullPage: true });
    console.log('  ✓', ad);
  };

  await p.goto(URL, { waitUntil: 'networkidle' });
  await cek('01-landing');

  await p.click('#git-gizlilik-yapisal'); await cek('02-gizlilik');
  await p.click('#gizlilik-devam');       await cek('03-adres');

  await p.selectOption('#adres-ilce', 'Kadıköy');
  await p.fill('#adres-mahalle', 'Kozyatağı');
  await p.click('#adres-devam');          await cek('04-bolgesel');

  await p.click('#bolgesel-devam');       await cek('05-soru-1');

  for (let i = 0; i < 7; i++) {
    await p.locator('#soru-govde input[type=radio]').first().check();
    if (i === 0) await cek('06-soru-secili');
    if (await p.locator('#soru-ileri').isEnabled()) await p.click('#soru-ileri');
    await p.waitForTimeout(80);
  }
  await cek('07-gozden-gecir');
  await p.click('#gozden-gecir-onayla');  await cek('08-YAPISAL-RAPOR');

  await p.click('#yapisal-sonuc-devam');  await cek('09-kontrol-1');
  for (let i = 0; i < 10; i++) {
    await p.locator('#kontrol-govde input[type=radio]').nth(i % 4).check();
    if (await p.locator('#kontrol-ileri').isEnabled()) await p.click('#kontrol-ileri');
    await p.waitForTimeout(80);
  }
  await cek('10-EV-RAPORU');

  if (await p.locator('#ev-sonuc-ozet').isVisible()) {
    await p.click('#ev-sonuc-ozet');      await cek('11-OZET');
  }

  // mobil
  await p.setViewportSize({ width: 375, height: 812 });
  await cek('12-mobil-ozet');
  await p.goto(URL, { waitUntil: 'networkidle' });
  await cek('13-mobil-landing');
  await p.click('#git-gizlilik-yapisal');
  await p.click('#gizlilik-devam');
  await p.selectOption('#adres-ilce', 'Kadıköy');
  await p.click('#adres-devam');
  await p.click('#bolgesel-devam');
  await cek('14-mobil-soru');

  await b.close();
  console.log('\nkayıt yeri:', OUT);
})().catch(e => { console.error('ÇÖKTÜ:', e.message); process.exit(1); });
