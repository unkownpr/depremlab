/* depremlab — motor arayüzü (v2).
 *
 * Yeniden yazılan yapı: niteliksel sonuçlar, prototip UI yönlendirmesi,
 * bölgesel bağlam (yapısal sonuç etkilemez), 7 yapısal soru.
 * Sayısal puan, skor normalizasyonu, skora dayalı eylem planı kaldırıldı.
 */

function kis(x, alt, ust) { return Math.max(alt, Math.min(ust, x)); }

/* ---------------------------------------------------------------- konum */

/** Vs30 grid hücresini okur. Grid kuzeyden güneye, batıdan doğuya dizili. */
function vs30Oku(grid, lat, lon) {
  const hLat = (grid.kuzey - grid.guney) / grid.h;
  const hLon = (grid.dogu - grid.bati) / grid.w;
  const r = Math.floor((grid.kuzey - lat) / hLat);
  const c = Math.floor((lon - grid.bati) / hLon);
  if (r < 0 || c < 0 || r >= grid.h || c >= grid.w) return null;
  const v = grid.v[r * grid.w + c];
  return v < 0 ? null : v;
}

function mesafeKm(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const p1 = lat1 * rad, p2 = lat2 * rad;
  const a = Math.sin((p2 - p1) / 2) ** 2
          + Math.cos(p1) * Math.cos(p2) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Noktanın bir çizgiye (fay) en kısa mesafesi, km. */
function cizgiyeMesafe(lat, lon, pts) {
  const R = 6371, rad = Math.PI / 180;
  const kx = rad * R * Math.cos(lat * rad), ky = rad * R;
  const px = lon * kx, py = lat * ky;
  let en = Infinity, onc = null;
  for (const [la, lo] of pts) {
    const cur = [lo * kx, la * ky];
    if (onc) {
      const dx = cur[0] - onc[0], dy = cur[1] - onc[1];
      const L = dx * dx + dy * dy;
      const t = L === 0 ? 0 : kis(((px - onc[0]) * dx + (py - onc[1]) * dy) / L, 0, 1);
      en = Math.min(en, Math.hypot(px - (onc[0] + t * dx), py - (onc[1] + t * dy)));
    }
    onc = cur;
  }
  return en;
}

function enYakinFay(faylar, lat, lon) {
  let en = { km: Infinity, ad: '' };
  for (const f of faylar) {
    const d = cizgiyeMesafe(lat, lon, f.pts);
    if (d < en.km) en = { km: d, ad: f.ad, onem: f.onem };
  }
  return en;
}

function noktaHalkada(lat, lon, halka) {
  let ic = false;
  for (let i = 0, j = halka.length - 1; i < halka.length; j = i++) {
    const [yi, xi] = halka[i], [yj, xj] = halka[j];
    if ((yi > lat) !== (yj > lat)
        && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

function ilceBul(ilceler, lat, lon) {
  for (const il of ilceler) {
    for (const h of il.halkalar) if (noktaHalkada(lat, lon, h)) return il;
  }
  return null;
}

function enYakinTesis(tesisler, tip, lat, lon) {
  const liste = tesisler[tip] || [];
  let en = null, enKm = Infinity;
  for (const t of liste) {
    const d = mesafeKm(lat, lon, t[0], t[1]);
    if (d < enKm) { enKm = d; en = t; }
  }
  return en ? { km: enKm, ad: en[2], kaynak: en[3] } : null;
}

/** En yakın 1. derece acil ulaşım yolu. */
function enYakinYol(yollar, lat, lon) {
  if (!yollar || !yollar.length) return null;
  let en = { km: Infinity, ad: '' };
  for (const y of yollar) {
    const d = cizgiyeMesafe(lat, lon, y.pts);
    if (d < en.km) en = { km: d, ad: y.ad || 'adı kayıtsız yol' };
  }
  return en.km === Infinity ? null : en;
}

/** Konumdan türetilebilen her şeyi tek seferde toplar. */
function konumAnalizi(D, lat, lon) {
  return {
    lat, lon,
    vs30: vs30Oku(D.vs30, lat, lon),
    fay: enYakinFay(D.faylar, lat, lon),
    ilce: ilceBul(D.ilceler, lat, lon),
    hastane: enYakinTesis(D.tesisler, 'hastane', lat, lon),
    itfaiye: enYakinTesis(D.tesisler, 'itfaiye', lat, lon),
    polis: enYakinTesis(D.tesisler, 'polis', lat, lon),
    toplanma: enYakinTesis(D.tesisler, 'toplanma_alani', lat, lon),
    yol: enYakinYol(D.yollar, lat, lon),
  };
}

/* ----------------------------------------------------------- yapısal soru */

const YAPISAL_SORULAR = [
  {
    id: 'donem',
    sira: 1,
    soru: 'Binanız hangi dönemde inşa edildi?',
    secenekler: [
      { deger: 'once1999', etiket: '1999\'dan önce' },
      { deger: 'a1999_2007', etiket: '1999–2007 arası' },
      { deger: 'a2007_2019', etiket: '2007–2019 arası' },
      { deger: 'sonra2019', etiket: '2019 ve sonrası' },
      { deger: 'bilmiyorum', etiket: 'Bilmiyorum' },
    ],
  },
  {
    id: 'kat',
    sira: 2,
    soru: 'Bina kaç kattan oluşuyor? Bodrum katları da dahil edin.',
    secenekler: [
      { deger: 'k1_4', etiket: '1–4 kat' },
      { deger: 'k5_8', etiket: '5–8 kat' },
      { deger: 'k9_uzeri', etiket: '9 kat ve üzeri' },
      { deger: 'bilmiyorum', etiket: 'Bilmiyorum' },
    ],
  },
  {
    id: 'mudahale',
    sira: 3,
    soru: 'Zemin katta veya bodrumda taşıyıcı kolon ya da perde duvara müdahale edildiğini biliyor musunuz?',
    yardim: 'Örneğin dükkân veya otopark alanı açmak amacıyla yapılan müdahaleler.',
    secenekler: [
      { deger: 'hayir', etiket: 'Hayır' },
      { deger: 'evet', etiket: 'Evet' },
      { deger: 'bilmiyorum', etiket: 'Bilmiyorum' },
    ],
  },
  {
    id: 'gorunur',
    sira: 4,
    soru: 'Kolon, kiriş veya perde gibi taşıyıcı elemanlarda görünür bir sorun fark ettiniz mi?',
    secenekler: [
      { deger: 'yok', etiket: 'Görünür bir sorun yok' },
      { deger: 'catlak', etiket: 'Çatlak veya beton dökülmesi var' },
      { deger: 'demir', etiket: 'Demir açığa çıkmış veya paslanma var' },
      { deger: 'egilme', etiket: 'Eğilme ya da belirgin şekil değişikliği var' },
      { deger: 'emin_degilim', etiket: 'Emin değilim' },
    ],
  },
  {
    id: 'hasar',
    sira: 5,
    soru: 'Binanın daha önce deprem hasarı aldığını veya hasar raporu bulunduğunu biliyor musunuz?',
    secenekler: [
      { deger: 'hayir', etiket: 'Hayır' },
      { deger: 'hafif', etiket: 'Hafif hasar bilgisi var' },
      { deger: 'orta_agir', etiket: 'Orta veya ağır hasar bilgisi var' },
      { deger: 'bilmiyorum', etiket: 'Bilmiyorum' },
    ],
  },
  {
    id: 'ilave',
    sira: 6,
    soru: 'Binada sonradan eklenen kat veya proje dışı önemli bir değişiklik olduğunu biliyor musunuz?',
    secenekler: [
      { deger: 'hayir', etiket: 'Hayır' },
      { deger: 'evet', etiket: 'Evet' },
      { deger: 'bilmiyorum', etiket: 'Bilmiyorum' },
    ],
  },
  {
    id: 'onceki',
    sira: 7,
    soru: 'Binanız daha önce bir uzman tarafından yapısal olarak değerlendirildi mi?',
    secenekler: [
      { deger: 'evet', etiket: 'Evet' },
      { deger: 'hayir', etiket: 'Hayır' },
      { deger: 'bilmiyorum', etiket: 'Bilmiyorum' },
    ],
  },
];

/* ------------------------------------------------- niteliksel zemin/fay */

function zeminNiteligi(vs30) {
  if (vs30 == null) {
    return { sinif: 'veri_yok', metin: 'Bu konumda zemin verisi yok.' };
  }
  let sinif, metin;
  if (vs30 < 250) {
    sinif = 'cok_yumusak';
    metin = 'Çok yumuşak zemin. Sarsıntı belirgin şekilde büyür.';
  } else if (vs30 < 400) {
    sinif = 'yumusak';
    metin = 'Yumuşak zemin. Sarsıntı büyür.';
  } else if (vs30 < 600) {
    sinif = 'orta';
    metin = 'Orta sertlikte zemin.';
  } else {
    sinif = 'sert';
    metin = 'Sert zemin. Sarsıntı büyütmesi sınırlı.';
  }
  return { sinif, metin };
}

function fayNiteligi(km) {
  let sinif, metin;
  if (km < 10) {
    sinif = 'cok_yakin';
    metin = 'Faya çok yakın. Yer hareketi en şiddetli bu bantta olur.';
  } else if (km < 20) {
    sinif = 'yakin';
    metin = 'Faya yakın.';
  } else if (km < 40) {
    sinif = 'orta';
    metin = 'Orta mesafe.';
  } else {
    sinif = 'uzak';
    metin = 'Bilinen faylardan görece uzak.';
  }
  return { sinif, metin };
}

/* ------------------------------------------------- prototip yönlendirme */

/**
 * PROTOTİP UI YÖNLENDİRME MANTIĞI — mühendislik modeli değildir.
 * Doğrulanmış bir değerlendirme servisiyle değiştirilebilmesi için izole tutulmuştur.
 * Sayısal değer döndürmez. Bölgesel veriyi girdi olarak ALMAZ.
 */
function deriveDemoStructuralPriority(cevaplar) {
  // Yeterlilik kontrolü: 7'nin 3'ünden fazlası boş veya şüphelilikler
  const keyler = Object.keys(cevaplar);
  const yanits = keyler.length;
  const sekilliKelimeler = ['bilmiyorum', 'emin_degilim'];
  const seklililer = Object.values(cevaplar).filter(v => sekilliKelimeler.includes(v)).length;

  if (yanits < 5 || seklililer >= 3) {
    return {
      priority: 'insufficient_information',
      title: 'Değerlendirme için bilgi yetersiz',
      summary: 'Paylaştığınız bilgilerle anlamlı bir ön değerlendirme oluşturamıyoruz. Eksik bilgileri tamamlayabilir veya bir uzmandan destek alabilirsiniz.',
      factors: [],
      missingInformation: [],
      recommendations: [],
      isDemo: true,
    };
  }

  // Güçlü uyarılar
  const mudahaleEvet = cevaplar.mudahale === 'evet';
  const gorunurUyari = ['catlak', 'demir', 'egilme'].includes(cevaplar.gorunur);
  const hasarAgir = cevaplar.hasar === 'orta_agir';
  const gucluUyarı = mudahaleEvet || gorunurUyari || hasarAgir;

  if (gucluUyarı) {
    return {
      priority: 'priority_review',
      title: 'Öncelikli uzman değerlendirmesi öneriliyor',
      summary: 'Paylaştığınız bilgiler, gecikmeden uzman görüşü alınmasını anlamlı hale getiren bazı uyarılar içeriyor. Bu sonuç kesin bir hasar veya güvenlik tespiti değildir.',
      factors: [],
      missingInformation: [],
      recommendations: [],
      isDemo: true,
    };
  }

  // Dikkat etkenler
  const donemOnce1999 = cevaplar.donem === 'once1999';
  const ilaveEvet = cevaplar.ilave === 'evet';
  const oncekiHayir = cevaplar.onceki === 'hayir';
  const hasarHafif = cevaplar.hasar === 'hafif';
  const dikkatSayisi = [donemOnce1999, ilaveEvet, oncekiHayir, hasarHafif].filter(Boolean).length
                       + (seklililer > 1 ? 1 : 0);

  if (dikkatSayisi >= 1) {
    return {
      priority: 'detailed_review',
      title: 'Daha ayrıntılı değerlendirme faydalı olabilir',
      summary: 'Paylaştığınız bilgilerde daha ayrıntılı değerlendirilmesi faydalı olabilecek bazı noktalar bulunuyor. Kesin sonuç için yetkili uzman incelemesi gerekir.',
      factors: [],
      missingInformation: [],
      recommendations: [],
      isDemo: true,
    };
  }

  return {
    priority: 'no_prominent_warning',
    title: 'Paylaştığınız bilgilerde belirgin bir uyarı tespit edilmedi',
    summary: 'Bu sonuç binanızın güvenli olduğunu göstermez veya garanti etmez. Yapısal güvenlik ancak yetkili uzmanlar tarafından yapılacak teknik incelemelerle değerlendirilebilir.',
    factors: [],
    missingInformation: [],
    recommendations: [],
    isDemo: true,
  };
}

/* ------------------------------------------------- bölgesel bağlam */

function ilceListesi(D) {
  return (D.ilceler || [])
    .map(il => il.ad)
    .sort();
}

function ilceBilgisi(D, ilceAdi) {
  return (D.ilceler || []).find(il => il.ad === ilceAdi) || null;
}

/**
 * Sonucu ETKİLEMEZ. Yalnızca bağlam ekranını besler.
 * Sayı döndürebilir ama bunlar risk skoru değil, kaynak verinin kendisidir (mesafe, m², kişi).
 */
function bolgeselBaglam(D, ilceAdi) {
  const ilce = ilceBilgisi(D, ilceAdi);
  if (!ilce) return null;

  const zeminNit = zeminNiteligi(ilce.vs30);
  const fayNit = fayNiteligi(ilce.fay_km);

  return {
    konumEtiketi: ilceAdi,
    veriDurumu: 'mevcut',
    nitelikselBaglam: [
      { baslik: 'Zemin niteliği', metin: zeminNit.metin },
      { baslik: 'Fay yakınlığı', metin: fayNit.metin },
      {
        baslik: 'Açık alan',
        metin: ilce.yesil_ha && ilce.m2kisi
          ? `Bu ilçede senaryo barınma ihtiyacına göre ${ilce.m2kisi} m² açık alan düşüyor.`
          : 'Açık alan bilgisi yok.',
      },
    ],
    veriTarihi: '2024–2026',
    kaynak: 'Demo veri (İBB deprem senaryosu, USGS Vs30, Kandilli Fay Veritabanı)',
    sinirlar: [
      'Bu bilgiler ilçe ölçeğindedir.',
      'Binanızın zeminini veya deprem performansını göstermez.',
      'Bölgesel tehlike ile binanın yapısal performansı aynı şey değildir.',
    ],
  };
}

/* ------------------------------------------------- sabit metinler */

const YAPISAL_SINIR_METNI = 'Bu değerlendirme binanızın depremde güvenli veya güvensiz olduğunu göstermez. Yapısal güvenlik ancak yetkili uzmanlar tarafından yapılacak teknik incelemelerle değerlendirilebilir.';

const SOYLEYEMEYECEKLERIMIZ = [
  'Binanıza güçlendirme yapılması gerektiğini.',
  'Binanızın riskli olduğunu veya güvenli olduğunu.',
  'Binayı yıkmanız gerektiğini.',
  'Kentsel dönüşüme girmeniz gerektiğini.',
];

const DEGERLENDIRME_SECENEKLERI = [
  {
    id: 'on_inceleme',
    baslik: 'Ön inceleme / hızlı tarama',
    neYapar: 'Mühendis tarafından yapılan görsel inceleme. Açık yapısal sorunları ortaya çıkarabilir.',
    neYapmaz: 'Kesin mühendislik hesapları, deprem performans analizi, resmi tespiti çıkartmaz.',
    not: 'Başlangıç için uygun; sonucu yorumlamak için uzmandan destek gerekir.',
  },
  {
    id: 'performans_analizi',
    baslik: 'Deprem performans analizi',
    neYapar: 'Tam mühendislik değerlendirmesi. Binanın deprem sırasında nasıl davranacağını tahmin eder.',
    neYapmaz: 'Kendisi başlangıç/ön inceleme yerine geçmez; ön inceleme bulguları üzerine yapılır.',
    not: 'Nitelikli özel mühendislik firması gerekir. Maliyeti daha yüksek.',
  },
  {
    id: 'riskli_yapı_tespiti',
    baslik: 'Riskli yapı tespiti',
    neYapar: 'Resmi, yasal geçerliliği olan tespite sonuç. 6306 sayılı Kanun kapsamı.',
    neYapmaz: 'Başlangıç incelemesi değil; mühendislik raporunun formal hale gelmesi.',
    not: 'Belediye yönlendirmesi ile lisanslı kuruluşa yapılır. Yasal sonuç taşır.',
  },
];

const DEGERLENDIRME_SECENEK_NOTU = 'Bu seçeneklerin hangisinin binanıza uygun olduğu, yetkili uzmanların yapacağı teknik inceleme sonucunda belirlenebilir.';

const BOLGESEL_UYARI = 'Bir bölgenin deprem tehlikesi ile bir binanın yapısal performansı aynı şey değildir.';

const BOLGESEL_KAPSAM = 'Bu bilgiler ilçe ölçeğindedir ve binanızın zeminini veya deprem performansını göstermez.';

/* ------------------------------------------------- birleşik özet */

function birlesikOzet(yapisalSonuc, evDurumu) {
  const binanBolumu = yapisalSonuc
    ? { durum: 'tamam', metin: yapisalSonuc.title }
    : { durum: 'eksik', metin: 'Binanız hakkında değerlendirme tamamlanmadı. Bina değerlendirmesine dönebilirsiniz.' };

  const evinBolumu = evDurumu && evDurumu.cevaplar
    ? { durum: 'tamam', metin: `Ev içi kontrol listesinin tamamlandığını gösteriyor.` }
    : { durum: 'eksik', metin: 'Ev içi kontrol listesi tamamlanmadı. Ev içi kontrol listesine dönebilirsiniz.' };

  return {
    binan: binanBolumu,
    evin: evinBolumu,
    ilkOnceligin: 'Bu hafta: En yakın toplantı noktasını belirleyin ve ev içindeki devrilecek mobilyaları sabitlemeye başlayın.',
  };
}

const OZET_DESTEK = 'Sonraki adımları küçük küçük tamamlamak, hiçbir şey yapmamaktan daha değerlidir.';

if (typeof module !== 'undefined') {
  module.exports = {
    kis, vs30Oku, mesafeKm, cizgiyeMesafe, enYakinFay, noktaHalkada, ilceBul,
    enYakinTesis, enYakinYol, konumAnalizi, YAPISAL_SORULAR, zeminNiteligi,
    fayNiteligi, deriveDemoStructuralPriority, ilceListesi, ilceBilgisi,
    bolgeselBaglam, YAPISAL_SINIR_METNI, SOYLEYEMEYECEKLERIMIZ,
    DEGERLENDIRME_SECENEKLERI, DEGERLENDIRME_SECENEK_NOTU, BOLGESEL_UYARI,
    BOLGESEL_KAPSAM, birlesikOzet, OZET_DESTEK,
  };
}
