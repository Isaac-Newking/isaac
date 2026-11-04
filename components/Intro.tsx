'use client';

import { useCallback, useState } from 'react';
import HeroRoom from './HeroRoom';
import Loader from './Loader';

export default function Intro() {
  const [ready, setReady] = useState(false);
  const done = useCallback(() => setReady(true), []);
  return (
    <>
      <Loader onDone={done} />
      <HeroRoom ready={ready} />
    </>
  );
}
