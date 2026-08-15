/* depremlab — risk motoru.
 *
 * Saf fonksiyonlar: veri + kullanıcı girdisi -> skor.
 * build_app.py bu dosyayı index.html'e gömer.
 *
 * Skor 0-100, YÜKSEK = KÖTÜ.
 *   0-25  güvenli · 26-50 az güvenli · 51-75 yüksek risk · 76-100 kritik
 */

const SEVIYELER = [
  { esik: 25,  ad: 'GÜVENLİ',      kisa: 'guvenli',  simge: '✓',
    ozet: 'Bilinen risk etkenleri düşük görünüyor.' },
  { esik: 50,  ad: 'AZ GÜVENLİ',   kisa: 'az',       simge: '!',
    ozet: 'Birkaç etken dikkat istiyor.' },
  { esik: 75,  ad: 'YÜKSEK RİSK',  kisa: 'yuksek',   simge: '!!',
    ozet: 'Birden fazla etken üst üste biniyor.' },
  { esik: 101, ad: 'KRİTİK',       kisa: 'kritik',   simge: '!!!',
    ozet: 'Bir uzmana danışmanız önerilir.' },
];

function seviyeBul(skor) {
  return SEVIYELER.find(s => skor < s.esik) || SEVIYELER[SEVIYELER.length - 1];
}

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

/* ------------------------------------------------------------- yapısal */

/* Deprem yönetmeliği dönemleri. Bina bu dönemlerin hangisinde yapıldıysa
 * o dönemin kuralına göre tasarlanmış sayılır. */
const YONETMELIK = [
  { deger: 'once1975', ad: '1975 öncesi',   puan: 30,
    not: 'Modern deprem yönetmeliği öncesi. En yüksek belirsizlik.' },
  { deger: '1975_1998', ad: '1975 – 1998',  puan: 24,
    not: '1975 yönetmeliği dönemi. 1999 depremi sonrası kurallar çok değişti.' },
  { deger: '1999_2007', ad: '1999 – 2007',  puan: 15,
    not: '1998 yönetmeliği dönemi. Denetim uygulaması yeni yerleşiyordu.' },
  { deger: '2008_2018', ad: '2008 – 2018',  puan: 8,
    not: '2007 yönetmeliği ve yapı denetimi dönemi.' },
  { deger: 'sonra2018', ad: '2018 sonrası', puan: 3,
    not: '2018 Türkiye Bina Deprem Yönetmeliği dönemi.' },
  { deger: 'bilmiyorum', ad: 'Bilmiyorum',  puan: 20,
    not: 'Bina yaşı bilinmediği için orta-üst değer alındı.' },
];

/** Zemin puanı: Vs30 düştükçe sarsıntı büyür. 760 m/s kaya referansı. */
function zeminPuani(vs30) {
  if (vs30 == null) return { puan: 15, not: 'Zemin verisi bu noktada yok, orta değer alındı.' };
  const t = kis((760 - vs30) / (760 - 180), 0, 1);
  const puan = Math.round(t * 30);
  let not;
  if (vs30 < 250)      not = 'Çok yumuşak zemin. Sarsıntı belirgin şekilde büyür.';
  else if (vs30 < 400) not = 'Yumuşak zemin. Sarsıntı büyür.';
  else if (vs30 < 600) not = 'Orta sertlikte zemin.';
  else                 not = 'Sert zemin. Sarsıntı büyütmesi sınırlı.';
  return { puan, not };
}

/** Fay puanı: yakınlık yer hareketini artırır. */
function fayPuani(km) {
  const t = kis((45 - km) / 45, 0, 1);
  const puan = Math.round(t * 20);
  let not;
  if (km < 10)      not = 'Faya çok yakın. Yer hareketi en şiddetli bu bantta olur.';
  else if (km < 20) not = 'Faya yakın.';
  else if (km < 40) not = 'Orta mesafe.';
  else              not = 'Bilinen faylardan görece uzak.';
  return { puan, not };
}

/* Kat sayısı + zemin etkileşimi (rezonans).
 *
 * Zeminin hakim titreşim periyodu kabaca Ts ≈ 4H / Vs30 (H ≈ 30 m).
 * Binanın periyodu kabaca Tb ≈ 0.1 × kat sayısı.
 * İkisi birbirine yaklaşırsa bina zeminle aynı ritimde sallanır — zorlanma artar.
 */
function katPuani(kat, vs30) {
  const taban = kis((kat - 2) / 10, 0, 1) * 10;  // yükseklik tek başına: 0-10
  if (vs30 == null) {
    return { puan: Math.round(taban + 5), rezonans: null,
             not: 'Zemin verisi olmadığı için zemin-bina uyumu hesaplanamadı.' };
  }
  const Ts = 120 / vs30;            // zemin periyodu, saniye
  const Tb = 0.1 * kat;             // bina periyodu, saniye
  const fark = Math.abs(Ts - Tb) / Ts;
  const yakinlik = kis(1 - fark, 0, 1);
  const rez = Math.round(yakinlik * 10);         // zemin-bina uyumu: 0-10
  let not;
  if (yakinlik > 0.7)      not = 'Bina yüksekliği bu zeminin titreşim ritmine yakın — zorlanma artabilir.';
  else if (yakinlik > 0.4) not = 'Bina yüksekliği ile zemin ritmi kısmen örtüşüyor.';
  else                     not = 'Bina yüksekliği zeminin ritminden uzak.';
  return {
    puan: Math.round(taban + rez),
    rezonans: { Ts: +Ts.toFixed(2), Tb: +Tb.toFixed(2), yakinlik: +yakinlik.toFixed(2) },
    not,
  };
}

function yapisalSkor(analiz, girdi) {
  const z = zeminPuani(analiz.vs30);
  const f = fayPuani(analiz.fay.km);
  const y = YONETMELIK.find(v => v.deger === girdi.donem) || YONETMELIK[5];
  const k = katPuani(girdi.kat, analiz.vs30);

  const toplam = kis(z.puan + f.puan + y.puan + k.puan, 0, 100);
  return {
    toplam: Math.round(toplam),
    seviye: seviyeBul(toplam),
    kalemler: [
      { ad: 'Zemin',            puan: z.puan, azami: 30, not: z.not,
        deger: analiz.vs30 == null ? 'veri yok' : `${Math.round(analiz.vs30)} m/s` },
      { ad: 'Faya uzaklık',     puan: f.puan, azami: 20, not: f.not,
        deger: `${analiz.fay.km.toFixed(1)} km — ${analiz.fay.ad}` },
      { ad: 'Yapım dönemi',     puan: y.puan, azami: 30, not: y.not,
        deger: y.ad },
      { ad: 'Kat sayısı',       puan: k.puan, azami: 20, not: k.not,
        deger: `${girdi.kat} kat` },
    ],
    rezonans: k.rezonans,
  };
}

/* ------------------------------------------------- yapısal olmayan */

const EV_ICI = [
  { id: 'dolap',   agirlik: 20, soru: 'Kitaplık, dolap ve gardırop duvara sabitli mi?',
    yapilacak: 'Devrilebilecek her mobilyayı L profil veya kayışla duvara sabitleyin. Deprem yaralanmalarının büyük kısmı devrilen eşyadan olur.' },
  { id: 'yatak',   agirlik: 15, soru: 'Yatak ve koltukların üstünde ağır eşya var mı? (tablo, raf, ayna)',
    ters: true,
    yapilacak: 'Uyuduğunuz ve uzun süre oturduğunuz yerlerin üstünü boşaltın.' },
  { id: 'cam',     agirlik: 10, soru: 'Büyük cam yüzeylerde güvenlik filmi var mı?',
    yapilacak: 'Şeffaf güvenlik filmi camın kırıldığında dağılmasını engeller. Balkon kapısı ve büyük pencerelerden başlayın.' },
  { id: 'kacis',   agirlik: 15, soru: 'Kaçış yolu (koridor, kapı önü) boş ve kapı kolay açılıyor mu?',
    yapilacak: 'Koridora eşya koymayın. Dış kapı anahtarını kilitte veya sabit bir yerde tutun.' },
  { id: 'vana',    agirlik: 10, soru: 'Doğalgaz ve su vanasının yerini biliyor musunuz?',
    yapilacak: 'Vanaların yerini öğrenin, kapatmayı bir kez deneyin. Ev halkından herkes bilsin.' },
  { id: 'canta',   agirlik: 15, soru: 'Acil durum çantanız hazır mı?',
    yapilacak: 'Su, ilaç, düdük, el feneri, powerbank, kimlik fotokopisi, bir miktar nakit. Kapıya yakın bir yerde dursun.' },
  { id: 'bulusma', agirlik: 15, soru: 'Ailece buluşma noktanız belli mi?',
    yapilacak: 'Evden uzakta, herkesin yürüyerek gidebileceği açık bir nokta seçin. Telefonlar çalışmayabilir.' },
];

/** cevaplar: { dolap: true/false, ... }  true = önlem alınmış (yatak hariç) */
function yapisalOlmayanSkor(cevaplar) {
  let skor = 0;
  const eksikler = [];
  for (const m of EV_ICI) {
    const c = cevaplar[m.id];
    // 'ters' maddede evet = kötü (yatak üstünde ağır eşya VAR mı?)
    const iyi = m.ters ? c === false : c === true;
    if (!iyi) {
      skor += m.agirlik;
      eksikler.push(m);
    }
  }
  return { toplam: skor, seviye: seviyeBul(skor), eksikler, madde: EV_ICI };
}

/* ------------------------------------------------------- eylem planı */

/* Sonucu "şimdi ne yapacağım"a çevirir.
 *
 * Dört zaman kutusu. Her madde koşullu — kullanıcının kendi skoruna,
 * zeminine, bina yaşına ve çevresindeki mesafelere göre girer ya da girmez.
 * Amaç eksiksiz bir afet el kitabı değil; bu kişinin sırada ne yapacağı.
 */
function eylemPlani(skor, a, girdi) {
  const bugun = [], hafta = [], ay = [], yil = [];
  const km = v => v < 1 ? Math.round(v * 1000) + ' metre' : v.toFixed(1) + ' km';

  const kalem = ad => skor.kalemler.find(k => k.ad === ad) || { puan: 0 };
  const zeminP = kalem('Zemin').puan;
  const fayP = kalem('Faya uzaklık').puan;
  const donemP = kalem('Yapım dönemi').puan;
  const bilinmiyor = girdi.donem === 'bilmiyorum';
  const eski = donemP >= 24;          // 1998 öncesi kuşak
  const cokEski = girdi.donem === 'once1975';

  /* ---- bugün: para gerektirmeyen, bugün bitecek işler ---- */
  bugun.push({
    baslik: 'Buluşma noktanızı bugün belirleyin',
    metin: a.toplanma && a.toplanma.km <= 1.5
      ? `En yakın kayıtlı toplanma alanı ${km(a.toplanma.km)} uzakta. `
        + 'Ev halkıyla birlikte bir kez yürüyün — deprem anında telefonlar '
        + 'çalışmayabilir, herkesin aynı yeri biliyor olması gerekir.'
      : `Yakınınızda kayıtlı toplanma alanı ${a.toplanma ? km(a.toplanma.km) + ' uzakta' : 'bulunamadı'}. `
        + 'Bu liste eksik olduğu için kendi noktanızı seçin: binalardan uzak, '
        + 'üstünde elektrik teli olmayan açık bir alan. Ev halkıyla birlikte yürüyün.',
  });
  bugun.push({
    baslik: 'Gaz ve su vanasının yerini öğrenin',
    metin: 'Her ikisini de bir kez kapatıp açın. Evdeki herkes yerini bilsin. '
         + 'Vananın yanına uygun anahtarı asın.',
  });
  if (a.yol && a.yol.km <= 1.0) {
    bugun.push({
      baslik: `Tahliye yolunuz: ${a.yol.ad}`,
      metin: `${km(a.yol.km)} uzaktaki bu yol, İBB'nin afet sonrası öncelikli `
           + 'açık tutacağı 1. derece acil ulaşım ağında. Yardım bu ağdan gelir, '
           + 'tahliye bu ağdan olur. Oraya yaya nasıl çıkacağınızı bilin.',
    });
  }

  /* ---- bu hafta: küçük harcama, büyük fayda ---- */
  hafta.push({
    baslik: 'Devrilecek her şeyi duvara sabitleyin',
    metin: (zeminP >= 20
      ? 'Zemininiz yumuşak; sarsıntı burada daha uzun ve daha geniş genlikli '
        + 'hissedilir, mobilya devrilmesi olasılığı artar. '
      : '')
      + 'Kitaplık, gardırop, buzdolabı, televizyon. L profil ve kayış birkaç '
      + 'yüz liradır; deprem yaralanmalarının büyük bölümü devrilen eşyadandır.',
  });
  hafta.push({
    baslik: 'Yatakların ve koltukların üstünü boşaltın',
    metin: 'Ağır tablo, ayna, raf — uzun süre bulunduğunuz yerlerin üstünde '
         + 'olmasın. Bu hiç para gerektirmez.',
  });
  hafta.push({
    baslik: 'Acil çantayı hazırlayın, kapıya yakın koyun',
    metin: 'Su, üç günlük ilaç, düdük, el feneri, powerbank, kimlik fotokopisi, '
         + 'nakit, kalın eldiven. Düdük en çok atlanan ve enkazda en çok işe '
         + 'yarayan parçadır.',
  });

  /* ---- bu ay: binanın kendisi ---- */
  if (eski) {
    ay.push({
      baslik: cokEski
        ? 'Riskli yapı tespiti başvurusu — bu maddeyi öne alın'
        : 'Binaya yapısal değerlendirme yaptırın',
      metin: (cokEski
        ? 'Binanız modern deprem yönetmeliği öncesinden. '
        : 'Binanız 1999 öncesi yönetmelik kuşağından; kurallar o depremden '
          + 'sonra köklü biçimde değişti. ')
        + 'Çevre ve Şehircilik Bakanlığı lisanslı kuruluşlarına başvurup riskli '
        + 'yapı tespiti yaptırabilirsiniz. Başvuru için tüm maliklerin '
        + 'anlaşması gerekmez — tek malik de başlatabilir.',
      vurgu: true,
    });
    ay.push({
      baslik: 'Kat malikleriyle konuyu açın',
      metin: 'Tespit ve olası güçlendirme malik çoğunluğunun kararıyla '
           + 'ilerler. Masrafı bölüştürmek hem yükü hem süreyi azaltır. '
           + 'Toplantıya bu sayfanın çıktısıyla gidebilirsiniz.',
    });
  } else if (bilinmiyor) {
    ay.push({
      baslik: 'Önce yapım yılını öğrenin',
      metin: 'Bu hesapta en ağır kalem binanın hangi yönetmelik kuşağından '
           + 'olduğu — ve sizde o bilgi yok. Yönetimden ya da belediyenin imar '
           + 'müdürlüğünden yapı ruhsatı tarihini isteyin, sonra bu '
           + 'değerlendirmeyi tekrarlayın. Sonuç ciddi biçimde değişebilir.',
      vurgu: true,
    });
  } else {
    ay.push({
      baslik: 'Bina dosyasını görün',
      metin: 'Yönetimden yapı ruhsatını, yapı denetim raporunu ve varsa zemin '
           + 'etüdünü isteyin. Binanız görece yeni bir yönetmelik kuşağından, '
           + 'ama belgesi olmayan bina hakkında hiçbir şey bilinmiyor demektir.',
    });
  }
  ay.push({
    baslik: 'DASK poliçenizi kontrol edin',
    metin: 'Zorunlu deprem sigortası konutlar için zorunludur ve poliçe metrekare '
         + 'üzerinden hesaplanır. Poliçeniz varsa güncel metrekare ve adresle '
         + 'eşleştiğini doğrulayın; yoksa bu ay yaptırın.',
  });
  if (skor.rezonans && skor.rezonans.yakinlik > 0.7) {
    ay.push({
      baslik: 'Değerlendirmede bunu mutlaka söyleyin',
      metin: `Bu zeminin tahmini titreşim periyodu ${skor.rezonans.Ts} saniye, `
           + `${girdi.kat} katlı bir binanınki kabaca ${skor.rezonans.Tb} saniye. `
           + 'İkisi birbirine yakın olduğunda bina zeminle aynı ritimde salınır '
           + 've zorlanma artar. Mühendise "zemin-yapı periyot uyumu" diye sorun.',
    });
  }

  /* ---- bu yıl / kalıcı ---- */
  if (fayP >= 14) {
    yil.push({
      baslik: 'Yakın fay ne demek, ne demek değil',
      metin: `En yakın bilinen fay ${a.fay.km.toFixed(1)} km uzakta (${a.fay.ad}). `
           + 'Yakınlık sarsıntının şiddetini artırır ama binanın dayanımı hâlâ '
           + 'daha belirleyicidir. Faya uzak olsaydınız da zayıf bina risklidir; '
           + 'faya yakın sağlam bina ise ayakta kalır. Enerjiyi binaya harcayın.',
    });
  }
  if (a.ilce && a.ilce.m2kisi && a.ilce.m2kisi < 15) {
    yil.push({
      baslik: `${a.ilce.ad}'de açık alan dar`,
      metin: `İlçenizde senaryo barınma ihtiyacı başına ${a.ilce.m2kisi} m² açık `
           + 'alan düşüyor (yalnızca İBB envanteri; okul bahçesi, ilçe parkları '
           + 'hariç — yani gerçek rakam biraz daha yüksek). Yine de dar. '
           + 'Şehir dışında kalabileceğiniz bir yer ve oraya nasıl gideceğiniz '
           + 'ailece konuşulmuş olsun.',
    });
  }
  yil.push({
    baslik: 'Yılda bir gözden geçirin',
    metin: 'Çantadaki ilaç ve pil tarihleri, sabitlemelerin gevşeyip gevşemediği, '
         + 'buluşma noktasının hâlâ uygun olup olmadığı. Takvime bir hatırlatma '
         + 'koyun.',
  });

  return {
    bugun, hafta, ay, yil,
    // en kritik tek cümle: kullanıcı sadece bunu okusa ne okumalı
    tekCumle: bilinmiyor
      ? 'Önce binanın yapım yılını öğrenin — en belirleyici bilgi bu ve '
        + 'yönetimden ruhsat tarihini istemek bir telefon sürüyor.'
      : eski
        ? 'Bu binanın yapısal durumunu bir uzmana baktırmadan geri kalan her şey '
          + 'eksik kalır — bu ay başlatın.'
        : zeminP >= 20
          ? 'Bina kuşağınız görece iyi; enerjinizi ev içindeki devrilecek eşyaya '
            + 've buluşma planına verin.'
          : 'Temel etkenler görece olumlu. Ev içi hazırlığı tamamlayıp yılda bir '
            + 'gözden geçirmek yeterli.',
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    SEVIYELER, YONETMELIK, EV_ICI, seviyeBul, vs30Oku, mesafeKm, cizgiyeMesafe,
    enYakinFay, ilceBul, enYakinTesis, enYakinYol, konumAnalizi, zeminPuani,
    fayPuani, katPuani, yapisalSkor, yapisalOlmayanSkor, eylemPlani,
  };
}
