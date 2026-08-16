import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FONT, RENK } from './tema';

const sinirli = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* Sahne kabı. Girişte ve çıkışta yumuşar; süreyi prop olarak alır çünkü
   Series içinde useVideoConfig kompozisyonun tamamını bildirir. */
export const Perde: React.FC<{
  sure: number;
  zemin?: string;
  children: React.ReactNode;
}> = ({ sure, zemin = RENK.zemin, children }) => {
  const kare = useCurrentFrame();
  const gorunurluk =
    interpolate(kare, [0, 12], [0, 1], sinirli) *
    interpolate(kare, [sure - 12, sure], [1, 0], sinirli);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: zemin,
        fontFamily: FONT,
        opacity: gorunurluk,
        justifyContent: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* Aşağıdan yaylanarak gelen metin. */
export const Yazi: React.FC<{
  gecikme?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ gecikme = 0, children, style }) => {
  const kare = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = spring({
    frame: kare - gecikme,
    fps,
    config: { damping: 200, mass: 0.6 },
  });

  return (
    <div
      style={{
        opacity: interpolate(kare - gecikme, [0, 10], [0, 1], sinirli),
        transform: `translateY(${interpolate(y, [0, 1], [26, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* Turuncu göz vurgusu — başlıkların altındaki kısa çizgi. */
export const Vurgu: React.FC<{ gecikme?: number; genislik?: number }> = ({
  gecikme = 0,
  genislik = 120,
}) => {
  const kare = useCurrentFrame();
  return (
    <div
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: RENK.turuncu,
        width: interpolate(kare - gecikme, [0, 20], [0, genislik], sinirli),
      }}
    />
  );
};

/* Ekran görüntüsü kartı: yuvarlatılmış çerçeve, gölge, hafif Ken Burns. */
export const Ekran: React.FC<{
  dosya: string;
  gecikme?: number;
  yakinlik?: number;
  kaydir?: number;
  style?: React.CSSProperties;
}> = ({ dosya, gecikme = 0, yakinlik = 0.02, kaydir = 0, style }) => {
  const kare = useCurrentFrame();
  const { fps } = useVideoConfig();
  const giris = spring({
    frame: kare - gecikme,
    fps,
    config: { damping: 200, mass: 0.8 },
  });
  const surukle = interpolate(kare - gecikme, [0, 240], [0, kaydir], sinirli);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${RENK.cizgi}`,
        boxShadow: '0 30px 70px rgba(18, 34, 58, 0.22)',
        backgroundColor: RENK.kart,
        opacity: interpolate(kare - gecikme, [0, 12], [0, 1], sinirli),
        transform: `translateY(${interpolate(giris, [0, 1], [40, 0])}px) scale(${interpolate(
          giris,
          [0, 1],
          [0.97, 1],
        ) + interpolate(kare - gecikme, [0, 240], [0, yakinlik], sinirli)})`,
        ...style,
      }}
    >
      <Img
        src={staticFile(`shots/${dosya}.png`)}
        style={{
          display: 'block',
          width: '100%',
          transform: `translateY(${-surukle}px)`,
        }}
      />
    </div>
  );
};

/* Sıfırdan hedefe sayan rakam. Binlik ayracı Türkçe biçiminde. */
export const Sayac: React.FC<{
  hedef: number;
  gecikme?: number;
  sure?: number;
}> = ({ hedef, gecikme = 0, sure = 45 }) => {
  const kare = useCurrentFrame();
  const deger = interpolate(kare - gecikme, [0, sure], [0, hedef], sinirli);
  return <>{Math.round(deger).toLocaleString('tr-TR')}</>;
};

/* Marmara'daki fay hattını andıran, soldan sağa çizilen kırık çizgi. */
export const FayCizgisi: React.FC<{ gecikme?: number; opaklik?: number }> = ({
  gecikme = 0,
  opaklik = 1,
}) => {
  const kare = useCurrentFrame();
  const cizim = interpolate(kare - gecikme, [0, 70], [0, 1], sinirli);

  const yollar = [
    { d: 'M0 128 L280 112 L520 150 L760 96 L1020 140 L1300 104 L1560 138 L1920 110', renk: RENK.turuncu, kalinlik: 4 },
    { d: 'M0 176 L240 196 L560 160 L840 202 L1140 168 L1420 200 L1700 172 L1920 190', renk: RENK.turuncu, kalinlik: 3 },
    { d: 'M0 92 L320 74 L640 108 L980 68 L1280 100 L1620 72 L1920 96', renk: '#c9b6a6', kalinlik: 2 },
  ];

  return (
    <svg
      width={1920}
      height={280}
      viewBox="0 0 1920 280"
      style={{ position: 'absolute', left: 0, opacity: opaklik }}
    >
      {yollar.map((y, i) => (
        <path
          key={i}
          d={y.d}
          fill="none"
          stroke={y.renk}
          strokeWidth={y.kalinlik}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.max(0, cizim - i * 0.12)}
        />
      ))}
    </svg>
  );
};

/* Küçük büyük harfli üst etiket. */
export const Etiket: React.FC<{ children: React.ReactNode; gecikme?: number }> = ({
  children,
  gecikme = 0,
}) => (
  <Yazi gecikme={gecikme}>
    <div
      style={{
        color: RENK.turuncu,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  </Yazi>
);
