'use client';

import { useEffect, useRef } from 'react';

// 8-bit bust: '#' is a pixel. Rows 17 and below are the shoulders, drawn in the accent.
const AV = [
  '......########......', '....############....', '...##############...', '..################..', '..####........####..', '..###..........###..',
  '..##............##..', '..##..##....##..##..', '..##..##....##..##..', '..##............##..', '..##.....##.....##..', '...##..........##...',
  '...##...####...##...', '....##........##....', '.....##########.....', '.......######.......', '.......##..##.......', '....############....',
  '..################..', '.##################.', '.##################.', '####################', '####################', '####################',
];

export default function Avatar() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const c = ref.current; if (!c) return;
      const x = c.getContext('2d')!, cs = getComputedStyle(document.documentElement);
      x.clearRect(0, 0, 20, 24);
      AV.forEach((row, y) => [...row].forEach((ch, i) => {
        if (ch !== '#') return;
        x.fillStyle = y >= 17 ? cs.getPropertyValue('--signal') : cs.getPropertyValue('--fg');
        x.fillRect(i, y, 1, 1);
      }));
    };
    draw();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', draw); addEventListener('themechange', draw);
    return () => { mq.removeEventListener('change', draw); removeEventListener('themechange', draw); };
  }, []);
  return <canvas ref={ref} width={20} height={24} role="img" aria-label="Pixel avatar of Isaac" />;
}
