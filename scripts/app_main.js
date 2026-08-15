/* depremlab — yeni akış kontrolü.
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
function bolumGoster(id) {
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
  const hedef = document.getElementById(id);
  if (!hedef) return;
  hedef.classList.remove('adim');
  void hedef.offsetWidth;
  hedef.classList.add('adim');
  hedef.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
  const bas = hedef.querySelector('h2');
  if (bas) { bas.setAttribute('tabindex', '-1'); bas.focus({ preventScroll: true }); }
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

$('#adres-konum').addEventListener('click', ev => {
  const btn = ev.currentTarget;
  if (!navigator.geolocation) {
    adresKonumDurum('Tarayıcınız konum özelliğini desteklemiyor. İlçeyi elle seçebilirsiniz.', 'hata');
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
      const ilce = ilceBul(D.ilceler, konum.coords.latitude, konum.coords.longitude);
      if (!ilce) {
        adresKonumDurum('Konumunuz İstanbul ilçe sınırlarının dışında görünüyor. İlçeyi elle seçebilirsiniz.', 'hata');
        return;
      }
      $('#adres-ilce').value = ilce.ad;
      $('#adres-hata').hidden = true;
      adresKonumDurum(`İlçeniz ${ilce.ad} olarak seçildi. Yanlışsa listeden değiştirebilirsiniz.`, 'tamam');
    },
    () => {
      bitir();
      adresKonumDurum('Konum alınamadı. İlçeyi listeden kendiniz seçebilirsiniz.', 'hata');
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
});

function yapisalAdresDogrulaVeDevam() {
  const ilce = kacir($('#adres-ilce').value.trim());
  const mahalle = kacir($('#adres-mahalle').value.trim());
  const sokak = kacir($('#adres-sokak').value.trim());
  const bina = kacir($('#adres-bina').value.trim());

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
      <p class="bilgi-notu"><b>${kacir(BOLGESEL_UYARI)}</b></p>
    `;
  } else {
    const nitelik = bg.nitelikselBaglam.map(n =>
      `<div><b>${kacir(n.baslik)}</b><p>${kacir(n.metin)}</p></div>`
    ).join('');

    icerik = `
      <h3>${kacir(bg.konumEtiketi)}</h3>
      ${nitelik}
      <p><em>Veri durumu:</em> ${bg.veriDurumu === 'mevcut' ? 'Mevcut' : 'Yok'}</p>
      <p><em>Tarih:</em> ${kacir(bg.veriTarihi)}</p>
      <p><em>Kaynak:</em> ${kacir(bg.kaynak)}</p>
      <p class="bilgi-notu"><b>${kacir(BOLGESEL_UYARI)}</b></p>
      <p style="color: var(--color-ink-3); font-size: var(--text-sm)">
        ${kacir(BOLGESEL_KAPSAM)}
      </p>
    `;
  }

  $('#bolgesel-govde').innerHTML = icerik;
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

  const secenekler = soru.secenekler.map(s => `
    <label class="secenek">
      <input type="radio" name="yapisal-soru" value="${kacir(s.deger)}"${cevaplanmis === s.deger ? ' checked' : ''}>
      <span class="metin"><span>${kacir(s.etiket)}</span></span>
    </label>
  `).join('');

  const yardim = soru.yardim ? `<p style="margin-top: var(--space-sm); color: var(--color-ink-3);">${kacir(soru.yardim)}</p>` : '';

  $('#soru-govde').innerHTML = `
    <fieldset>
      <legend>${kacir(soru.soru)}</legend>
      ${yardim}
      <div class="secenekler">
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
    <div>
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
    return `<div><b>${kacir(s.soru)}</b><br>${sec ? kacir(sec.etiket) : c}</div>`;
  }).filter(Boolean).join('');

  $('#gozden-gecir-govde').innerHTML = `
    <h3>Adres</h3>
    ${adresBilgisi}
    <h3>Cevaplar</h3>
    ${cevaplanmis}
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
    etiketi.textContent = '🔧 Senaryo Modu';
    etiketi.style.cssText = 'position: fixed; top: 1rem; right: 1rem; background: #f59e0b; color: white; padding: 0.5rem 1rem; border-radius: 4px; z-index: 9999; font-size: var(--text-sm); font-weight: bold;';
    document.body.appendChild(etiketi);
  } else {
    // Gerçek sonuç türet
    durum.yapisal.sonuc = deriveDemoStructuralPriority(durum.yapisal.cevaplar);
  }

  yapisalSonucGoster();
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

  $('#yapisal-sonuc-govde').innerHTML = `
    <h3>${kacir(sonuc.title)}</h3>
    <p>${kacir(sonuc.summary)}</p>

    ${factors ? `<h4>Binanız hakkında bildiklerimiz</h4><div>${factors}</div>` : ''}
    ${missingInfo ? `<h4>Bilmediğimiz veya doğrulayamadığımız bilgiler</h4><ul>${missingInfo}</ul>` : ''}
    ${recommendations ? `<h4>Öneriler</h4><ul>${recommendations}</ul>` : ''}

    <p style="margin-top: var(--space-lg); font-size: var(--text-sm); color: var(--color-ink-3);">
      ${kacir(YAPISAL_SINIR_METNI)}
    </p>

    <p style="margin-top: var(--space-sm); font-size: var(--text-sm); color: var(--color-ink-3);">
      Bu sonuç kesin bir hasar veya güvenlik tespiti değildir. Yetkili uzmanlar tarafından yapılacak teknik incelemelerle değerlendirilebilir.
    </p>

    <h4>Binanız için hangi değerlendirmeler yapılabilir?</h4>
    <div class="secenek-kartlar">
      ${DEGERLENDIRME_SECENEKLERI.map(d => `
        <div class="secenek-kart">
          <b>${kacir(d.baslik)}</b>
          <p><em>Ne için yardımcı olabilir:</em> ${kacir(d.neYapar)}</p>
          <p><em>Ne belirleyemez:</em> ${kacir(d.neYapmaz)}</p>
          ${d.not ? `<p style="color: var(--color-ink-3); font-size: var(--text-sm)">${kacir(d.not)}</p>` : ''}
        </div>`).join('')}
    </div>
    <p style="font-size: var(--text-sm); color: var(--color-ink-3);">
      ${kacir(DEGERLENDIRME_SECENEK_NOTU)}
    </p>
  `;

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

  const secenekler = [
    { deger: 'evet', etiket: 'Evet' },
    { deger: 'hayir', etiket: 'Hayır' },
    { deger: 'emin_degilim', etiket: 'Emin değilim' },
    { deger: 'gecerli_degil', etiket: 'Bu ev için geçerli değil' },
  ];

  const html = secenekler.map(s => `
    <label class="secenek">
      <input type="radio" name="evici-soru" value="${s.deger}"${cevaplanmis === s.deger ? ' checked' : ''}>
      <span class="metin"><span>${s.etiket}</span></span>
    </label>
  `).join('');

  $('#kontrol-govde').innerHTML = `
    <fieldset>
      <legend>${kacir(madde.question)}</legend>
      <p style="margin-top: var(--space-sm); font-size: var(--text-sm); color: var(--color-ink-3);">
        <b>Risk nedeni:</b> ${kacir(madde.riskReason)}
      </p>
      <div class="secenekler">
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
    <div class="gorev-kart">
      <h4>${kacir(g.baslik)}</h4>
      <p>${kacir(g.aciklama)}</p>
      <div>
        <span class="oncelik-rozet" data-oncelik="${g.priority}">
          ${g.priority === 'critical' ? 'Acil' : g.priority === 'high' ? 'Yüksek' : 'Orta'}
        </span>
        ${g.professionalSupport ? '<span style="font-size: var(--text-sm); color: var(--color-ink-3);">👤 Uzman desteği önerilir</span>' : ''}
      </div>
      <button class="tamamla-btn" data-gorev-id="${kacir(g.id)}">
        Tamamlandı olarak işaretle
      </button>
    </div>
  `).join('');

  $('#ev-sonuc-govde').innerHTML = `
    <h3>Hazırlık ilerlemeniz</h3>
    <p>${kacir(yanitlanmis)} / ${EV_ICI_KONTROL.length} soru yanıtlandı</p>
    <p><strong>${tamamlanan} / ${uygulanabilir} önlem tamamlandı (%${yuzde})</strong></p>
    <p style="font-size: var(--text-sm); color: var(--color-ink-3);">
      ${kacir(YUZDE_ACIKLAMASI)}
    </p>

    <h4>Yapabileceğiniz ilk adımlar</h4>
    ${gorevHtml || '<p>Tüm ön lemleri tamamladınız.</p>'}
  `;

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
}

/* ==================== birleşik özet */
function ozet() {
  const yapisalDurum = durum.yapisal.sonuc ? 'tamam' : 'eksik';
  const yapisalMetin = durum.yapisal.sonuc ? kacir(durum.yapisal.sonuc.title) : 'Yapısal değerlendirme tamamlanmadı.';

  const evDurum = durum.evici.cevaplar && Object.keys(durum.evici.cevaplar).length > 0 ? 'tamam' : 'eksik';
  const tamamlanan = tamamlananOnlemSayisi(durum.evici.cevaplar, durum.evici.tamamlananIdler);
  const evMetin = `${tamamlanan} / ${EV_ICI_KONTROL.length} önlem tamamlandı`;

  $('#ozet-govde').innerHTML = `
    <h3>Binanız</h3>
    <p>${yapisalMetin}</p>
    <button id="ozet-yapisala-don">Bina değerlendirmesine dön</button>

    <h3>Eviniz</h3>
    <p>${evMetin}</p>
    <button id="ozet-evicine-don">Yapılacaklar listeme dön</button>

    <p style="margin-top: var(--space-lg); font-style: italic;">
      ${kacir(OZET_DESTEK)}
    </p>
  `;


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
  bolumGoster('bolum-giris');
});
