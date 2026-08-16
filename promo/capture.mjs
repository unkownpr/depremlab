/* Tanıtım kareleri. Akışı yürütür, her durakta viewport boyunda kare alır.
   Çıktı: promo/public/shots/*.png   —  node promo/capture.mjs           */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.resolve(BURASI, '..');
const CIKTI = path.join(BURASI, 'public', 'shots');
fs.mkdirSync(CIKTI, { recursive: true });

const MASAUSTU = { width: 1440, height: 900 };
const MOBIL = { width: 390, height: 844 };

const tarayici = await chromium.launch();

/* Sayfayı akışın istenen adımına kadar yürütür. */
async function akis(p, adim) {
  await p.goto('file://' + KOK + '/index.html', { waitUntil: 'networkidle' });
  if (adim === 'landing') return;

  await p.click('#git-gizlilik-yapisal');
  await p.click('#gizlilik-devam');
  if (adim === 'adres') return;

  await p.selectOption('#adres-ilce', 'Kadıköy');
  await p.fill('#adres-mahalle', 'Kozyatağı');
  await p.click('#adres-devam');
  if (adim === 'bolgesel') return;

  await p.click('#bolgesel-devam');
  if (adim === 'soru') return;

  for (let i = 0; i < 7; i++) {
    await p.locator('#soru-govde input[type=radio]').first().check();
    if (await p.locator('#soru-ileri').isEnabled()) await p.click('#soru-ileri');
    await p.waitForTimeout(80);
  }
  await p.click('#gozden-gecir-onayla');
  if (adim === 'bina-raporu') return;

  await p.click('#yapisal-sonuc-devam');
  for (let i = 0; i < 10; i++) {
    await p.locator('#kontrol-govde input[type=radio]').nth(i % 4).check();
    if (await p.locator('#kontrol-ileri').isEnabled()) await p.click('#kontrol-ileri');
    await p.waitForTimeout(80);
  }
  if (adim === 'ev-raporu') return;

  await p.click('#ev-sonuc-ozet');
}

async function kare(ad, adim, viewport, kaydir = 0) {
  const ctx = await tarayici.newContext({
    viewport,
    deviceScaleFactor: 2,
    permissions: ['geolocation'],
    geolocation: { latitude: 40.9819, longitude: 29.0782 },
  });
  const p = await ctx.newPage();
  await akis(p, adim);
  if (kaydir) await p.evaluate(y => window.scrollTo(0, y), kaydir);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(CIKTI, ad + '.png') });
  console.log('  ✓', ad);
  await ctx.close();
}

await kare('01-hero', 'landing', MASAUSTU);
await kare('02-moduller', 'landing', MASAUSTU, 620);
await kare('03-kaynaklar', 'landing', MASAUSTU, 1560);
await kare('04-bolgesel', 'bolgesel', MASAUSTU);
await kare('05-bina-raporu', 'bina-raporu', MASAUSTU);
await kare('06-bina-surec', 'bina-raporu', MASAUSTU, 1900);
await kare('07-ev-raporu', 'ev-raporu', MASAUSTU);
await kare('08-plan', 'plan', MASAUSTU);
await kare('09-mobil-hero', 'landing', MOBIL);
await kare('10-mobil-rapor', 'bina-raporu', MOBIL);

await tarayici.close();
console.log('\nkayıt yeri:', CIKTI);
