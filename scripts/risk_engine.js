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

  /* Açık alan: ilçedeki açık/yeşil alan ÷ senaryo geçici barınma ihtiyacı.
   * Çıplak sayı kullanıcıya bir şey anlatmıyor; yorumunu da veriyoruz.
   * Rakam alt sınırdır — okul bahçesi, ilçe parkları, kampüsler envanterde yok. */
  let acikAlan;
  if (ilce.m2kisi == null) {
    acikAlan = { deger: 'veri yok', metin: 'Bu ilçe için açık alan hesabı yapılamadı.' };
  } else {
    const dar = ilce.m2kisi < 15;
    acikAlan = {
      deger: `kişi başına ${ilce.m2kisi} m²`,
      metin: (dar
        ? 'Senaryo sonrası barınma ihtiyacına göre açık alan dar görünüyor. '
        : 'Senaryo sonrası barınma ihtiyacına göre açık alan görece geniş görünüyor. ')
        + 'Bu rakam alt sınırdır: okul bahçeleri, ilçe parkları ve kampüsler '
        + 'envantere dahil değildir.',
    };
  }

  return {
    konumEtiketi: ilceAdi,
    veriDurumu: 'mevcut',
    nitelikselBaglam: [
      {
        baslik: 'Zemin niteliği',
        deger: ilce.vs30 == null ? 'veri yok' : `Vs30 ≈ ${Math.round(ilce.vs30)} m/s`,
        metin: zeminNit.metin,
      },
      {
        baslik: 'Fay yakınlığı',
        deger: `${ilce.fay_km.toFixed(1)} km — ${ilce.fay_ad || 'en yakın bilinen fay'}`,
        metin: fayNit.metin,
      },
      { baslik: 'Açık alan', deger: acikAlan.deger, metin: acikAlan.metin },
    ],
    /* Kaynaklar gerçektir; "demo" diye etiketlemek yanlış beyan olurdu.
     * Prototip olan, bu veriden değil anketten türetilen yapısal sonuçtur. */
    veriTarihi: 'Vs30 ve fay verisi: güncel yayın · Deprem kaydı: 1905–2025 · '
              + 'İBB senaryo sonuçları: 2019 Mw 7.5 Marmara senaryosu',
    kaynak: 'USGS Global Vs30 Mosaic · Türkiye diri fay verisi · USGS FDSN deprem '
          + 'kataloğu · İBB açık veri (deprem senaryosu, yeşil alan envanteri) · '
          + 'OpenStreetMap',
    sinirlar: [
      'Bu bilgiler ilçe ölçeğindedir; sokağınızı veya binanızı temsil etmez.',
      'Zemin verisi yaklaşık 926 metrelik hücrelerden okunur, saha etüdü değildir.',
      'Senaryo sonuçları olasılıklıdır; tek bir bina için tahmin üretmez.',
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

/* --------------------------------------------- kentsel dönüşüm yolu */

/* Kullanıcı, binası hakkında bir şey öğrendikten sonra "peki şimdi ne
 * yapacağım" diye kalıyor. Bu blok resmî süreci tarif eder.
 *
 * Bilinçli olarak YÖNLENDİRME değil BİLGİLENDİRME: bu uygulamanın anketi
 * bir binanın riskli olup olmadığını belirleyemez, dolayısıyla kimseye
 * "dönüşüme girin" denmez. Söylenen şey, sürecin nasıl işlediği ve ilk
 * adımın nerede atıldığı.
 *
 * Yasal ayrıntı vermekten kaçınılır: 6306 uygulama yönetmeliği en son
 * 4 Şubat 2026'da değişti. Oran, süre ve hak iddiaları burada yazılmaz;
 * kullanıcı resmî kaynağa gönderilir.
 */
const KENTSEL_DONUSUM = {
  baslik: 'Kentsel dönüşüm süreci nasıl işliyor?',
  giris: 'Binanızın durumunu resmî olarak öğrenmek ve dönüşüm sürecine '
       + 'başlamak 6306 sayılı Kanun kapsamında yürür. Aşağıdakiler sürecin '
       + 'genel işleyişidir.',
  adimlar: [
    {
      no: 1,
      baslik: 'Riskli yapı tespiti başvurusu',
      metin: 'Başvuru, Çevre, Şehircilik ve İklim Değişikliği Bakanlığı '
           + 'tarafından lisanslandırılmış kurum ve kuruluşlara yapılır. '
           + 'Binanızın bulunduğu ildeki lisanslı kuruluşların güncel '
           + 'listesini Bakanlıktan öğrenebilirsiniz.',
    },
    {
      no: 2,
      baslik: 'Tek malik de başlatabilir',
      metin: 'Tespit başvurusu için kat maliklerinin çoğunluğunun onayı '
           + 'aranmaz; maliklerden birinin veya kanuni temsilcisinin '
           + 'başvurusu yeterlidir. Komşularınızı ikna etmeyi beklemeden '
           + 'süreci başlatabilirsiniz.',
    },
    {
      no: 3,
      baslik: 'Masraf ve inceleme',
      metin: 'Tespit masrafı başvuranca karşılanır. Lisanslı kuruluş binada '
           + 'yerinde inceleme yapar; beton ve donatı üzerinden ölçüm alınır. '
           + 'Bu, bir anketin veremeyeceği tek gerçek sonuçtur.',
    },
    {
      no: 4,
      baslik: 'Sonuç, bildirim ve itiraz',
      metin: 'Tespit sonucu ilgili müdürlüğe bildirilir ve binanın tapu '
           + 'kaydına işlenir. Sonuca itiraz yolu açıktır. İtiraz süreleri ve '
           + 'usulü mevzuatta belirlidir; güncel hâlini resmî kaynaktan '
           + 'doğrulayın.',
    },
    {
      no: 5,
      baslik: 'Riskli çıkarsa',
      metin: 'Yıkım, güçlendirme ve yeniden yapım seçenekleri ile kira '
           + 'yardımı gibi destekler bu aşamada gündeme gelir. Hangi '
           + 'seçeneğin uygun olduğu ve malikler arasındaki karar usulü '
           + 'mevzuata tabidir; bir hukukçuya danışmanız yerinde olur.',
    },
  ],
  nereden: [
    { ad: 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı',
      not: 'Lisanslı kuruluş listesi ve güncel mevzuat metni.' },
    { ad: 'e-Devlet',
      not: 'Binanıza ait mevcut riskli yapı kaydını sorgulayabilirsiniz.' },
    { ad: 'Belediyenizin imar müdürlüğü',
      not: 'Yapı ruhsatı tarihi ve bina dosyası için.' },
  ],
  uyari: 'Bu bölüm genel bilgilendirmedir, hukuki danışmanlık değildir. '
       + '6306 sayılı Kanun\'un uygulama yönetmeliği en son 4 Şubat 2026\'da '
       + 'değişmiştir; başvuru öncesi güncel metni resmî kaynaktan doğrulayın.',
  sinir: 'Bu uygulamadaki değerlendirme binanızın riskli yapı olup olmadığını '
       + 'belirleyemez. Bunu yalnızca lisanslı bir kuruluşun yerinde yapacağı '
       + 'inceleme belirler.',
};

if (typeof module !== 'undefined') {
  module.exports = {
    kis, vs30Oku, mesafeKm, cizgiyeMesafe, enYakinFay, noktaHalkada, ilceBul,
    enYakinTesis, enYakinYol, konumAnalizi, YAPISAL_SORULAR, zeminNiteligi,
    fayNiteligi, deriveDemoStructuralPriority, ilceListesi, ilceBilgisi,
    bolgeselBaglam, YAPISAL_SINIR_METNI, SOYLEYEMEYECEKLERIMIZ,
    DEGERLENDIRME_SECENEKLERI, DEGERLENDIRME_SECENEK_NOTU, BOLGESEL_UYARI,
    KENTSEL_DONUSUM,
    BOLGESEL_KAPSAM, birlesikOzet, OZET_DESTEK,
  };
}
