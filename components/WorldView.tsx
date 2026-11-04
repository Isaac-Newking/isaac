'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MOTION } from '@/content/site';
import { WORLDS, isLight, piecePalette, type Palette, type Piece, type World } from '@/content/worlds';
import { depixel, reducedMotion } from '@/lib/pixel';
import { useShell } from './SiteShell';

function setPalette(p: Palette) {
  const s = document.body.style;
  s.setProperty('--w-bg', p.bg); s.setProperty('--w-fg', p.fg); s.setProperty('--w-accent', p.accent); s.setProperty('--w-line', p.line);
  document.body.style.colorScheme = isLight(p.bg) ? 'light' : 'dark';
}

function Shot({ p, k, world }: { p: Piece; k: number; world: World }) {
  const px = (
    <div className="px" style={{ aspectRatio: `${p.w}/${p.h}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={`${world.name}: ${p.name}`} width={p.w} height={p.h} loading={k < 3 ? 'eager' : 'lazy'} decoding="async" />
      <canvas />
    </div>
  );
  let body = px;
  if (p.mock === 'browser') body = <div className={`m-browser${p.h / p.w > 1.4 ? ' tall' : ''}`}><div className="bar"><i /><i /><i /><span /></div>{px}</div>;
  if (p.mock === 'phone') body = <div className="m-phone">{px}</div>;
  if (p.mock === 'x') body = <div className="m-x">{px}<div className="prof"><span className="av" /><span className="fl">Follow</span><div className="ln" /><div className="ln" /></div></div>;
  const wide = p.w / p.h > 1.9 && p.mock !== 'x';
  return <figure className={`pc${wide ? ' wide' : ''}`} data-k={k}>{body}<figcaption>{p.name}</figcaption></figure>;
}

function Motion() {
  if (MOTION.length === 0) {
    return (
      <div className="motion"><div>
        <div className="play" aria-hidden="true">{'000000011000011100011110011100011000'.split('').map((b, i) => <i key={i} style={{ background: b === '1' ? 'var(--w-accent)' : 'transparent' }} />)}</div>
        <b>Esorae Home motion</b><p>Motion pieces play here as muted loops. Files to come.</p>
      </div></div>
    );
  }
  return <>{MOTION.map((m) => (
    <figure className="motion-vid" key={m.src}>
      <video src={m.src} poster={m.poster} width={m.w} height={m.h} muted loop playsInline preload="none" data-autoplay aria-label={m.title} />
      <figcaption>{m.title}</figcaption>
    </figure>
  ))}</>;
}

export default function WorldView({ index }: { index: number }) {
  const w = WORLDS[index];
  const next = WORLDS[(index + 1) % WORLDS.length];
  const { go } = useShell();
  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const now = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    document.body.classList.add('in-world'); setPalette(w.pal);
    const el = root.current!;

    // Images de-pixelate as they scroll in
    const io = new IntersectionObserver((es) => es.forEach(async (e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const box = e.target as HTMLElement, img = box.querySelector('img')!, c = box.querySelector('canvas')!;
      const r = box.getBoundingClientRect(); c.width = Math.max(1, Math.round(r.width)); c.height = Math.max(1, Math.round(r.height));
      try { await img.decode(); } catch { if (!img.complete) await new Promise((r2) => { img.onload = r2; }); }
      await depixel(c, img, { step: 58 }); box.classList.add('done');
    }), { rootMargin: '0px 0px -8% 0px' });
    el.querySelectorAll('.px').forEach((x) => io.observe(x));

    // Colours follow the piece in the middle of the screen; headings bring back the world palette
    const mid = { rootMargin: '-48% 0px -48% 0px' };
    const tint = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const p = w.pieces[Number((e.target as HTMLElement).dataset.k)];
      setPalette(piecePalette(w, p));
      if (now.current) now.current.textContent = p.group ? `${p.group}: ${p.name}` : p.name;
    }), mid);
    el.querySelectorAll('.pc').forEach((x) => tint.observe(x));
    const head = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setPalette(w.pal); if (now.current) now.current.textContent = ''; } }), mid);
    el.querySelectorAll('.whero, .grp-h').forEach((x) => head.observe(x));

    // Motion loops play only while on screen
    const vids = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) { v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.25 });
    el.querySelectorAll('video[data-autoplay]').forEach((x) => vids.observe(x));

    // Title decodes from 0s and 1s
    const t = title.current!, text = w.name;
    let n = 0, timer = 0 as unknown as ReturnType<typeof setTimeout>;
    if (!reducedMotion()) {
      const run = () => {
        t.innerHTML = [...text].map((ch, i) => (ch === ' ' ? ' ' : i < n ? ch : `<span class="bit">${Math.random() > 0.5 ? 1 : 0}</span>`)).join('');
        if (n++ <= text.length) timer = setTimeout(run, 48); else t.textContent = text;
      };
      run();
    }

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') go('/#work', w.pal.bg); };
    addEventListener('keydown', onKey);
    return () => {
      io.disconnect(); tint.disconnect(); head.disconnect(); vids.disconnect(); clearTimeout(timer); removeEventListener('keydown', onKey);
      document.body.classList.remove('in-world'); ['--w-bg', '--w-fg', '--w-accent', '--w-line'].forEach((k) => document.body.style.removeProperty(k)); document.body.style.colorScheme = '';
    };
  }, [w, go]);

  let k = 0;
  const meta: [string, string][] = [['Discipline', w.discipline], ['Pieces', String(w.pieces.length)], ['Year', w.year], ['Projects', w.projects]];
  return (
    <div ref={root}>
      <div className="wbar">
        <Link className="back" href="/#work" onClick={(e) => { e.preventDefault(); go('/#work', w.pal.bg); }}>← All work</Link>
        <span className="now" ref={now} />
        <span className="pos">{String(index + 1).padStart(2, '0')} / {String(WORLDS.length).padStart(2, '0')}</span>
      </div>
      <main className="wrap">
        <header className="whero">
          <div className="kind">{w.kind}</div>
          <h1 ref={title}>{w.name}</h1>
          <div className="wmeta">{meta.map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div>
          <p className="wblurb">{w.blurb}</p>
        </header>
        {w.groups ? w.groups.map((g, gi) => (
          <section className="grp" key={g.name}>
            <div className="grp-h">
              <div>{g.lead && <span className="lead">Lead project</span>}<h2>{g.name}</h2><p>{g.blurb}</p></div>
              <span className="n">{String(gi + 1).padStart(2, '0')} / {String(w.groups!.length).padStart(2, '0')}</span>
            </div>
            <div className="gal">
              {g.motion && <Motion />}
              {w.pieces.filter((p) => p.group === g.name).map((p) => <Shot key={p.src} p={p} k={k++} world={w} />)}
            </div>
          </section>
        )) : (
          <div className="gal" style={{ paddingTop: 24 }}>{w.pieces.map((p) => <Shot key={p.src} p={p} k={k++} world={w} />)}</div>
        )}
        <Link className="wnext" href={`/work/${next.slug}`} onClick={(e) => { e.preventDefault(); go(`/work/${next.slug}`, next.pal.accent, e.clientX, e.clientY); }}>
          <span>Next world</span><b>{next.name}</b>
        </Link>
      </main>
    </div>
  );
}
