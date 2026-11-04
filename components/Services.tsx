'use client';

import { useEffect, useRef } from 'react';
import { SITE } from '@/content/site';
import { clamp } from '@/lib/pixel';

// The warped band from the PDF: the active service sits in a pinched lens, the grid behind
// bends away from it, and fast scrolling bends both further.
function warpMarkup(bend: number, lens: string) {
  const L = 15 + bend, C = 7.5 - bend * 0.35;
  let d = '';
  for (let i = -9; i <= 9; i++) {
    const y = 50 + i * 6.2, sgn = Math.sign(i) || 1, k = (bend + 6) * Math.exp(-Math.abs(i) / 4) * sgn;
    d += `<path d="M0 ${y} Q50 ${y - k} 100 ${y}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".45"/>`;
  }
  for (let i = 1; i < 12; i++) {
    const x = (i * 100) / 12, k = (x - 50) * (0.12 + bend * 0.006);
    d += `<path d="M${x} 0 C${x} 30 ${x - k} 40 ${x - k} 50 C${x - k} 60 ${x} 70 ${x} 100" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".35"/>`;
  }
  d += `<path d="M0 ${50 - L} Q50 ${50 + L - 2 * C} 100 ${50 - L} L100 ${50 + L} Q50 ${50 - L + 2 * C} 0 ${50 + L} Z" fill="${lens}"/>`;
  return d;
}

export default function Services() {
  const sec = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const idx = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0, lastY = scrollY, vel = 0;
    const frame = () => {
      const y = scrollY; vel += (y - lastY - vel) * 0.15; lastY = y;
      const r = sec.current!.getBoundingClientRect(), vh = innerHeight;
      if (r.top < vh && r.bottom > 0) {
        const n = SITE.services.length;
        const p = clamp(-r.top / (r.height - vh), 0, 1), a = p * (n - 1);
        const row = clamp(vh * 0.13, 64, 112), bend = clamp(Math.abs(vel) * 0.35, 0, 9);
        svg.current!.innerHTML = warpMarkup(bend, getComputedStyle(document.documentElement).getPropertyValue('--graphite'));
        items.current.forEach((el, i) => {
          if (!el) return;
          const d = i - a, ad = Math.abs(d), ang = clamp(d * 0.42, -1.5, 1.5);
          const sx = 1 + Math.max(0, 0.5 - ad) * 0.16 + (ad < 0.5 ? bend * 0.004 : 0);
          el.style.transform = `translateY(calc(-50% + ${Math.sin(ang) * row * 2.4}px)) scale(${sx}, ${Math.cos(ang)})`;
          el.style.opacity = String(clamp(1.15 - ad * 0.38, 0, 1));
          el.classList.toggle('on', ad < 0.5);
        });
        idx.current!.textContent = `${String(Math.round(a) + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="wheel" id="services" ref={sec} aria-label="Services">
      <div className="stick">
        <svg className="warp" ref={svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" />
        <h2 className="bubble lab">What I do</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {SITE.services.map((s, i) => <li key={s}><div className="item" ref={(el) => { items.current[i] = el; }}>{s}</div></li>)}
        </ul>
        <div className="idx" ref={idx}>01 / {String(SITE.services.length).padStart(2, '0')}</div>
      </div>
    </section>
  );
}
