import React from 'react';
import { AbsoluteFill, Series, interpolate, useCurrentFrame } from 'remotion';
import { Ekran, Etiket, FayCizgisi, Perde, Sayac, Vurgu, Yazi } from './bilesenler';
import { FONT, RENK, fontYukle } from './tema';

fontYukle();

/* Sahne süreleri (30 fps). Toplam 1155 kare ≈ 38,5 saniye. */
export const SURELER = {
  acilis: 120,
  problem: 105,
  urun: 120,
  moduller: 135,
  bolgesel: 150,
  bina: 135,
  ev: 150,
  gizlilik: 120,
  kapanis: 120,
} as const;

export const TOPLAM = Object.values(SURELER).reduce((a, b) => a + b, 0);

const KENAR = 120;

const baslikStili: React.CSSProperties = {
  color: RENK.lacivert,
  fontSize: 84,
  fontWeight: 700,
  lineHeight: 1.08,
  letterSpacing: -1.5,
};

const govdeStili: React.CSSProperties = {
  color: RENK.soluk,
  fontSize: 30,
  lineHeight: 1.5,
};

/* 1 — Açılış. Koyu zemin, tek soru, altında çizilen fay hatları. */
const Acilis: React.FC = () => (
  <Perde sure={SURELER.acilis} zemin={RENK.koyu}>
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: KENAR, paddingRight: KENAR }}>
      <Yazi gecikme={6}>
        <div style={{ ...baslikStili, color: '#ffffff', fontSize: 116, maxWidth: 1400 }}>
          Depreme ne kadar hazırsın?
        </div>
      </Yazi>
      <Yazi gecikme={26}>
        <div style={{ ...govdeStili, color: '#b9c6d6', marginTop: 34, fontSize: 34 }}>
          İstanbul için bir deprem hazırlık değerlendirmesi.
        </div>
      </Yazi>
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 40 }}>
      <FayCizgisi gecikme={18} opaklik={0.85} />
    </AbsoluteFill>
  </Perde>
);

/* 2 — Problem. Veri bolluğu ile eylemsizlik arasındaki boşluk. */
const Problem: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <Perde sure={SURELER.problem}>
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: KENAR, paddingRight: KENAR }}>
        <Yazi gecikme={4}>
          <div style={{ ...baslikStili, fontSize: 76, color: RENK.soluk }}>
            Harita var. Rapor var. Haber var.
          </div>
        </Yazi>
        <Yazi gecikme={30}>
          <div style={{ ...baslikStili, fontSize: 94, marginTop: 28 }}>
            Peki bu hafta ne yapmalı?
          </div>
        </Yazi>
        <div style={{ marginTop: 40 }}>
          <Vurgu gecikme={52} genislik={220} />
        </div>
        <Yazi gecikme={58}>
          <div style={{ ...govdeStili, marginTop: 30, maxWidth: 1100, fontSize: 32 }}>
            Depreme hazırlık veri ile değil,{' '}
            <span style={{ color: RENK.lacivert, fontWeight: 700 }}>eylemle</span> başlar.
          </div>
        </Yazi>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: interpolate(kare, [0, 30], [0, 0.35], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          justifyContent: 'flex-end',
        }}
      >
        <FayCizgisi gecikme={0} opaklik={0.5} />
      </AbsoluteFill>
    </Perde>
  );
};

/* Ekran solda, metin sağda duran ortak yerleşim. */
const IkiSutun: React.FC<{
  sure: number;
  etiket: string;
  baslik: string;
  children: React.ReactNode;
  ekran: React.ReactNode;
  zemin?: string;
}> = ({ etiket, baslik, children, ekran, zemin, sure }) => (
  <Perde sure={sure} zemin={zemin}>
    <AbsoluteFill
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: KENAR,
        paddingRight: KENAR,
        gap: 80,
      }}
    >
      <div style={{ flex: '0 0 620px' }}>
        <Etiket gecikme={4}>{etiket}</Etiket>
        <Yazi gecikme={12}>
          <div style={{ ...baslikStili, fontSize: 66, marginTop: 18 }}>{baslik}</div>
        </Yazi>
        <div style={{ marginTop: 26 }}>
          <Vurgu gecikme={26} genislik={110} />
        </div>
        <div style={{ marginTop: 30 }}>{children}</div>
      </div>
      <div style={{ flex: 1 }}>{ekran}</div>
    </AbsoluteFill>
  </Perde>
);

/* 3 — Ürünün kendisi. */
const Urun: React.FC = () => (
  <IkiSutun
    sure={SURELER.urun}
    etiket="Deprem Rehberim"
    baslik="Tarayıcıda açılan bir hazırlık aracı"
    ekran={<Ekran dosya="01-hero" gecikme={10} yakinlik={0.03} />}
  >
    <Yazi gecikme={34}>
      <div style={govdeStili}>
        Kurulum yok, üyelik yok. Sorulara cevap verirsin, karşılığında bugün
        atabileceğin adımları görürsün.
      </div>
    </Yazi>
  </IkiSutun>
);

/* 4 — İki bağımsız modül. */
const Moduller: React.FC = () => (
  <IkiSutun
    sure={SURELER.moduller}
    etiket="İki modül"
    baslik="Binanı anla, evini hazırla"
    ekran={<Ekran dosya="02-moduller" gecikme={10} yakinlik={0.025} />}
  >
    {[
      ['Binanı Anla', 'Bina hakkında bildiklerini gözden geçirir, uzman değerlendirmesine ne kadar öncelik vermen gerektiğini gösterir. ~5 dakika.'],
      ['Evini Hazırla', 'Devrilebilecek, düşebilecek veya çıkışı kapatabilecek riskleri 10 soruda tarar. ~3 dakika.'],
    ].map(([ad, aciklama], i) => (
      <Yazi key={ad} gecikme={34 + i * 16}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ color: RENK.lacivert, fontSize: 32, fontWeight: 700 }}>{ad}</div>
          <div style={{ ...govdeStili, fontSize: 26, marginTop: 6 }}>{aciklama}</div>
        </div>
      </Yazi>
    ))}
    <Yazi gecikme={70}>
      <div style={{ ...govdeStili, fontSize: 24, fontStyle: 'italic' }}>
        İkisi bağımsız. İstediğinden başlarsın.
      </div>
    </Yazi>
  </IkiSutun>
);

/* 5 — Ardındaki açık veri. */
const Bolgesel: React.FC = () => {
  const veriler = [
    { sayi: 27600, ad: 'Vs30 zemin hücresi', kaynak: 'USGS Global Vs30' },
    { sayi: 926, ad: 'fay segmenti', kaynak: 'Türkiye diri fay verisi' },
    { sayi: 2015, ad: 'deprem kaydı', kaynak: 'USGS FDSN · 1905→' },
  ];

  return (
    <Perde sure={SURELER.bolgesel}>
      <AbsoluteFill style={{ paddingLeft: KENAR, paddingRight: KENAR, justifyContent: 'center' }}>
        <Etiket gecikme={4}>Bu sonuç neye dayanıyor</Etiket>
        <Yazi gecikme={12}>
          <div style={{ ...baslikStili, fontSize: 66, marginTop: 16 }}>
            Dört açık kaynak, hepsi indirilebilir
          </div>
        </Yazi>

        <div style={{ display: 'flex', gap: 28, marginTop: 44 }}>
          {veriler.map((v, i) => (
            <Yazi key={v.ad} gecikme={30 + i * 12} style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: RENK.kart,
                  border: `1px solid ${RENK.cizgi}`,
                  borderRadius: 14,
                  padding: '30px 32px',
                }}
              >
                <div style={{ color: RENK.turuncu, fontSize: 62, fontWeight: 700 }}>
                  <Sayac hedef={v.sayi} gecikme={36 + i * 12} />
                </div>
                <div style={{ color: RENK.lacivert, fontSize: 27, fontWeight: 600, marginTop: 8 }}>
                  {v.ad}
                </div>
                <div style={{ color: RENK.soluk, fontSize: 21, marginTop: 6 }}>{v.kaynak}</div>
              </div>
            </Yazi>
          ))}
        </div>

        <Ekran dosya="04-bolgesel" gecikme={62} kaydir={150} style={{ marginTop: 40, height: 300 }} />
      </AbsoluteFill>
    </Perde>
  );
};

/* 6 — Bina raporu ve 6306 yönlendirmesi. */
const Bina: React.FC = () => (
  <IkiSutun
    sure={SURELER.bina}
    etiket="Bina raporu"
    baslik="Skor değil, sonraki adım"
    ekran={<Ekran dosya="05-bina-raporu" gecikme={10} kaydir={180} style={{ height: 430 }} />}
  >
    <Yazi gecikme={34}>
      <div style={govdeStili}>
        0–100 arası bir puan üretmez. Hangi değerlendirmenin işine yarayacağını,
        6306 sürecinin nasıl işlediğini ve nereye başvurulacağını anlatır.
      </div>
    </Yazi>
    <Yazi gecikme={58}>
      <div
        style={{
          marginTop: 26,
          borderLeft: `4px solid ${RENK.turuncu}`,
          paddingLeft: 22,
          color: RENK.lacivert,
          fontSize: 26,
          lineHeight: 1.45,
          fontStyle: 'italic',
        }}
      >
        Bir anket binanın riskli olup olmadığını belirleyemez — ve bunu açıkça söyler.
      </div>
    </Yazi>
  </IkiSutun>
);

/* 7 — Ev raporu, mobil ve PDF. */
const Ev: React.FC = () => (
  <Perde sure={SURELER.ev}>
    <AbsoluteFill
      style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: KENAR, paddingRight: KENAR, gap: 70 }}
    >
      <div style={{ flex: '0 0 560px' }}>
        <Etiket gecikme={4}>Ev raporu</Etiket>
        <Yazi gecikme={12}>
          <div style={{ ...baslikStili, fontSize: 66, marginTop: 18 }}>
            Bugün yapılabilecek işler
          </div>
        </Yazi>
        <div style={{ marginTop: 26 }}>
          <Vurgu gecikme={26} genislik={110} />
        </div>
        <Yazi gecikme={34}>
          <div style={{ ...govdeStili, marginTop: 30 }}>
            Önlemler aciliyete göre sıralanır. Telefonda da açılır, çevrimdışı
            çalışır, PDF olarak indirilir.
          </div>
        </Yazi>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 34 }}>
        <Ekran dosya="07-ev-raporu" gecikme={12} kaydir={170} style={{ flex: 1, height: 470 }} />
        <Ekran dosya="10-mobil-rapor" gecikme={30} style={{ flex: '0 0 250px', height: 470 }} />
      </div>
    </AbsoluteFill>
  </Perde>
);

/* 8 — Gizlilik duruşu. */
const Gizlilik: React.FC = () => {
  const satirlar = [
    ['Sunucu yok.', 'Girdiğin hiçbir bilgi bir yere gönderilmez.'],
    ['Kayıt yok.', 'Üyelik, e-posta, telefon, TC kimlik istenmez.'],
    ['Depolama yok.', 'localStorage, çerez, IndexedDB kullanılmaz.'],
    ['Analitik yok.', 'İzleme pikseli ve analitik betiği yoktur.'],
  ];

  return (
    <Perde sure={SURELER.gizlilik} zemin={RENK.koyu}>
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: KENAR, paddingRight: KENAR }}>
        <Etiket gecikme={2}>Gizlilik</Etiket>
        <Yazi gecikme={10}>
          <div style={{ ...baslikStili, color: '#ffffff', fontSize: 72, marginTop: 16 }}>
            Sayfayı kapattığında hiçbir iz kalmaz
          </div>
        </Yazi>

        <div style={{ display: 'flex', gap: 26, marginTop: 52 }}>
          {satirlar.map(([ad, aciklama], i) => (
            <Yazi key={ad} gecikme={28 + i * 10} style={{ flex: 1 }}>
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 14,
                  padding: '28px 26px',
                  height: '100%',
                }}
              >
                <div style={{ color: RENK.turuncu, fontSize: 34, fontWeight: 700 }}>{ad}</div>
                <div style={{ color: '#b9c6d6', fontSize: 23, marginTop: 12, lineHeight: 1.45 }}>
                  {aciklama}
                </div>
              </div>
            </Yazi>
          ))}
        </div>
      </AbsoluteFill>
    </Perde>
  );
};

/* 9 — Kapanış. */
const Kapanis: React.FC = () => (
  <Perde sure={SURELER.kapanis}>
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Yazi gecikme={4}>
        <div style={{ ...baslikStili, fontSize: 96, textAlign: 'center' }}>Deprem Rehberim</div>
      </Yazi>
      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
        <Vurgu gecikme={20} genislik={180} />
      </div>
      <Yazi gecikme={30}>
        <div style={{ ...govdeStili, marginTop: 30, textAlign: 'center', fontSize: 34 }}>
          Açık kaynak · MIT · Sunucusuz statik PWA
        </div>
      </Yazi>
      <Yazi gecikme={48}>
        <div
          style={{
            marginTop: 40,
            backgroundColor: RENK.lacivert,
            color: '#ffffff',
            fontSize: 30,
            padding: '20px 40px',
            borderRadius: 10,
          }}
        >
          github.com/unkownpr/depremlab
        </div>
      </Yazi>
      <Yazi gecikme={62}>
        <div style={{ color: RENK.soluk, fontSize: 22, marginTop: 34, textAlign: 'center' }}>
          Bu araç resmî bina risk tespiti veya deprem performans analizi yerine geçmez.
        </div>
      </Yazi>
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <FayCizgisi gecikme={10} opaklik={0.45} />
    </AbsoluteFill>
  </Perde>
);

export const Tanitim: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: RENK.zemin, fontFamily: FONT }}>
    <Series>
      <Series.Sequence durationInFrames={SURELER.acilis}>
        <Acilis />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.problem}>
        <Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.urun}>
        <Urun />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.moduller}>
        <Moduller />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.bolgesel}>
        <Bolgesel />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.bina}>
        <Bina />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.ev}>
        <Ev />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.gizlilik}>
        <Gizlilik />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SURELER.kapanis}>
        <Kapanis />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
