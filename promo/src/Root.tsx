import React from 'react';
import { Composition } from 'remotion';
import { TOPLAM, Tanitim } from './Tanitim';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Tanitim"
    component={Tanitim}
    durationInFrames={TOPLAM}
    fps={30}
    width={1920}
    height={1080}
  />
);
