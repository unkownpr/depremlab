import { continueRender, delayRender, staticFile } from 'remotion';

/* Uygulamanın "sade" temasından alınan palet — video ile ürün aynı görünsün. */
export const RENK = {
  zemin: '#f5f7fa',
  kart: '#ffffff',
  lacivert: '#1a2e4a',
  koyu: '#12223a',
  turuncu: '#e8762c',
  mavi: '#1a4a9a',
  soluk: '#5d6b7f',
  cizgi: '#dfe4ec',
} as const;

export const FONT = 'Open Sans';

/* Ağa çıkmadan render alabilmek için font public/fonts altından yüklenir.
   Variable font: tek dosya 300–800 aralığını taşır. */
let yuklendi = false;

export const fontYukle = () => {
  if (yuklendi || typeof document === 'undefined') return;
  yuklendi = true;

  const bekle = delayRender('Open Sans yükleniyor');
  const stil = document.createElement('style');
  stil.textContent = ['latin', 'latin-ext']
    .map(
      (altKume) => `
@font-face {
  font-family: '${FONT}';
  font-style: normal;
  font-weight: 300 800;
  font-display: block;
  src: url('${staticFile(`fonts/OpenSans-${altKume}.woff2`)}') format('woff2');
}`,
    )
    .join('\n');
  document.head.appendChild(stil);

  document.fonts
    .load(`700 48px '${FONT}'`)
    .then(() => document.fonts.load(`400 48px '${FONT}'`))
    .then(() => continueRender(bekle))
    .catch(() => continueRender(bekle));
};
