'use client';

import { useEffect, useRef, useState } from 'react';
import { clamp, reducedMotion } from '@/lib/pixel';

// A pixel stopwatch runs 0.00 → 1.10, then the screen dissolves in blocks. First visit per session only.
const FONT: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'], '.': ['0', '0', '0', '0', '1'],
};

export default function Loader({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [gone, setGone] = useState(false);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('in-intro') === '1'; } catch { /* storage blocked */ }
    if (reducedMotion() || seen) { setGone(true); onDone(); return; }
    const c = ref.current!, ctx = c.getContext('2d')!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const cell = Math.max(8, Math.round(Math.min(c.width / 34, c.height / 14)));
    const cols = Math.ceil(c.width / cell), rows = Math.ceil(c.height / cell);
    const RUN = 780, OUT = 320, t0 = performance.now();
    let finished = false, raf = 0;

    const drawTime = (v: number) => {
      const glyphs = [...v.toFixed(2)].map((ch) => FONT[ch]);
      const wCells = glyphs.reduce((n, g) => n + g[0].length + 1, -1);
      const x0 = Math.floor((cols - wCells) / 2), y0 = Math.floor((rows - 5) / 2);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) ctx.fillRect(x * cell + cell / 2 - 1, y * cell + cell / 2 - 1, 2, 2);
      let x = x0;
      ctx.fillStyle = '#FF9600';
      glyphs.forEach((g) => { g.forEach((row, ry) => [...row].forEach((b, rx) => { if (b === '1') ctx.fillRect((x + rx) * cell + 1, (y0 + ry) * cell + 1, cell - 2, cell - 2); })); x += g[0].length + 1; });
      const n = Math.round((v / 1.1) * wCells); ctx.fillStyle = '#fff';
      for (let i = 0; i < n; i++) ctx.fillRect((x0 + i) * cell + cell * 0.3, (y0 + 7) * cell + cell * 0.3, cell * 0.4, cell * 0.4);
    };
    const dissolve = () => {
      const order: [number, number, number][] = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) order.push([x, y, Math.random()]);
      order.sort((a, b) => a[2] - b[2]);
      const s = performance.now();
      c.parentElement!.style.background = 'transparent';
      const step = (now: number) => {
        const p = clamp((now - s) / OUT, 0, 1), k = Math.floor(p * order.length);
        for (let i = 0; i < k; i++) ctx.clearRect(order[i][0] * cell, order[i][1] * cell, cell, cell);
        if (p < 1) raf = requestAnimationFrame(step); else setGone(true);
      };
      raf = requestAnimationFrame(step);
    };
    const finish = () => {
      if (finished) return; finished = true;
      try { sessionStorage.setItem('in-intro', '1'); } catch { /* storage blocked */ }
      cancelAnimationFrame(raf); drawTime(1.1); dissolve(); onDone();
    };
    finishRef.current = finish;
    const tick = (now: number) => { if (finished) return; const p = clamp((now - t0) / RUN, 0, 1); drawTime(p * 1.1); if (p < 1) raf = requestAnimationFrame(tick); else finish(); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  if (gone) return null;
  return (
    <div className="loader" role="status" aria-label="Loading">
      <canvas ref={ref} />
      <button className="skip" type="button" onClick={() => finishRef.current()}>Skip</button>
    </div>
  );
}
