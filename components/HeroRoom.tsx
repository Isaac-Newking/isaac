'use client';

import { useEffect, useRef } from 'react';
import { findPiece } from '@/content/worlds';
import { SITE } from '@/content/site';
import { clamp, reducedMotion } from '@/lib/pixel';

// Work hung on the room's walls: [world, piece, side, depth px, top as share of viewport, width px]
const PLATES: [string, string, 'l' | 'r', number, number, number][] = [
  ['branding', 'eh-billboard', 'l', 520, 0.16, 360], ['fission', 'fission-jt-redo-2', 'r', 760, 0.2, 380],
  ['uiux', 'new-pairs', 'l', 1150, 0.5, 420], ['web3', 'launch-copy-ai', 'r', 1400, 0.48, 380],
  ['branding', 'eh-post2', 'l', 1800, 0.1, 260], ['flyers', 'joji-goe-to-japan-3', 'r', 2050, 0.12, 300],
  ['branding', 'eu-poster2', 'r', 2500, 0.4, 260], ['uiux', 'dappbuilder-2', 'l', 2700, 0.45, 420],
  ['fission', 'fission-tokenomics', 'r', 3100, 0.18, 400], ['web3', 'profit-ai-score', 'l', 3300, 0.2, 380],
];

export default function HeroRoom({ ready }: { ready: boolean }) {
  const hero = useRef<HTMLElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLCanvasElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLDivElement>(null);

  // Static-noise texture under the roles marquee, like the PDF
  useEffect(() => {
    const n = document.createElement('canvas'); n.width = n.height = 96; const x = n.getContext('2d')!;
    for (let i = 0; i < 1400; i++) { const v = (Math.random() * 255) | 0; x.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.5})`; x.fillRect((Math.random() * 96) | 0, (Math.random() * 96) | 0, 2, 2); }
    band.current!.style.backgroundImage = `url(${n.toDataURL()})`;
  }, []);

  // Title arrives through a pixel dissolve once the loader is done
  useEffect(() => {
    const c = cover.current!; const r = c.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = r.width * dpr; c.height = r.height * dpr; const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
    if (!ready) return;
    if (reducedMotion()) { ctx.clearRect(0, 0, c.width, c.height); return; }
    const cell = Math.round(18 * dpr), cols = Math.ceil(c.width / cell), rows = Math.ceil(c.height / cell);
    const order: [number, number, number][] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) order.push([x, y, Math.random() + (x / cols) * 0.9]);
    order.sort((a, b) => a[2] - b[2]);
    let k = 0, raf = 0; const per = Math.ceil(order.length / 34);
    const step = () => { for (let j = 0; j < per && k < order.length; j++, k++) ctx.clearRect(order[k][0] * cell, order[k][1] * cell, cell, cell); if (k < order.length) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // Camera zooms into the room on scroll; the mouse tilts it slightly
  useEffect(() => {
    let mx = 0, my = 0, smx = 0, smy = 0, raf = 0;
    const move = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; if (coords.current) coords.current.textContent = `x ${(mx + 0.5).toFixed(2)}  y ${(my + 0.5).toFixed(2)}`; };
    addEventListener('pointermove', move, { passive: true });
    const frame = () => {
      smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
      if (!hero.current || !room.current || !title.current) return;
      const hr = hero.current.getBoundingClientRect();
      if (hr.bottom > 0) {
        const p = clamp(-hr.top / (hr.height - innerHeight), 0, 1), e = p * p * (3 - 2 * p);
        room.current!.style.transform = `translateZ(${e * 3400}px) rotateY(${smx * 4}deg) rotateX(${-smy * 3}deg)`;
        title.current!.style.transform = `translate(calc(-50% + ${smx * -18}px), calc(-50% + ${smy * -12}px)) scale(${1 + p * 2.6})`;
        title.current!.style.opacity = String(clamp(1 - p * 2.6, 0, 1));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
  }, []);

  const roles = [...SITE.roles, ...SITE.roles, ...SITE.roles, ...SITE.roles];
  return (
    <section className="hero" ref={hero} aria-label="Intro">
      <div className="stage">
        <div className="room" ref={room}>
          <div className="face f-floor" /><div className="face f-ceil" />
          <div className="face f-left" /><div className="face f-right" />
          <div className="face f-back" />
          {PLATES.map(([w, key, side, z, top, width]) => {
            const p = findPiece(w, key);
            if (!p) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={key} src={p.src} alt="" className={`plate ${side}`} width={width} height={Math.round((width * p.h) / p.w)}
                style={{ width, transform: `translateY(${top * 100}vh) translateZ(${-z}px) rotateY(${side === 'l' ? 90 : -90}deg)` }} />
            );
          })}
        </div>
        <div className="corner">{SITE.email}</div>
        <div className="title" ref={title}>
          <div className="by">{SITE.name}</div>
          <h1><span>Design</span><span>Portfolio</span></h1>
          <div className="sticker">2026</div>
          <canvas ref={cover} aria-hidden="true" />
        </div>
        <div className="band" ref={band}>
          <div className="track">{roles.map((r, i) => <span key={i} style={{ display: 'contents' }}><span>{r}</span><i /></span>)}</div>
        </div>
        <div className="coords" ref={coords}>x 0.50  y 0.50</div>
        <div className="scrollhint">Scroll</div>
      </div>
    </section>
  );
}
