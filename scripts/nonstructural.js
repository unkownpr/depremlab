/* depremlab — yapısal olmayan risk kontrol listesi (v2).
 *
 * Tam 10 madde, brief §11 birebir.
 * Cevaplar: 'evet' | 'hayir' | 'emin_degilim' | 'gecerli_degil'
 * Yüzde hesaplaması: tamamlanan / uygulanabilir × 100
 */

const EV_ICI_KONTROL = [
  {
    id: 'mobilya',
    order: 1,
    question: 'Ağır mobilyalar (gardırop, kitaplık, vitrin ve dolap gibi) duvara sabitlenmiş mi?',
    riskReason: 'Devrilme ve ciddi yaralanma riski.',
    category: 'Mobilyalar',
    priority: 'high',
    actionTitle: 'Ağır mobilyaları uygun şekilde sabitleyin',
    actionDescription: 'Devrilebilecek tüm ağır mobilyaları duvara sabitleyin. Uygun sabitleme ürünleri (L profil, kayış) hırdavatçılarda bulunur. Duvarın yapısından emin değilseniz uygun bir uzmandan destek alın.',
    verificationTitle: 'Ağır mobilyaların duvara sabit olup olmadığını kontrol edin',
  },
  {
    id: 'cihaz',
    order: 2,
    question: 'Televizyon, buzdolabı ve çamaşır makinesi kaymayacak veya devrilmeyecek şekilde sabit mi?',
    riskReason: 'Kayma, devrilme ve çarpma riski.',
    category: 'Cihazlar',
    priority: 'high',
    actionTitle: 'Büyük cihazların sabitlemesini kontrol edin',
    actionDescription: 'Büyük cihazlar için uygun bağlama yöntemleri vardır. Üretici talimatlarına uyun. Nereye ve nasıl sabitleneceğini bilmiyor iseniz uygun bir uzmandan destek alın.',
    verificationTitle: 'Büyük cihazların sabitlemesini kontrol edin',
  },
  {
    id: 'raf',
    order: 3,
    question: 'Yüksek raflardaki ağır ve kırılabilir eşyalar alt raflara alındı mı?',
    riskReason: 'Düşen cisimler nedeniyle baş, göz ve kesilme yaralanması riski.',
    category: 'Düşebilecek eşyalar',
    priority: 'high',
    actionTitle: 'Ağır ve kırılabilir eşyaları alt raflara taşıyın',
    actionDescription: 'Yüksek raflardaki kitaplar, dekoratif eşyalar, tabaklar ve camlar alt raflara taşıyın. Üst rafları boş tutun veya hafif nesnelerle doldurun.',
    verificationTitle: 'Yüksek raflardaki ağır ve kırılabilir eşyaların yerini kontrol edin',
  },
  {
    id: 'kombi',
    order: 4,
    question: 'Şofben, kombi veya termosifon duvara ya da zemine uygun şekilde sabit mi?',
    riskReason: 'Devrilme, su veya gaz hattı hasarı ve yangın riski.',
    category: 'Tesisat ve cihazlar',
    priority: 'critical',
    actionTitle: 'Isıtma ve sıcak su cihazlarının bağlantılarını kontrol ettirin',
    actionDescription: 'Şofben, kombi ve termosifon devrilmeyecek şekilde sabitlenmiş olmalıdır. Bağlantı hatları sağlam olmalıdır. Bu işlem için uygun bir uzmandan destek alın.',
    verificationTitle: 'Isıtma ve sıcak su cihazlarının sabitlemesini kontrol ettirin',
    professionalSupport: true,
  },
  {
    id: 'avize',
    order: 5,
    question: 'Avize ve sarkan aydınlatmalar sağlam şekilde bağlı mı?',
    riskReason: 'Sarkan veya tavana bağlı cisimlerin düşme riski.',
    category: 'Aydınlatma',
    priority: 'high',
    actionTitle: 'Asılı aydınlatmaların bağlantılarını kontrol ettirin',
    actionDescription: 'Avize, lamba, dekoratif asılı cisimlerin bağlantılarını kontrol edin. Sağlam zincir, halat veya ray kullanıldığından emin olun. Bu işlem için uygun bir uzmandan destek alın.',
    verificationTitle: 'Asılı aydınlatmaların bağlantılarını kontrol ettirin',
    professionalSupport: true,
  },
  {
    id: 'yerlesim',
    order: 6,
    question: 'Yatak ve sık oturulan koltuklar, ağır eşya veya büyük pencere altından uzakta mı?',
    riskReason: 'Uyurken veya otururken düşen ve devrilen cisimlere maruz kalma riski.',
    category: 'Güvenli yerleşim',
    priority: 'high',
    actionTitle: 'Yatak ve oturma alanlarının konumunu güvenli hale getirin',
    actionDescription: 'Yatak ve sık oturulan koltukları ağır mobilya, raflı depo ve büyük pencerelerin altından çekin. Güvenli bir yer seçin.',
    verificationTitle: 'Yatak ve oturma alanlarının konumunu gözden geçirin',
  },
  {
    id: 'cikis',
    order: 7,
    question: 'Çıkış kapısına giden koridor ve kapı önü, devrilebilecek veya geçişi engelleyebilecek eşyalardan boş mu?',
    riskReason: 'Tahliye sırasında kaçış yolunun kapanması riski.',
    category: 'Kaçış yolu',
    priority: 'critical',
    actionTitle: 'Çıkış yolunu engellerden arındırın',
    actionDescription: 'Koridoru ve çıkış kapısı önünü temiz tutun. Herhangi bir eşya, ayakkabı raf, ya da diğer nesneler koridoru engellemesin. Dış kapıyı açmayı bilin.',
    verificationTitle: 'Çıkış yolunun boş olup olmadığını kontrol edin',
  },
  {
    id: 'mandal',
    order: 8,
    question: 'Mutfak ve banyo dolap kapaklarında açılmayı önleyen mandal veya kilit var mı?',
    riskReason: 'Cam, tabak ve diğer dolap içeriklerinin fırlaması veya düşmesi riski.',
    category: 'Dolaplar',
    priority: 'medium',
    actionTitle: 'Uygun dolap mandalları ekleyin',
    actionDescription: 'Mutfak ve banyo dolaplarına mandal veya kilit takın. Depremde dolaplar açılıp içerikleri fırlamayacak hale getirin.',
    verificationTitle: 'Dolap kapaklarında mandal olup olmadığını kontrol edin',
  },
  {
    id: 'kimyasal',
    order: 9,
    question: 'Kimyasal, deterjan ve yanıcı maddeler alt veya kapaklı dolaplarda saklanıyor mu?',
    riskReason: 'Dökülme, zehirlenme ve yangın riski.',
    category: 'Tehlikeli maddeler',
    priority: 'high',
    actionTitle: 'Kimyasal ve yanıcı maddeleri güvenli şekilde saklayın',
    actionDescription: 'Temizlik ürünleri, çamaşır suyu, benzin gibi maddeleri çocuk ve hayvanlar tarafından ulaşılamayacak, kapaklı alt dolaplarda saklayın.',
    verificationTitle: 'Kimyasal ve yanıcı maddelerin nerede saklandığını kontrol edin',
  },
  {
    id: 'canta',
    order: 10,
    question: 'Acil durum çantası ve el feneri kolay ulaşılır, evdeki herkesin bildiği bir yerde mi?',
    riskReason: 'Acil ihtiyaçlara erişememe ve hazırlıksız yakalanma riski.',
    category: 'Acil durum hazırlığı',
    priority: 'medium',
    actionTitle: 'Acil durum çantası ve el feneri için erişilebilir bir yer belirleyin',
    actionDescription: 'Çanta içine su, ilaç, pil, el feneri, düdük, kimlik fotokopisi ve nakit koyun. Kapıya yakın, herkesin bildiği bir yerde bulundurun. Yılda bir kontrol edin.',
    verificationTitle: 'Acil durum çantası ve el fenerinin yerini kontrol edin',
  },
];

/** Yanıtlanan soru sayısı (0..10) */
function yanitlananSayisi(cevaplar) {
  return Object.keys(cevaplar).length;
}

/** Geçerli madde sayısı ('gecerli_degil' hariç) */
function uygulanabilirSayisi(cevaplar) {
  return EV_ICI_KONTROL.filter(m => cevaplar[m.id] !== 'gecerli_degil').length;
}

/** Cevaplardan görev listesi oluştur. */
function gorevUret(cevaplar) {
  const gorevler = [];
  for (const madde of EV_ICI_KONTROL) {
    const cevap = cevaplar[madde.id];
    if (cevap === 'gecerli_degil') continue; // hiç görev yok
    if (cevap === 'evet') continue; // önlem alınmış, görev yok

    let tur, baslik, aciklama;
    if (cevap === 'hayir') {
      tur = 'duzeltme';
      baslik = madde.actionTitle;
      aciklama = madde.actionDescription;
    } else if (cevap === 'emin_degilim') {
      tur = 'dogrulama';
      baslik = madde.verificationTitle;
      aciklama = `Önce durumu kontrol edin. Önlem alınmamışsa: ${madde.actionDescription}`;
    } else {
      continue;
    }

    gorevler.push({
      id: madde.id,
      maddeId: madde.id,
      tur,
      baslik,
      aciklama,
      priority: madde.priority,
      category: madde.category,
      riskReason: madde.riskReason,
      professionalSupport: madde.professionalSupport || false,
      efor: madde.priority === 'critical' ? 'Hemen' : madde.priority === 'high' ? 'Bu hafta' : 'Bu ay',
      order: madde.order,
    });
  }

  // Sırala: critical → high → medium → order
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  gorevler.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 999;
    const pb = priorityOrder[b.priority] ?? 999;
    if (pa !== pb) return pa - pb;
    return a.order - b.order;
  });

  return gorevler;
}

/** Tamamlanan önlem sayısı */
/* Bir önlem iki yoldan "tamamlanmış" sayılır:
 *   - kullanıcı zaten 'evet' demiştir (önlem hâlihazırda alınmış), ya da
 *   - üretilen görevi sonradan tamamlandı olarak işaretlemiştir.
 * Madde başına bir kez sayılır; ikisi birden olsa da çift saymaz. */
function tamamlananOnlemSayisi(cevaplar, tamamlananIdler) {
  return EV_ICI_KONTROL.filter(m => {
    const c = cevaplar[m.id];
    if (c === undefined || c === 'gecerli_degil') return false;
    return c === 'evet' || tamamlananIdler.includes(m.id);
  }).length;
}

/** Tamamlanma yüzdesi (0..100 tam sayı). Uygulanabilir 0 ise 0 döndür. */
function tamamlanmaYuzdesi(cevaplar, tamamlananIdler) {
  const uygulanabilir = uygulanabilirSayisi(cevaplar);
  if (uygulanabilir === 0) return 0;
  const tamamlanan = tamamlananOnlemSayisi(cevaplar, tamamlananIdler);
  return Math.round((tamamlanan / uygulanabilir) * 100);
}

/** En fazla 3 görev (priority sırasıyla) */
function ilkUcGorev(gorevler, tamamlananIdler) {
  return gorevler
    .filter(g => !tamamlananIdler.includes(g.id))
    .slice(0, 3);
}

const YUZDE_ACIKLAMASI = 'Bu oran yalnızca kontrol listesindeki önlemlerin kaçının tamamlandığını gösterir. Evinizin genel güvenlik skoru değildir.';

if (typeof module !== 'undefined') {
  module.exports = {
    EV_ICI_KONTROL, yanitlananSayisi, uygulanabilirSayisi, gorevUret,
    tamamlananOnlemSayisi, tamamlanmaYuzdesi, ilkUcGorev, YUZDE_ACIKLAMASI,
  };
}
