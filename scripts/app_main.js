/* depremlab — wizard akışı.
 * risk_engine.js'in fonksiyonlarını kullanır; D global veri paketidir.
 */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const durum = { yol: null, konum: null, analiz: null };

/* ------------------------------------------------------ parallax hero */
(function parallaxKur() {
  const P = D.parallax;
  const yaz = (id, liste) => {
    const g = document.getElementById(id);
    if (!g) return;
    g.innerHTML = liste.map(d => `<path d="${d}"/>`).join('');
  };
  yaz('fay-arka', P.katmanlar.arka);
  yaz('fay-orta', P.katmanlar.orta);
  yaz('fay-on', P.katmanlar.on);

  const azMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const katlar = $$('.hero-kat');
  let bekliyor = false;
  function kaydir() {
    const y = window.scrollY;
    for (const k of katlar) {
      k.style.transform = `translate3d(0, ${y * parseFloat(k.dataset.hiz)}px, 0)`;
    }
    bekliyor = false;
  }
  function dinle() {
    if (azMotion.matches) {
      katlar.forEach(k => (k.style.transform = ''));
      return;
    }
    if (!bekliyor) { bekliyor = true; requestAnimationFrame(kaydir); }
  }
  addEventListener('scroll', dinle, { passive: true });
  azMotion.addEventListener('change', dinle);
  dinle();
})();

/* ------------------------------------------------------------ gezinme */
function bolumGoster(id) {
  for (const b of ['bolum-konum', 'bolum-bina', 'bolum-evici', 'bolum-sonuc']) {
    const el = document.getElementById(b);
    if (el) el.hidden = b !== id;
  }
  const hedef = document.getElementById(id);
  if (!hedef) return;
  hedef.classList.remove('adim');
  void hedef.offsetWidth;
  hedef.classList.add('adim');
  hedef.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto' : 'smooth', block: 'start' });
  const bas = hedef.querySelector('h2');
  if (bas) { bas.setAttribute('tabindex', '-1'); bas.focus({ preventScroll: true }); }
}

$('#kutu-yapisal').addEventListener('click', () => {
  durum.yol = 'yapisal';
  $('#kutu-yapisal').setAttribute('aria-pressed', 'true');
  $('#kutu-evici').setAttribute('aria-pressed', 'false');
  bolumGoster('bolum-konum');
});
$('#kutu-evici').addEventListener('click', () => {
  durum.yol = 'evici';
  $('#kutu-evici').setAttribute('aria-pressed', 'true');
  $('#kutu-yapisal').setAttribute('aria-pressed', 'false');
  eviciKur();
  bolumGoster('bolum-evici');
});
$$('[data-geri]').forEach(b => b.addEventListener('click', () => {
  const h = b.dataset.geri;
  if (h === 'basla') {
    ['bolum-konum', 'bolum-bina', 'bolum-evici', 'bolum-sonuc']
      .forEach(id => { const e = document.getElementById(id); if (e) e.hidden = true; });
    $('#basla').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else bolumGoster(h);
}));
$('#btn-bastan').addEventListener('click', () => {
  durum.yol = null; durum.konum = null; durum.analiz = null;
  $('#kutu-yapisal').setAttribute('aria-pressed', 'false');
  $('#kutu-evici').setAttribute('aria-pressed', 'false');
  ['bolum-konum', 'bolum-bina', 'bolum-evici', 'bolum-sonuc']
    .forEach(id => { document.getElementById(id).hidden = true; });
  $('#basla').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* -------------------------------------------------------------- konum */
const IST = { guney: 40.75, kuzey: 41.70, bati: 27.85, dogu: 29.95 };
const icerideMi = (lat, lon) =>
  lat >= IST.guney && lat <= IST.kuzey && lon >= IST.bati && lon <= IST.dogu;

function konumDurum(metin, tip) {
  const kutu = $('#konum-durum');
  kutu.dataset.tip = tip || '';
  kutu.querySelector('.sim').textContent =
    tip === 'tamam' ? '✓' : tip === 'hata' ? '!' : '·';
  $('#konum-metin').textContent = metin;
}

function konumAyarla(lat, lon, kaynak) {
  if (!icerideMi(lat, lon)) {
    konumDurum('Bu konum İstanbul sınırlarının dışında görünüyor. '
      + 'Haritadan İstanbul içinde bir nokta seçebilirsiniz.', 'hata');
    $('#btn-konum-devam').disabled = true;
    haritaAc();
    return;
  }
  durum.konum = { lat, lon };
  durum.analiz = konumAnalizi(D, lat, lon);
  const ilce = durum.analiz.ilce ? durum.analiz.ilce.ad : 'İstanbul';
  konumDurum(`${ilce} — konum alındı (${kaynak}).`, 'tamam');
  $('#btn-konum-devam').disabled = false;
  if (haritaNesnesi) {
    haritaNesnesi.setView([lat, lon], 14);
    if (isaret) isaret.setLatLng([lat, lon]);
    else isaret = L.marker([lat, lon]).addTo(haritaNesnesi);
  }
}

$('#btn-konum').addEventListener('click', e => {
  const b = e.currentTarget;
  if (!navigator.geolocation) {
    konumDurum('Tarayıcınız konum desteklemiyor. Haritadan seçin.', 'hata');
    haritaAc();
    return;
  }
  b.dataset.durum = 'yukleniyor';
  b.textContent = 'Konum aranıyor…';
  konumDurum('Konumunuz aranıyor. Tarayıcı izin isterse "İzin ver" deyin.', '');
  navigator.geolocation.getCurrentPosition(
    p => {
      b.dataset.durum = ''; b.textContent = 'Konumumu bul';
      konumAyarla(p.coords.latitude, p.coords.longitude, 'tarayıcı');
    },
    () => {
      b.dataset.durum = ''; b.textContent = 'Konumumu bul';
      konumDurum('Konum alınamadı. Haritadan kendiniz seçebilirsiniz.', 'hata');
      haritaAc();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

let haritaNesnesi = null, isaret = null;
function haritaAc() {
  $('#secim-harita').hidden = false;
  $('#harita-yardim').hidden = false;
  if (haritaNesnesi) { haritaNesnesi.invalidateSize(); return; }
  haritaNesnesi = L.map('secim-harita', {
    center: [41.02, 28.95], zoom: 10, minZoom: 10,
    maxBounds: L.latLngBounds([[IST.guney, IST.bati], [IST.kuzey, IST.dogu]]),
    maxBoundsViscosity: 1.0,
  });
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Esri, Maxar', maxZoom: 18 }).addTo(haritaNesnesi);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    { maxZoom: 18 }).addTo(haritaNesnesi);
  haritaNesnesi.on('click', ev => konumAyarla(ev.latlng.lat, ev.latlng.lng, 'harita'));
  setTimeout(() => haritaNesnesi.invalidateSize(), 60);
}
$('#btn-harita-sec').addEventListener('click', haritaAc);
$('#btn-konum-devam').addEventListener('click', () => bolumGoster('bolum-bina'));

/* --------------------------------------------------------------- bina */
$('#donem-secenekler').innerHTML = YONETMELIK.map((y, i) => `
  <label class="secenek">
    <input type="radio" name="donem" value="${y.deger}"${i === 2 ? ' checked' : ''}>
    <span class="metin"><span>${y.ad}</span><small>${y.not}</small></span>
  </label>`).join('');

$('#btn-hesapla').addEventListener('click', () => {
  if (!durum.analiz) { bolumGoster('bolum-konum'); return; }
  const donem = ($('input[name="donem"]:checked') || {}).value || 'bilmiyorum';
  const kat = Math.max(1, Math.min(60, parseInt($('#kat').value, 10) || 5));
  const girdi = { donem, kat };
  const skor = yapisalSkor(durum.analiz, girdi);
  sonucYapisal(skor, durum.analiz, girdi);
  bolumGoster('bolum-sonuc');
  sonucHaritaKur(durum.analiz);
  haritaBaglantisi(skor, durum.analiz);
});

/* ------------------------------------------------------------- ev içi */
function eviciKur() {
  if ($('#evici-sorular').dataset.hazir) return;
  $('#evici-sorular').innerHTML = EV_ICI.map(m => `
    <fieldset class="alan">
      <legend>${m.soru}</legend>
      <div class="secenekler">
        <label class="secenek">
          <input type="radio" name="ev-${m.id}" value="evet">
          <span class="metin"><span>Evet</span></span>
        </label>
        <label class="secenek">
          <input type="radio" name="ev-${m.id}" value="hayir" checked>
          <span class="metin"><span>Hayır${m.ters ? '' : ' / emin değilim'}</span></span>
        </label>
      </div>
    </fieldset>`).join('');
  $('#evici-sorular').dataset.hazir = '1';
}

$('#btn-evici-hesapla').addEventListener('click', () => {
  const cevaplar = {};
  for (const m of EV_ICI) {
    const s = $(`input[name="ev-${m.id}"]:checked`);
    cevaplar[m.id] = s ? s.value === 'evet' : false;
  }
  sonucEvici(yapisalOlmayanSkor(cevaplar));
  bolumGoster('bolum-sonuc');
});

/* Sonuç ekranındaki "Haritada incele" bağlantısına konumu ve skoru iliştirir;
 * harita.html bu parametreleri okuyup o noktaya gider. */
function haritaBaglantisi(skor, a) {
  const bag = $('#bolum-sonuc a[href^="harita.html"]');
  if (!bag) return;
  const p = new URLSearchParams({
    lat: a.lat.toFixed(5), lon: a.lon.toFixed(5),
    skor: String(skor.toplam), seviye: skor.seviye.kisa,
  });
  if (a.ilce) p.set('ilce', a.ilce.ad);
  bag.href = 'harita.html?' + p.toString();
}

/* -------------------------------------------------------------- sonuç */
function olcekHtml(aktif) {
  return `<div class="olcek" role="list" aria-label="Risk ölçeği">
    ${SEVIYELER.map(s => `
      <div class="olcek-satir" role="listitem"
           ${s.kisa === aktif ? 'aria-current="true"' : ''}>
        <span class="sim" aria-hidden="true">${s.simge}</span>
        <span>${s.ad}</span>
        <span>${s.kisa === aktif ? 'sizin sonucunuz' : ''}</span>
      </div>`).join('')}
  </div>`;
}

function basHtml(skor, baslik) {
  const s = skor.seviye;
  return `<div class="sonuc-bas" data-seviye="${s.kisa}">
    <span class="rozet"><span aria-hidden="true">${s.simge}</span> ${baslik}</span>
    <h3>${s.ad}</h3>
    <p class="ozet">${s.ozet}</p>
    ${olcekHtml(s.kisa)}
  </div>`;
}

/* Sonuç ekranındaki mini harita: konum + en yakın dört tesis.
 * Her çağrıda yeniden kurulur (konum değişmiş olabilir). */
let sonucHarita = null;
/* Renkler tokenlardan okunur — Leaflet'e ham değer geçmiyoruz. */
const jeton = ad => getComputedStyle(document.documentElement)
  .getPropertyValue(ad).trim();
const TESIS_RENK = {
  hastane: jeton('--color-hastane'),
  itfaiye: jeton('--color-itfaiye'),
  polis: jeton('--color-polis'),
  toplanma: jeton('--color-toplanma'),
};
function sonucHaritaKur(a) {
  const kutu = document.getElementById('sonuc-harita');
  if (!kutu) return;
  if (sonucHarita) { sonucHarita.remove(); sonucHarita = null; }

  sonucHarita = L.map('sonuc-harita', { scrollWheelZoom: false });
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Esri, Maxar', maxZoom: 18 }).addTo(sonucHarita);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    { maxZoom: 18 }).addTo(sonucHarita);

  const noktalar = [[a.lat, a.lon]];

  L.circleMarker([a.lat, a.lon], {
    radius: 11, color: jeton('--color-konum'), weight: 3,
    fillColor: jeton('--color-konum-ic'), fillOpacity: 1,
  }).addTo(sonucHarita).bindTooltip('Sizin konumunuz', {
    permanent: true, direction: 'top', className: 'pin-etiket', offset: [0, -10],
  });

  for (const [tip, etiket] of [['hastane', 'Hastane'], ['itfaiye', 'İtfaiye'],
                               ['polis', 'Polis'], ['toplanma', 'Toplanma alanı']]) {
    const t = a[tip];
    if (!t) continue;
    const nokta = (D.tesisler[tip === 'toplanma' ? 'toplanma_alani' : tip] || [])
      .find(x => x[2] === t.ad && Math.abs(mesafeKm(a.lat, a.lon, x[0], x[1]) - t.km) < 0.01);
    if (!nokta) continue;
    noktalar.push([nokta[0], nokta[1]]);
    L.circleMarker([nokta[0], nokta[1]], {
      radius: 8, color: TESIS_RENK[tip], weight: 3,
      fillColor: TESIS_RENK[tip], fillOpacity: 0.85,
    }).addTo(sonucHarita)
      .bindPopup(`<b>${etiket}</b><br>${t.ad || '—'}<br>${t.km.toFixed(2)} km`);
    L.polyline([[a.lat, a.lon], [nokta[0], nokta[1]]], {
      color: TESIS_RENK[tip], weight: 2, opacity: 0.6, dashArray: '5,6',
    }).addTo(sonucHarita);
  }

  sonucHarita.fitBounds(L.latLngBounds(noktalar).pad(0.35));
  setTimeout(() => sonucHarita.invalidateSize(), 60);
}

function sonucYapisal(skor, a, girdi) {
  const mesafe = (etiket, t, aciklama) => t ? `
    <div class="mesafe">
      <span><b>${etiket}</b><small>${t.ad || aciklama}</small></span>
      <span class="km">${t.km < 1 ? Math.round(t.km * 1000) + ' m' : t.km.toFixed(1) + ' km'}</span>
    </div>` : '';

  $('#sonuc-govde').innerHTML = `
    ${basHtml(skor, 'BİNA DEĞERLENDİRMESİ')}

    <div class="kalemler">
      ${skor.kalemler.map(k => `
        <div class="kalem">
          <div class="ust">
            <span class="ad">${k.ad}</span>
            <span class="deger">${k.deger}</span>
          </div>
          <div class="cubuk" role="img"
               aria-label="${k.ad}: ${k.azami} üzerinden ${k.puan} risk puanı">
            <i style="width:${Math.round(k.puan / k.azami * 100)}%"></i>
          </div>
          <p class="not">${k.not}</p>
        </div>`).join('')}
    </div>

    <h3 style="margin-top:var(--space-2xl);font-size:var(--text-2xl)">Yakınınızda ne var?</h3>

    <div class="mini-harita-kutu">
      <div id="sonuc-harita" role="img"
           aria-label="Konumunuz ve en yakın hastane, itfaiye, polis ve toplanma alanını gösteren harita. Aynı bilgiler aşağıda liste olarak da var."></div>
      <div class="harita-anahtar">
        <span><i class="k-konum"></i> Sizin konumunuz</span>
        <span><i class="k-hastane"></i> Hastane</span>
        <span><i class="k-itfaiye"></i> İtfaiye</span>
        <span><i class="k-polis"></i> Polis</span>
        <span><i class="k-toplanma"></i> Toplanma alanı</span>
      </div>
    </div>

    <div class="mesafeler">
      ${mesafe('En yakın hastane', a.hastane)}
      ${mesafe('En yakın itfaiye', a.itfaiye)}
      ${mesafe('En yakın polis', a.polis)}
      ${mesafe('En yakın toplanma alanı', a.toplanma, 'OpenStreetMap kaydı')}
    </div>
    <p class="not" style="margin-top:var(--space-sm);color:var(--color-ink-3);font-size:var(--text-sm)">
      Mesafeler kuş uçuşudur, yol mesafesi değildir. Toplanma alanı listesi
      eksiktir — resmi liste açık veride yayımlanmıyor.
    </p>

    ${a.ilce ? `
      <h3 style="margin-top:var(--space-2xl);font-size:var(--text-2xl)">${a.ilce.ad} geneli</h3>
      <div class="mesafeler">
        <div class="mesafe"><span><b>Senaryo can kaybı</b><small>İBB mahalle senaryosu toplamı</small></span>
          <span class="km">${(a.ilce.can || 0).toLocaleString('tr')}</span></div>
        <div class="mesafe"><span><b>Geçici barınma ihtiyacı</b><small>senaryo sonrası</small></span>
          <span class="km">${(a.ilce.barinma || 0).toLocaleString('tr')}</span></div>
        <div class="mesafe"><span><b>Kişi başına açık alan</b><small>İBB yeşil alan envanteri — alt sınır</small></span>
          <span class="km">${a.ilce.m2kisi || '—'} m²</span></div>
      </div>` : ''}

    ${planHtml(eylemPlani(skor, a, girdi))}

    <div class="yapilacaklar">
      <div class="yapilacak">
        <b>Evin içini de değerlendirin</b>
        Binanız sağlam olsa bile yaralanmaların büyük kısmı devrilen eşyadan
        olur. Yedi soruluk ev içi değerlendirmesi beş dakika sürer.
      </div>
    </div>`;
}

/* Eylem planını dört zaman kutusu hâlinde yazar. */
function planHtml(plan) {
  const kutu = (baslik, alt, maddeler) => !maddeler.length ? '' : `
    <div class="zaman">
      <div class="zaman-bas">
        <h4>${baslik}</h4>
        <span class="adet">${maddeler.length} madde · ${alt}</span>
      </div>
      <ol>
        ${maddeler.map((m, i) => `
          <li${m.vurgu ? ' data-vurgu="1"' : ''}>
            <span class="sira" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <span><b>${m.baslik}</b><span>${m.metin}</span></span>
          </li>`).join('')}
      </ol>
    </div>`;

  return `
    <div class="plan-ozet">
      <span class="etiket">ŞİMDİ NE YAPACAKSINIZ</span>
      <p>${plan.tekCumle}</p>
    </div>
    ${kutu('Bugün', 'para gerekmez', plan.bugun)}
    ${kutu('Bu hafta', 'küçük harcama', plan.hafta)}
    ${kutu('Bu ay', 'binanın kendisi', plan.ay)}
    ${kutu('Bu yıl', 'kalıcı hazırlık', plan.yil)}`;
}

function sonucEvici(skor) {
  const yapilan = skor.madde.length - skor.eksikler.length;
  $('#sonuc-govde').innerHTML = `
    ${basHtml(skor, 'EV İÇİ DEĞERLENDİRMESİ')}

    <div class="mesafeler" style="margin-top:var(--space-xl)">
      <div class="mesafe">
        <span><b>Alınmış önlem</b><small>yedi maddeden</small></span>
        <span class="km">${yapilan} / 7</span>
      </div>
    </div>

    ${skor.eksikler.length ? (() => {
      // ağırlığı yüksek olan önce: en çok fayda getiren madde başa gelsin
      const sirali = [...skor.eksikler].sort((x, y) => y.agirlik - x.agirlik);
      const bugun = sirali.filter(m => ['vana', 'bulusma', 'kacis', 'yatak'].includes(m.id));
      const hafta = sirali.filter(m => ['dolap', 'canta', 'cam'].includes(m.id));
      const kutu = (baslik, alt, liste) => !liste.length ? '' : `
        <div class="zaman">
          <div class="zaman-bas">
            <h4>${baslik}</h4>
            <span class="adet">${liste.length} madde · ${alt}</span>
          </div>
          <ol>
            ${liste.map((m, i) => `
              <li${i === 0 && baslik === 'Bugün' ? ' data-vurgu="1"' : ''}>
                <span class="sira" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
                <span><b>${m.soru.replace(/\?$/, '')}</b><span>${m.yapilacak}</span></span>
              </li>`).join('')}
          </ol>
        </div>`;
      return `
        <div class="plan-ozet">
          <span class="etiket">ŞİMDİ NE YAPACAKSINIZ</span>
          <p>${sirali[0].id === 'dolap'
            ? 'Devrilecek mobilyaları sabitlemek, bu listede en çok işe yarayan tek adım.'
            : 'Eksiklerin çoğu bugün, para harcamadan kapanabilir.'}</p>
        </div>
        ${kutu('Bugün', 'para gerekmez', bugun)}
        ${kutu('Bu hafta', 'küçük harcama', hafta)}`;
    })()
    : `<div class="plan-ozet">
        <span class="etiket">ŞİMDİ NE YAPACAKSINIZ</span>
        <p>Ev içi hazırlığınız tamam. Sıradaki adım binanın kendisi.</p>
      </div>
      <div class="yapilacaklar">
        <div class="yapilacak">
          <b>Yılda bir gözden geçirin</b>
          Acil çantadaki ilaç ve pil tarihleri, sabitlemelerin gevşeyip
          gevşemediği, buluşma noktasının hâlâ uygun olup olmadığı.
        </div>
      </div>`}

    <div class="yapilacaklar">
      <div class="yapilacak">
        <b>Binanın kendisini de değerlendirin</b>
        Ev içi hazırlık, binanın dayanıklılığının yerine geçmez. Konumunuzu
        ve bina bilgilerinizi girerek ikinci değerlendirmeyi de yapabilirsiniz.
      </div>
    </div>`;
}
