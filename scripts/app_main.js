/* Deprem Rehberim — akış kontrolü
 * risk_engine.js, nonstructural.js fonksiyonlarını kullanır; D global veri paketidir.
 * State: bellekte, persistence yok. PrivacyNoticeSeen ilk kez gösterilir.
 */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Kaçış fonksiyonu: HTML'e gömülecek kullanıcı girdisini güvenli hale getir
function kacir(s) {
  const harita = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(s).replace(/[&<>"']/g, c => harita[c]);
}

// Ana state: bellekte, persistence yok
const durum = {
  privacyNoticeSeen: false,
  hedefModul: null,                 // 'yapisal' | 'evici'
  yapisal: {
    adim: 0,                        // 0 adres · 1 bölgesel · 2 sorular · 3 sonuç
    adres: null,                    // { ilce, mahalle, sokak, bina }
    bolgesel: null,
    soruIndex: 0,
    cevaplar: {},                   // { donem: 'once1999', ... }
    sonuc: null,
  },
  evici: {
    soruIndex: 0,
    cevaplar: {},                   // { id: 'evet'|'hayir'|'emin_degilim'|'gecerli_degil' }
    tamamlananIdler: [],
    gorevler: [],
  },
};

// Oturum sıfırlama
function resetSession() {
  durum.privacyNoticeSeen = false;
  durum.hedefModul = null;
  durum.yapisal = {
    adim: 0,
    adres: null,
    bolgesel: null,
    soruIndex: 0,
    cevaplar: {},
    sonuc: null,
  };
  durum.evici = {
    soruIndex: 0,
    cevaplar: {},
    tamamlananIdler: [],
    gorevler: [],
  };
}

/* ======================================================== R3: Seçenek göstergeleri */
/* Seçim göstergesi: nötr, anlam taşımayan visual marker (aria-checked ile belirtilir) */
function secenekGostergesi() {
  return '○'; // Nötr seçim göstergesi, aria-hidden="true"
}

/* ======================================================== R5: Rapor kaynakları */
/* Sabit kaynak tablosu — kontrat §R5 birebir */
const RAPOR_KAYNAKLAR = {
  yapisal: {
    'usgs_vs30': { ad: 'USGS Vs30', deger: '27.600' },
    'turkiye_fay': { ad: 'Türkiye diri fay', deger: '926' },
    'usgs_fdsn': { ad: 'USGS FDSN deprem kaydı', deger: '2.015' },
    'obb_osm': { ad: 'İBB açık veri + OpenStreetMap', deger: '1.788' },
  }
};

function raporProvenance(tip, cevaplar, adres, bolgeselBilgi) {
  let html = '<section class="rapor-provenance">';
  html += '<div class="goz-ustu">Veri Kaynakları</div>';
  html += '<h3 style="margin-top: 0;">Bu rapor neye dayanıyor</h3>';
  html += '<div class="baslik-cizgi"></div>';

  // Kullanıcının yanıtları
  if (tip === 'yapisal') {
    html += '<h4 style="margin-top: var(--space-lg);">Sizin verdiğiniz bilgiler</h4>';
    html += '<div class="secenek-kartlar" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-md);">';
    YAPISAL_SORULAR.forEach(s => {
      const c = cevaplar[s.id];
      if (c) {
        const sec = s.secenekler.find(x => x.deger === c);
        html += `<div class="secenek-kart" style="padding: var(--space-md); border: 1px solid var(--color-border); border-radius: 8px;">
          <b>${kacir(s.soru)}</b><br><span style="font-size: var(--text-sm); color: var(--color-ink-2);">${sec ? kacir(sec.etiket) : c}</span>
        </div>`;
      }
    });
    html += '</div>';

    // Bölgesel kaynaklar (sadece yapısal)
    html += '<h4 style="margin-top: var(--space-lg);">Bölgesel veri kaynakları</h4>';
    html += '<div class="secenek-kartlar" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-md);">';
    for (const [k, v] of Object.entries(RAPOR_KAYNAKLAR.yapisal)) {
      html += `<div class="secenek-kart" style="padding: var(--space-md); border: 1px solid var(--color-border); border-radius: 8px;">
        <b>${kacir(v.ad)}</b><br><span style="font-size: var(--text-sm); color: var(--color-ink-2);">${kacir(v.deger)} kayıt</span>
      </div>`;
    }
    html += '</div>';

    // Bölgesel verinin sınırları (bolgeselBaglam'dan gelir)
    if (bolgeselBilgi && bolgeselBilgi.sinirlar && bolgeselBilgi.sinirlar.length > 0) {
      html += '<h4 style="margin-top: var(--space-lg);">Bölgesel verilerin sınırları</h4>';
      html += '<ul>';
      bolgeselBilgi.sinirlar.forEach(s => {
        html += `<li>${kacir(s)}</li>`;
      });
      html += '</ul>';
    }
  } else if (tip === 'evici') {
    html += '<h4 style="margin-top: var(--space-lg);">Sizin verdiğiniz bilgiler</h4>';
    html += '<div class="secenek-kartlar" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-md);">';
    EV_ICI_KONTROL.forEach(m => {
      const c = cevaplar[m.id];
      if (c) {
        const etiket = { evet: 'Evet', hayir: 'Hayır', emin_degilim: 'Emin değilim', gecerli_degil: 'Geçerli değil' }[c] || c;
        html += `<div class="secenek-kart" style="padding: var(--space-md); border: 1px solid var(--color-border); border-radius: 8px;">
          <b>${kacir(m.question)}</b><br><span style="font-size: var(--text-sm); color: var(--color-ink-2);">${etiket}</span>
        </div>`;
      }
    });
    html += '</div>';
  }

  html += '</section>';
  return html;
}

/* ======================================================== parallax hero */
/* Mevcut parallax IIFE korunur. */
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

/* ======================================================== gezinme */
function bolumGoster(id, kaydir = true) {
  // 11 bölüm id'sini gizle, hedefi göster
  const bolumler = [
    'bolum-giris', 'bolum-gizlilik', 'bolum-adres', 'bolum-bolgesel',
    'bolum-sorular', 'bolum-gozden-gecir', 'bolum-yapisal-sonuc',
    'bolum-kontrol', 'bolum-ev-sonuc', 'bolum-ozet', 'bolum-bulunamadi'
  ];
  for (const b of bolumler) {
    const el = document.getElementById(b);
    if (el) el.hidden = b !== id;
  }

  // R1: Tek ekran kuralı — landing dışında hero ve veri gizle
  const hero = document.getElementById('hero');
  const veri = document.getElementById('veri');
  const ayak = document.getElementById('ayak');
  if (id === 'bolum-giris') {
    if (hero) hero.hidden = false;
    if (veri) veri.hidden = false;
    if (ayak) ayak.hidden = false;
    // Üst bar raporlar kısmını temizle
    const ustRaporlar = document.getElementById('ust-raporlar');
    if (ustRaporlar) ustRaporlar.innerHTML = '';
  } else {
    if (hero) hero.hidden = true;
    if (veri) veri.hidden = true;
    /* Uzun feragat bloğu her adımın altında tekrarlanınca ekranı şişiriyor;
     * metinler zaten ilgili adımların içinde yer alıyor. */
    if (ayak) ayak.hidden = true;
  }

  // R2: Adım göstergesi — landing'de boş, diğer yerlerde doldur
  const ustAdim = document.getElementById('ust-adim');
  if (ustAdim) {
    if (id === 'bolum-giris') {
      ustAdim.textContent = '';
    } else if (id === 'bolum-adres') {
      ustAdim.textContent = 'Binanı Anla — Adım 1/4 · Adres';
    } else if (id === 'bolum-bolgesel') {
      ustAdim.textContent = 'Binanı Anla — Adım 2/4 · Bölgesel bilgiler';
    } else if (id === 'bolum-sorular') {
      ustAdim.textContent = 'Binanı Anla — Adım 3/4 · Bina sorularınız';
    } else if (id === 'bolum-gozden-gecir') {
      ustAdim.textContent = 'Binanı Anla — Adım 3/4 · Cevapları gözden geçir';
    } else if (id === 'bolum-yapisal-sonuc') {
      ustAdim.textContent = 'Binanı Anla — Adım 4/4 · Rapor';
    } else if (id === 'bolum-kontrol') {
      ustAdim.textContent = 'Evini Hazırla — Kontrol Listesi';
    } else if (id === 'bolum-ev-sonuc') {
      ustAdim.textContent = 'Evini Hazırla — Hazırlık Planınız';
    } else {
      ustAdim.textContent = '';
    }
  }

  const hedef = document.getElementById(id);
  if (!hedef) return;
  hedef.classList.remove('adim');
  void hedef.offsetWidth;
  hedef.classList.add('adim');
  /* Açılışta kaydırmıyoruz: aksi halde sayfa kendini landing bölümüne
   * kaydırıp hero'yu ekran dışında bırakıyordu. Kaydırma ve odak yalnızca
   * kullanıcının tetiklediği geçişlerde anlamlı. */
  if (kaydir) {
    hedef.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
    const bas = hedef.querySelector('h2');
    if (bas) { bas.setAttribute('tabindex', '-1'); bas.focus({ preventScroll: true }); }
  }
}

/* Geri/başa dön düğmeleri: data-git="<bölüm id>". Olay delegasyonu, çünkü
 * bazı bölümler JS tarafından yeniden çizilir. */
document.addEventListener('click', ev => {
  const btn = ev.target.closest('[data-git]');
  if (btn) bolumGoster(btn.dataset.git);
});

/* Her senaryoyu temsil eden yanıt kümesi. Sonuç bunlardan türetilir. */
const SENARYO_YANITLARI = {
  priority_review: { donem: 'once1999', kat: 'k5_8', mudahale: 'evet',
    gorunur: 'catlak', hasar: 'hayir', ilave: 'hayir', onceki: 'hayir' },
  detailed_review: { donem: 'once1999', kat: 'k5_8', mudahale: 'hayir',
    gorunur: 'yok', hasar: 'hayir', ilave: 'hayir', onceki: 'evet' },
  no_prominent_warning: { donem: 'sonra2019', kat: 'k1_4', mudahale: 'hayir',
    gorunur: 'yok', hasar: 'hayir', ilave: 'hayir', onceki: 'evet' },
  insufficient_information: { donem: 'bilmiyorum', kat: 'bilmiyorum',
    mudahale: 'bilmiyorum', gorunur: 'emin_degilim', hasar: 'bilmiyorum',
    ilave: 'bilmiyorum', onceki: 'bilmiyorum' },
};

/* ====== Dev senaryosu: ?scenario=priority|detailed|clear|insufficient */
function dev_scenarioKontrol() {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get('scenario');
  if (!scenario) return null;

  const secenekler = {
    'priority': 'priority_review',
    'detailed': 'detailed_review',
    'clear': 'no_prominent_warning',
    'insufficient': 'insufficient_information',
  };
  return secenekler[scenario] || null;
}

/* ==================== gizlilik ekranı — ilk kez göster, sonra atla */
function gizlilikEkrani() {
  if (durum.privacyNoticeSeen) {
    // Atla, doğrudan hedef modüle git
    if (durum.hedefModul === 'yapisal') {
      yapisalModulBasla();
    } else if (durum.hedefModul === 'evici') {
      eviciModulBasla();
    }
    return;
  }
  bolumGoster('bolum-gizlilik');
}

$('#git-gizlilik-yapisal').addEventListener('click', () => {
  durum.hedefModul = 'yapisal';
  gizlilikEkrani();
});

$('#git-gizlilik-evici').addEventListener('click', () => {
  durum.hedefModul = 'evici';
  gizlilikEkrani();
});

$('#gizlilik-devam').addEventListener('click', () => {
  durum.privacyNoticeSeen = true;
  if (durum.hedefModul === 'yapisal') {
    yapisalModulBasla();
  } else if (durum.hedefModul === 'evici') {
    eviciModulBasla();
  } else {
    bolumGoster('bolum-giris');
  }
});

/* ==================== yapısal modül başlangıcı */
function yapisalModulBasla() {
  durum.hedefModul = 'yapisal';
  durum.yapisal.adim = 0;
  yapisalAdresBolumKur();
  bolumGoster('bolum-adres');
}

/* ==================== adres bölümü: ilçe, mahalle, sokak, bina no */
function yapisalAdresBolumKur() {
  // İlçe dropdown'ını doldur
  const ilceler = ilceListesi(D);
  const select = $('#adres-ilce');
  select.innerHTML = '<option value="">İlçe seçin</option>' +
    ilceler.map(ilce => `<option value="${kacir(ilce)}">${kacir(ilce)}</option>`).join('');

  // Devam butonu
}

/* Konumdan ilçeyi bul. Koordinat tarayıcıdan çıkmaz: ilçe eşleştirmesi
 * gömülü D.ilceler poligonlarıyla yerel olarak yapılır, coğrafi kodlama
 * servisi kullanılmaz. Kullanıcı isterse ilçeyi elle de seçebilir. */
function adresKonumDurum(metin, tip) {
  const el = $('#adres-konum-durum');
  el.textContent = metin;
  el.dataset.tip = tip || '';
}

/* Nokta hiçbir ilçe poligonuna düşmezse (kıyı şeridi, poligon boşluğu,
 * düşük doğruluk) en yakın ilçe merkezine düş. */
function enYakinIlce(ilceler, lat, lon) {
  let en = null, enKm = Infinity;
  for (const il of ilceler) {
    const halka = il.halkalar && il.halkalar[0];
    if (!halka || !halka.length) continue;
    let sLat = 0, sLon = 0;
    for (const [a, o] of halka) { sLat += a; sLon += o; }
    const d = mesafeKm(lat, lon, sLat / halka.length, sLon / halka.length);
    if (d < enKm) { enKm = d; en = il; }
  }
  return enKm <= 25 ? en : null;
}

$('#adres-konum').addEventListener('click', ev => {
  const btn = ev.currentTarget;

  if (!navigator.geolocation) {
    adresKonumDurum('Tarayıcınız konum özelliğini desteklemiyor. İlçeyi listeden seçebilirsiniz.', 'hata');
    return;
  }
  /* Tarayıcılar güvenli olmayan kaynakta konumu tamamen engeller. Dosyayı
   * çift tıklayarak açtıysanız (file://) düğme hiç çalışmaz — bunu genel bir
   * "alınamadı" mesajıyla geçiştirmek yerine nedenini söylüyoruz. */
  if (!window.isSecureContext) {
    adresKonumDurum(
      'Konum yalnızca güvenli bağlantıda (https) çalışır. Sayfa dosyadan '
      + 'açıldığı için tarayıcı konumu engelliyor. İlçeyi listeden seçebilirsiniz.',
      'hata');
    return;
  }

  btn.disabled = true;
  const eskiMetin = btn.textContent;
  btn.textContent = 'Konum aranıyor…';
  adresKonumDurum('Konumunuz aranıyor. Tarayıcı izin isterse "İzin ver" deyin.', '');

  const bitir = () => { btn.disabled = false; btn.textContent = eskiMetin; };

  navigator.geolocation.getCurrentPosition(
    konum => {
      bitir();
      const { latitude: lat, longitude: lon } = konum.coords;
      const ilce = ilceBul(D.ilceler, lat, lon) || enYakinIlce(D.ilceler, lat, lon);
      if (!ilce) {
        adresKonumDurum(
          'Konumunuz İstanbul dışında görünüyor. Bu araç İstanbul ilçeleri için '
          + 'hazırlandı; ilçeyi listeden seçerek devam edebilirsiniz.', 'hata');
        return;
      }
      $('#adres-ilce').value = ilce.ad;
      $('#adres-hata').hidden = true;
      adresKonumDurum(`İlçeniz ${ilce.ad} olarak seçildi. Yanlışsa listeden değiştirebilirsiniz.`, 'tamam');
    },
    hata => {
      bitir();
      /* Üç ayrı neden, üç ayrı çözüm. Hepsine aynı metni basmak
       * kullanıcıyı ne yapacağını bilmez halde bırakıyordu. */
      let metin;
      if (hata.code === hata.PERMISSION_DENIED) {
        metin = 'Konum izni verilmedi. Tarayıcının adres çubuğundaki kilit '
              + 'simgesinden izin verebilir ya da ilçeyi listeden seçebilirsiniz.';
      } else if (hata.code === hata.POSITION_UNAVAILABLE) {
        metin = 'Konum belirlenemedi. Cihazınızın konum servisleri kapalı '
              + 'olabilir. İlçeyi listeden seçebilirsiniz.';
      } else if (hata.code === hata.TIMEOUT) {
        metin = 'Konum zamanında alınamadı. Tekrar deneyebilir veya ilçeyi '
              + 'listeden seçebilirsiniz.';
      } else {
        metin = 'Konum alınamadı. İlçeyi listeden seçebilirsiniz.';
      }
      adresKonumDurum(metin, 'hata');
    },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
  );
});

function yapisalAdresDogrulaVeDevam() {
  const ilce = kacir($('#adres-ilce').value.trim());
  const mahalle = $('#adres-mahalle').value.trim();
  const sokak = $('#adres-sokak').value.trim();
  const bina = $('#adres-bina').value.trim();

  // İlçe seçili olmalı
  if (!$('#adres-ilce').value) {
    $('#adres-hata').textContent = 'Lütfen ilçe seçin.';
    $('#adres-hata').hidden = false;
    return;
  }

  $('#adres-hata').hidden = true;

  // Adresi state'e kaydet
  durum.yapisal.adres = {
    ilce: $('#adres-ilce').value,  // Kaçırmamış değer
    mahalle,
    sokak,
    bina,
  };

  // Bölgesel bilgileri oku
  durum.yapisal.bolgesel = bolgeselBaglam(D, durum.yapisal.adres.ilce);
  durum.yapisal.adim = 1;

  yapisalBolgeseBolumKur();
  bolumGoster('bolum-bolgesel');
}

/* ==================== bölgesel bilgiler bölümü */
function yapisalBolgeseBolumKur() {
  const bg = durum.yapisal.bolgesel;
  let icerik = '';

  if (!bg) {
    // Veri bulunamasa bile brief §9.2'nin zorunlu uyarısı ekranda kalmalı.
    icerik = `
      <p>Bu ilçe için bölgesel bilgi bulunamadı. Bina sorularına devam edebilirsiniz.</p>
      <div class="alinti-kutu"><b>${kacir(BOLGESEL_UYARI)}</b></div>
    `;
  } else {
    // nitelikselBaglam: { baslik, deger, metin } şekli — kartlar halinde
    const nitelik = bg.nitelikselBaglam.map(n => `
      <div class="secenek-kart" style="padding: var(--space-md);">
        <b>${kacir(n.baslik)}</b>
        ${n.deger ? `<div style="font-weight: 600; font-size: 1.1em; margin: 0.5rem 0; color: var(--color-accent);">${kacir(n.deger)}</div>` : ''}
        <p style="margin: 0.5rem 0; font-size: var(--text-sm);">${kacir(n.metin)}</p>
      </div>
    `).join('');

    // sinirlar listesi (4 madde)
    const sinirlarHtml = bg.sinirlar && bg.sinirlar.length > 0
      ? `<h4 style="margin-top: var(--space-lg);">Bölgesel verilerin sınırları</h4><ul>${bg.sinirlar.map(s => `<li>${kacir(s)}</li>`).join('')}</ul>`
      : '';

    icerik = `
      <div class="goz-ustu">Bölgesel Bilgiler</div>
      <h2 style="margin-top: 0;">${kacir(bg.konumEtiketi)}</h2>
      <div class="baslik-cizgi"></div>

      <div class="secenek-kartlar" style="margin: var(--space-lg) 0;">
        ${nitelik}
      </div>

      ${sinirlarHtml}

      <div style="margin-top: var(--space-lg); padding-top: var(--space-lg); border-top: 1px solid var(--color-border); font-size: var(--text-sm); color: var(--color-ink-3);">
        <p><b>Tarih:</b> ${kacir(bg.veriTarihi)}</p>
        <p><b>Kaynaklar:</b><br>${kacir(bg.kaynak).replace(/\n/g, '<br>')}</p>
      </div>

      <div class="alinti-kutu">
        <p><b>${kacir(BOLGESEL_UYARI)}</b></p>
        <p style="margin: 0; font-size: var(--text-sm);">
          ${kacir(BOLGESEL_KAPSAM)}
        </p>
      </div>
    `;
  }

  $('#bolgesel-govde').innerHTML = icerik;
}

/* ==================== yapısal adres başlığı */
function yapisalAdresBolumBasligi() {
  const baslik = document.createElement('div');
  baslik.innerHTML = `
    <div class="goz-ustu">Binanı Anla</div>
    <h2 style="margin-top: 0;">Önce yaşadığın yeri bulalım.</h2>
    <div class="baslik-cizgi"></div>
  `;
  const adresBolum = document.getElementById('bolum-adres');
  if (adresBolum) {
    const baslikEL = adresBolum.querySelector('.adres-baslik');
    if (baslikEL) baslikEL.replaceWith(baslik);
    else adresBolum.prepend(baslik);
  }
}

/* ==================== yapısal sorular bölümü */
function yapisalSorularBolumKur() {
  durum.yapisal.adim = 2;
  durum.yapisal.soruIndex = 0;
  yapisalSoruGoster();
}

function yapisalSoruGoster() {
  if (durum.yapisal.soruIndex >= YAPISAL_SORULAR.length) {
    // Tüm sorular soruldu, gözden geçir ekranına git
    durum.yapisal.adim = 3;
    yapisalGozdenGecirBolumKur();
    bolumGoster('bolum-gozden-gecir');
    return;
  }

  const soru = YAPISAL_SORULAR[durum.yapisal.soruIndex];
  const cevaplanmis = durum.yapisal.cevaplar[soru.id];

  // R3: Seçenek kartları — tümü ≤24 karakter ise data-kisa="1" koy
  const tumKisa = soru.secenekler.every(s => s.etiket.length <= 24);

  const secenekler = soru.secenekler.map(s => `
    <label class="secenek">
      <input type="radio" name="yapisal-soru" value="${kacir(s.deger)}"${cevaplanmis === s.deger ? ' checked' : ''} aria-checked="${cevaplanmis === s.deger ? 'true' : 'false'}">
      <span class="metin"><span>${kacir(s.etiket)}</span></span>
    </label>
  `).join('');

  const yardim = soru.yardim ? `<p style="margin-top: var(--space-sm); color: var(--color-ink-3);">${kacir(soru.yardim)}</p>` : '';

  $('#soru-govde').innerHTML = `
    <div class="goz-ustu">Binanı Anla</div>
    <h3 style="margin-top: 0;">${kacir(soru.soru)}</h3>
    ${yardim}
    <fieldset style="border: none; padding: 0; margin-top: var(--space-md);">
      <div class="secenekler"${tumKisa ? ' data-kisa="1"' : ''}>
        ${secenekler}
      </div>
    </fieldset>
  `;

  $('#soru-ilerleme').textContent = `${durum.yapisal.soruIndex + 1} / ${YAPISAL_SORULAR.length} soru`;

  // Soru navigasyonu
  $('#soru-geri').disabled = durum.yapisal.soruIndex === 0;
  $('#soru-ileri').disabled = !cevaplanmis;

  bolumGoster('bolum-sorular');
}

/* Bir seçenek işaretlenince yanıtı hemen kaydet ve İleri'yi aç.
 * Olay delegasyonu: #soru-govde her soruda yeniden çizilir. */
$('#soru-govde').addEventListener('change', ev => {
  const girdi = ev.target.closest('input[name="yapisal-soru"]');
  if (!girdi) return;
  const soru = YAPISAL_SORULAR[durum.yapisal.soruIndex];
  if (soru) durum.yapisal.cevaplar[soru.id] = girdi.value;
  $('#soru-ileri').disabled = false;
});

$('#soru-geri').addEventListener('click', () => {
  if (durum.yapisal.soruIndex > 0) {
    durum.yapisal.soruIndex--;
    yapisalSoruGoster();
  }
});

$('#soru-ileri').addEventListener('click', () => {
  const secilen = $('input[name="yapisal-soru"]:checked');
  if (!secilen) return;

  const soru = YAPISAL_SORULAR[durum.yapisal.soruIndex];
  durum.yapisal.cevaplar[soru.id] = secilen.value;

  if (durum.yapisal.soruIndex < YAPISAL_SORULAR.length - 1) {
    durum.yapisal.soruIndex++;
    yapisalSoruGoster();
  } else {
    durum.yapisal.adim = 3;
    yapisalGozdenGecirBolumKur();
    bolumGoster('bolum-gozden-gecir');
  }
});

/* ==================== gözden geçir bölümü */
function yapisalGozdenGecirBolumKur() {
  const adres = durum.yapisal.adres;
  const cevaplar = durum.yapisal.cevaplar;

  const adresBilgisi = `
    <div class="secenek-kart" style="padding: var(--space-md);">
      <b>İlçe:</b> ${kacir(adres.ilce)}<br>
      ${adres.mahalle ? `<b>Mahalle:</b> ${kacir(adres.mahalle)}<br>` : ''}
      ${adres.sokak ? `<b>Sokak:</b> ${kacir(adres.sokak)}<br>` : ''}
      ${adres.bina ? `<b>Bina No:</b> ${kacir(adres.bina)}<br>` : ''}
    </div>
  `;

  const cevaplanmis = YAPISAL_SORULAR.map(s => {
    const c = cevaplar[s.id];
    if (!c) return null;
    const sec = s.secenekler.find(x => x.deger === c);
    return `<div class="secenek-kart" style="padding: var(--space-sm);"><b>${kacir(s.soru)}</b><br><span style="font-size: var(--text-sm); color: var(--color-ink-2);">${sec ? kacir(sec.etiket) : c}</span></div>`;
  }).filter(Boolean).join('');

  $('#gozden-gecir-govde').innerHTML = `
    <div class="goz-ustu">Binanı Anla</div>
    <h2 style="margin-top: 0;">Cevapları gözden geçir</h2>
    <div class="baslik-cizgi"></div>

    <h3 style="margin-top: var(--space-lg);">Adres</h3>
    ${adresBilgisi}

    <h3 style="margin-top: var(--space-lg);">Cevaplar</h3>
    <div class="secenek-kartlar">
      ${cevaplanmis}
    </div>
  `;

}

/* ==================== yapısal sonuç */
function yapisalSonucKur() {
  // Dev scenario kontrolü
  const scenario = dev_scenarioKontrol();
  if (scenario) {
    /* Senaryoyu temsil eden yanıt kümesinden gerçek sonucu türet — böylece
     * başlık, özet, etkenler ve öneriler üretimdekiyle birebir aynı olur. */
    durum.yapisal.sonuc = deriveDemoStructuralPriority(SENARYO_YANITLARI[scenario]);
    // Senaryo modu etiketi göster
    const etiketi = document.createElement('div');
    etiketi.id = 'senaryo-etiketi';
    etiketi.textContent = 'SENARYO MODU · geliştirme';
    etiketi.style.cssText = 'position: fixed; top: 1rem; right: 1rem; background: #f59e0b; color: white; padding: 0.5rem 1rem; border-radius: 4px; z-index: 9999; font-size: var(--text-sm); font-weight: bold;';
    document.body.appendChild(etiketi);
  } else {
    // Gerçek sonuç türet
    durum.yapisal.sonuc = deriveDemoStructuralPriority(durum.yapisal.cevaplar);
  }

  yapisalSonucGoster();

  // Üst bar rapor erişimi — iki raporun da linkini koy
  const ustRaporlar = document.getElementById('ust-raporlar');
  if (ustRaporlar) {
    const evRaporBtn = durum.evici.cevaplar && Object.keys(durum.evici.cevaplar).length > 0
      ? 'Ev Raporu'
      : 'Ev Raporu';
    ustRaporlar.innerHTML = `
      <button id="ust-yapisal-rapor-btn">Bina Raporu</button>
      <button id="ust-ev-rapor-btn">${evRaporBtn}</button>
    `;
    document.getElementById('ust-yapisal-rapor-btn').addEventListener('click', () => {
      bolumGoster('bolum-yapisal-sonuc');
    });
    document.getElementById('ust-ev-rapor-btn').addEventListener('click', () => {
      if (durum.evici.cevaplar && Object.keys(durum.evici.cevaplar).length > 0) {
        bolumGoster('bolum-ev-sonuc');
      } else {
        eviciModulBasla();
      }
    });
  }

  bolumGoster('bolum-yapisal-sonuc');
}

function yapisalSonucGoster() {
  const sonuc = durum.yapisal.sonuc;
  const adres = durum.yapisal.adres;

  // Basit özet
  const factors = sonuc.factors.map(f => `
    <div>
      <b>${kacir(f.etiket)}</b> (${kacir(f.tur)})<br>
      ${kacir(f.metin)}
    </div>
  `).join('');

  const missingInfo = sonuc.missingInformation.map(m => `<li>${kacir(m)}</li>`).join('');
  const recommendations = sonuc.recommendations.map(r => `<li>${kacir(r)}</li>`).join('');

  // Sonuç durumu pill — düz metin, emoji yok
  const durumetiket = sonuc.priority === 'priority_review' ? 'Öncelikli inceleme'
    : sonuc.priority === 'detailed_review' ? 'Ayrıntılı değerlendirme'
    : sonuc.priority === 'no_prominent_warning' ? 'Uyarı yok'
    : 'Bilgi yetersiz';
  const pillKlası = sonuc.priority === 'priority_review' ? 'data-oncelik="critical"'
    : sonuc.priority === 'detailed_review' ? 'data-oncelik="high"'
    : sonuc.priority === 'insufficient_information' ? 'data-oncelik="warning"'
    : 'data-oncelik="neutral"';
  const pilltag = `<span class="pill" ${pillKlası}>${kacir(durumetiket)}</span>`;

  // Kentsel dönüşüm bölümü — numaralı rozetler ile
  let kentselBolum = '';
  if (typeof KENTSEL_DONUSUM !== 'undefined' && KENTSEL_DONUSUM) {
    const adımlarHtml = KENTSEL_DONUSUM.adimlar
      .map((a, i) => `
        <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-lg);">
          <div class="rozet-no" style="flex-shrink: 0;">${i + 1}</div>
          <div>
            <b>${kacir(a.baslik)}</b><br>${kacir(a.metin)}
          </div>
        </div>
      `)
      .join('');
    const kaynakHtml = KENTSEL_DONUSUM.nereden
      .map(k => `<li><b>${kacir(k.ad)}</b>${k.not ? ` — ${kacir(k.not)}` : ''}</li>`)
      .join('');

    kentselBolum = `
      <div style="margin-top: var(--space-lg); padding-top: var(--space-lg); border-top: 1px solid var(--color-border);">
        <div class="goz-ustu">Sonraki Adım</div>
        <h3 style="margin-top: 0;">Sonraki Adımını Belirle</h3>
        <div class="baslik-cizgi"></div>
        <p>${kacir(KENTSEL_DONUSUM.giris)}</p>
        ${adımlarHtml}
        <h4>Başvurabilecek resmî kurumlar</h4>
        <ul>
          ${kaynakHtml}
        </ul>
        <div class="alinti-kutu" style="margin-top: var(--space-lg);">
          <p><b>Uyarı</b></p>
          <p style="font-style: italic;">
            ${kacir(KENTSEL_DONUSUM.uyari)}
          </p>
          <p style="margin-top: var(--space-sm); font-size: var(--text-sm);">
            ${kacir(KENTSEL_DONUSUM.sinir)}
          </p>
        </div>
      </div>
    `;
  }

  $('#yapisal-sonuc-govde').innerHTML = `
    <div class="goz-ustu">Binanı Anla</div>
    <h2 style="margin-top: 0;">${kacir(sonuc.title)}</h2>
    <div class="baslik-cizgi"></div>

    <div class="panel-koyu" style="margin: var(--space-lg) 0;">
      <p style="margin-top: 0;">${kacir(sonuc.summary)}</p>
      <p>${pilltag}</p>
    </div>

    ${factors ? `<h3 style="margin-top: var(--space-lg);">Binanız hakkında bildiklerimiz</h3><div>${factors}</div>` : ''}
    ${missingInfo ? `<h3 style="margin-top: var(--space-lg);">Bilmediğimiz veya doğrulayamadığımız bilgiler</h3><ul>${missingInfo}</ul>` : ''}
    ${recommendations ? `<h3 style="margin-top: var(--space-lg);">Öneriler</h3><ul>${recommendations}</ul>` : ''}

    <div class="alinti-kutu" style="margin-top: var(--space-lg);">
      <p><b>Yöntemin sınırları</b></p>
      <p>${kacir(YAPISAL_SINIR_METNI)}</p>
      <p style="margin-top: var(--space-sm); font-size: var(--text-sm);">
        Bu değerlendirme binanızın yapısal güvenliğinin profesyonel bir tespiti değildir ve bir prototiptir. Kesin sonuçlar için yetkili uzmanların yapacağı teknik incelemeler gereklidir.
      </p>
    </div>

    <h3>Binanız için hangi değerlendirmeler yapılabilir?</h3>
    <div class="secenek-kartlar">
      ${DEGERLENDIRME_SECENEKLERI.map(d => `
        <div class="secenek-kart">
          <b>${kacir(d.baslik)}</b>
          <p><em>Ne için yardımcı olabilir:</em> ${kacir(d.neYapar)}</p>
          <p><em>Ne belirleyemez:</em> ${kacir(d.neYapmaz)}</p>
          ${d.not ? `<p style="color: var(--color-ink-3); font-size: var(--text-sm)">${kacir(d.not)}</p>` : ''}
          <div class="pill-sira">
            <span class="pill">${kacir(d.baslik)}</span>
          </div>
        </div>`).join('')}
    </div>
    <div class="alinti-kutu">
      <p>${kacir(DEGERLENDIRME_SECENEK_NOTU)}</p>
    </div>

    ${kentselBolum}

    <div style="margin-top: var(--space-lg);">
      </div>
  `;

  // R5: Rapor provenance bölümü — mount point'e koy
  const provenanceHtml = raporProvenance('yapisal', durum.yapisal.cevaplar, adres, durum.yapisal.bolgesel);
  const provenanceEl = document.getElementById('rapor-neye-dayaniyorsa-yapisal');
  if (provenanceEl) {
    provenanceEl.innerHTML = provenanceHtml;
  }

  // R6: PDF yazdırma butonu
  const pdfBtnEl = document.getElementById('rapor-yazdir-yapisal');
  if (pdfBtnEl) {
    pdfBtnEl.addEventListener('click', () => {
      window.print();
    });
  }
}

/* ==================== ev içi kontrol listesi modülü */
function eviciModulBasla() {
  durum.hedefModul = 'evici';
  durum.evici.soruIndex = 0;
  eviciSoruGoster();
}

function eviciSoruGoster() {
  if (durum.evici.soruIndex >= EV_ICI_KONTROL.length) {
    // Tüm sorular soruldu
    eviciGorevlerKur();
    bolumGoster('bolum-kontrol');
    eviciSonucKur();
    return;
  }

  const madde = EV_ICI_KONTROL[durum.evici.soruIndex];
  const cevaplanmis = durum.evici.cevaplar[madde.id];

  // R3: Ev içi seçenekler — 4 şık, tümü ≤24 karakter (bunu CSS kontrol eder)
  const secenekler = [
    { deger: 'evet', etiket: 'Evet' },
    { deger: 'hayir', etiket: 'Hayır' },
    { deger: 'emin_degilim', etiket: 'Emin değilim' },
    { deger: 'gecerli_degil', etiket: 'Bu ev için geçerli değil' },
  ];

  const tumKisa = secenekler.every(s => s.etiket.length <= 24);

  const html = secenekler.map(s => `
    <label class="secenek">
      <input type="radio" name="evici-soru" value="${s.deger}"${cevaplanmis === s.deger ? ' checked' : ''} aria-checked="${cevaplanmis === s.deger ? 'true' : 'false'}">
      <span class="metin"><span>${s.etiket}</span></span>
    </label>
  `).join('');

  $('#kontrol-govde').innerHTML = `
    <div class="goz-ustu">Evini Hazırla</div>
    <h3 style="margin-top: 0;">${kacir(madde.question)}</h3>
    <p style="margin-top: var(--space-sm); font-size: var(--text-sm); color: var(--color-ink-3);">
      <b>Risk nedeni:</b> ${kacir(madde.riskReason)}
    </p>
    <fieldset style="border: none; padding: 0;">
      <div class="secenekler"${tumKisa ? ' data-kisa="1"' : ''}>
        ${html}
      </div>
    </fieldset>
  `;

  $('#kontrol-ilerleme').textContent = `${yanitlananSayisi(durum.evici.cevaplar)} / ${EV_ICI_KONTROL.length} soru yanıtlandı`;

  $('#kontrol-geri').disabled = durum.evici.soruIndex === 0;
  $('#kontrol-ileri').disabled = !cevaplanmis;

  bolumGoster('bolum-kontrol');
}

/* Seçenek işaretlenince yanıtı kaydet, ilerlemeyi ve İleri'yi güncelle. */
$('#kontrol-govde').addEventListener('change', ev => {
  const girdi = ev.target.closest('input[name="evici-soru"]');
  if (!girdi) return;
  const madde = EV_ICI_KONTROL[durum.evici.soruIndex];
  if (madde) durum.evici.cevaplar[madde.id] = girdi.value;
  $('#kontrol-ileri').disabled = false;
  $('#kontrol-ilerleme').textContent =
    `${yanitlananSayisi(durum.evici.cevaplar)} / ${EV_ICI_KONTROL.length} soru yanıtlandı`;
});

$('#kontrol-geri').addEventListener('click', () => {
  if (durum.evici.soruIndex > 0) {
    durum.evici.soruIndex--;
    eviciSoruGoster();
  }
});

$('#kontrol-ileri').addEventListener('click', () => {
  const secilen = $('input[name="evici-soru"]:checked');
  if (!secilen) return;

  const madde = EV_ICI_KONTROL[durum.evici.soruIndex];
  durum.evici.cevaplar[madde.id] = secilen.value;

  if (durum.evici.soruIndex < EV_ICI_KONTROL.length - 1) {
    durum.evici.soruIndex++;
    eviciSoruGoster();
  } else {
    eviciGorevlerKur();
    eviciSonucKur();
    bolumGoster('bolum-ev-sonuc');
  }
});

function eviciGorevlerKur() {
  durum.evici.gorevler = gorevUret(durum.evici.cevaplar);
}

function eviciSonucKur() {
  const yuzde = tamamlanmaYuzdesi(durum.evici.cevaplar, durum.evici.tamamlananIdler);
  const yanitlanmis = yanitlananSayisi(durum.evici.cevaplar);
  const uygulanabilir = uygulanabilirSayisi(durum.evici.cevaplar);
  const tamamlanan = tamamlananOnlemSayisi(durum.evici.cevaplar, durum.evici.tamamlananIdler);

  const gorevler = durum.evici.gorevler;
  const ilkUc = ilkUcGorev(gorevler, durum.evici.tamamlananIdler);

  const gorevHtml = ilkUc.map(g => `
    <div class="gorev-kart secenek-kart" style="padding: var(--space-md);">
      <div style="display: flex; align-items: flex-start; gap: var(--space-sm);">
        <span class="oncelik-rozet" data-oncelik="${g.priority}" style="flex-shrink: 0; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: var(--text-sm);">
          ${g.priority === 'critical' ? '1' : g.priority === 'high' ? '2' : '3'}
        </span>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.5rem 0;">${kacir(g.baslik)}</h4>
          <p style="margin: 0.5rem 0; font-size: var(--text-sm);">${kacir(g.aciklama)}</p>
          <div style="margin: 0.5rem 0; display: flex; flex-wrap: wrap; gap: var(--space-sm);">
            <span class="pill" data-oncelik="${g.priority}">
              ${g.priority === 'critical' ? 'Acil' : g.priority === 'high' ? 'Yüksek' : 'Orta'}
            </span>
            ${g.professionalSupport ? '<span class="pill">Uzman desteği önerilir</span>' : ''}
          </div>
          <button class="tamamla-btn" data-gorev-id="${kacir(g.id)}" style="margin-top: 0.5rem;">
            Tamamlandı olarak işaretle
          </button>
        </div>
      </div>
    </div>
  `).join('');

  const ilerlemePanel = `
    <div class="panel-koyu" style="margin: var(--space-lg) 0; padding: var(--space-md);">
      <p style="margin-top: 0;"><b>Hazırlık ilerlemeniz</b></p>
      <p>${kacir(yanitlanmis)} / ${EV_ICI_KONTROL.length} soru yanıtlandı</p>
      <p style="font-size: 1.2em;"><strong>${tamamlanan} / ${uygulanabilir} önlem tamamlandı (%${yuzde})</strong></p>
      <div class="alinti-kutu" style="margin-top: var(--space-sm);">
        <p style="margin: 0; font-size: var(--text-sm);">
          ${kacir(YUZDE_ACIKLAMASI)}
        </p>
      </div>
    </div>
  `;

  $('#ev-sonuc-govde').innerHTML = `
    <div class="goz-ustu">Rapor</div>
    <h2 style="margin-top: 0;">Evini Hazırla — Hazırlık Planınız</h2>
    <div class="baslik-cizgi"></div>

    ${ilerlemePanel}

    <h3 style="margin-top: var(--space-lg);">Yapabileceğiniz ilk adımlar</h3>
    ${gorevHtml || '<p style="font-style: italic; color: var(--color-ink-3);">Tüm önerileri tamamladınız. Koşullar değiştiğinde kontrol listesini yeniden gözden geçirebilirsiniz.</p>'}

    <div style="margin-top: var(--space-lg);">
      </div>
  `;

  // R5: Rapor provenance bölümü — mount point'e koy
  const provenanceHtml = raporProvenance('evici', durum.evici.cevaplar, null, null);
  const provenanceEl = document.getElementById('rapor-neye-dayaniyorsa-ev');
  if (provenanceEl) {
    provenanceEl.innerHTML = provenanceHtml;
  }

  // Tamamla butonlarını bağla
  $$('.tamamla-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const gorevId = btn.dataset.gorevId;
      if (!durum.evici.tamamlananIdler.includes(gorevId)) {
        durum.evici.tamamlananIdler.push(gorevId);
      }
      eviciSonucKur();
      $('#duyuru').textContent = 'Adım tamamlandı. Hazırlık listeniz güncellendi.';
    });
  });

  // Üst bar rapor erişimi
  const ustRaporlar = document.getElementById('ust-raporlar');
  if (ustRaporlar) {
    const yapisalBtn = durum.yapisal.sonuc ? 'Bina Raporu' : 'Bina Raporu';
    ustRaporlar.innerHTML = `
      <button id="ust-yapisal-rapor-btn">${yapisalBtn}</button>
      <button id="ust-ev-rapor-btn">Ev Raporu</button>
    `;
    document.getElementById('ust-yapisal-rapor-btn').addEventListener('click', () => {
      if (durum.yapisal.sonuc) {
        bolumGoster('bolum-yapisal-sonuc');
      } else {
        yapisalModulBasla();
      }
    });
    document.getElementById('ust-ev-rapor-btn').addEventListener('click', () => {
      bolumGoster('bolum-ev-sonuc');
    });
  }

  // R6: PDF yazdırma butonu
  const pdfBtnEl = document.getElementById('rapor-yazdir-ev');
  if (pdfBtnEl) {
    pdfBtnEl.addEventListener('click', () => {
      window.print();
    });
  }
}

/* ==================== birleşik özet */
function ozet() {
  const yapisalDurum = durum.yapisal.sonuc ? 'tamam' : 'eksik';
  const yapisalMetin = durum.yapisal.sonuc ? kacir(durum.yapisal.sonuc.title) : 'Yapısal değerlendirme tamamlanmadı.';

  const evDurum = durum.evici.cevaplar && Object.keys(durum.evici.cevaplar).length > 0 ? 'tamam' : 'eksik';
  const tamamlanan = tamamlananOnlemSayisi(durum.evici.cevaplar, durum.evici.tamamlananIdler);
  const evMetin = `${tamamlanan} / ${EV_ICI_KONTROL.length} önlem tamamlandı`;

  // R4: Rapor re-access butonları — var olan raporu aç veya modüle yönlendir
  const yapisalBtn = durum.yapisal.sonuc
    ? `<button id="ozet-yapisal-rapor">Bina Raporu (mevcut)</button>`
    : `<button id="ozet-yapisal-rapor">Bina Raporu</button>`;

  const evBtn = durum.evici.cevaplar && Object.keys(durum.evici.cevaplar).length > 0
    ? `<button id="ozet-ev-rapor">Ev Hazırlık Raporu (mevcut)</button>`
    : `<button id="ozet-ev-rapor">Ev Hazırlık Raporu</button>`;

  $('#ozet-govde').innerHTML = `
    <h3>Binanız</h3>
    <p>${yapisalMetin}</p>
    ${yapisalBtn}

    <h3>Eviniz</h3>
    <p>${evMetin}</p>
    ${evBtn}

    <p style="margin-top: var(--space-lg); font-style: italic;">
      ${kacir(OZET_DESTEK)}
    </p>
  `;

  // R4: Rapor erişim butonlarını bağla
  const yapisalRaporBtn = document.getElementById('ozet-yapisal-rapor');
  if (yapisalRaporBtn) {
    yapisalRaporBtn.addEventListener('click', () => {
      if (durum.yapisal.sonuc) {
        // Var olan raporu aç
        bolumGoster('bolum-yapisal-sonuc');
      } else {
        // Modülü başlat
        yapisalModulBasla();
      }
    });
  }

  const evRaporBtn = document.getElementById('ozet-ev-rapor');
  if (evRaporBtn) {
    evRaporBtn.addEventListener('click', () => {
      if (durum.evici.cevaplar && Object.keys(durum.evici.cevaplar).length > 0) {
        // Var olan raporu aç
        bolumGoster('bolum-ev-sonuc');
      } else {
        // Modülü başlat
        eviciModulBasla();
      }
    });
  }

  $('#ozet-yapisala-don').hidden = false;
  $('#ozet-evicine-don').hidden = false;

  bolumGoster('bolum-ozet');
}

/* Adım düğmeleri: tek seferlik bağlanır. Bu düğmeler bölüm kurulum
 * fonksiyonlarının içinde bağlanırsa modüle her yeniden girişte listener
 * üst üste binerdi. */
$('#adres-devam').addEventListener('click', () => yapisalAdresDogrulaVeDevam());
$('#bolgesel-devam').addEventListener('click', () => yapisalSorularBolumKur());
$('#gozden-gecir-onayla').addEventListener('click', () => yapisalSonucKur());
$('#yapisal-sonuc-devam').addEventListener('click', () => eviciModulBasla());
$('#ozet-yapisala-don').addEventListener('click', () => yapisalModulBasla());
$('#ozet-evicine-don').addEventListener('click', () => eviciModulBasla());
$('#ev-sonuc-ozet').addEventListener('click', ozet);

/* ==================== R8: Tema toggle */
$('#tema-degistir')?.addEventListener('click', () => {
  const html = document.documentElement;
  const tema = html.dataset.tema || 'sade';
  const yeniTema = tema === 'sade' ? 'canli' : 'sade';
  html.dataset.tema = yeniTema;

  // Düğme metnini ve aria-pressed'i güncelle
  const btn = document.getElementById('tema-degistir');
  if (btn) {
    btn.textContent = yeniTema === 'sade' ? 'Canlı tema' : 'Sade tema';
    btn.setAttribute('aria-pressed', yeniTema === 'canli' ? 'true' : 'false');
  }

  // Duyuru
  const duyuru = document.getElementById('duyuru');
  if (duyuru) {
    duyuru.textContent = `Tema ${yeniTema === 'sade' ? 'sade' : 'canlı'} olarak değiştirildi.`;
  }
});

/* ==================== sıfırlama */
$('#sifirla').addEventListener('click', () => {
  $('#sifirla-diyalog').showModal();
});

$('#sifirla-onayla').addEventListener('click', () => {
  $('#sifirla-diyalog').close();
  resetSession();
  // Scenario modu etiketini kaldır
  const etiketi = document.getElementById('senaryo-etiketi');
  if (etiketi) etiketi.remove();
  bolumGoster('bolum-giris');
  $('#duyuru').textContent = 'Değerlendirme sıfırlandı.';
});

$('#sifirla-vazgec').addEventListener('click', () => {
  $('#sifirla-diyalog').close();
});

/* ==================== başlangıç */
document.addEventListener('DOMContentLoaded', () => {
  // ?scenario=... verildiyse doğrudan ilgili yapısal sonuç durumunu aç.
  if (dev_scenarioKontrol()) { yapisalSonucKur(); return; }
  bolumGoster('bolum-giris', false);
});
