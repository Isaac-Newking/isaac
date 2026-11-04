'use client';

import { useCallback } from 'react';
import HeroRoom from './HeroRoom';
import Loader from './Loader';

export default function Intro() {
  const done = useCallback(() => {}, []);
  return (
    <>
      <Loader onDone={done} />
      <HeroRoom />
    </>
  );
}
