'use client';

import Lenis from 'lenis';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/pixel';

type Go = (href: string, color: string, x?: number, y?: number) => void;
type Shell = { go: Go; lenis: () => Lenis | null };

const ShellCtx = createContext<Shell>({ go: () => {}, lenis: () => null });
export const useShell = () => useContext(ShellCtx);

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ href: string; cells: HTMLElement[] } | null>(null);

  // Smooth scroll for the whole site
  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    let id = 0;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!a) return;
      const t = document.querySelector(a.getAttribute('href')!);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t as HTMLElement);
    };
    document.addEventListener('click', onClick);
    return () => { cancelAnimationFrame(id); document.removeEventListener('click', onClick); lenis.destroy(); lenisRef.current = null; };
  }, []);

  // Pixel wipe: squares flood out from the click point in the next page's colour
  const go = useCallback<Go>((href, color, ox = innerWidth / 2, oy = innerHeight / 2) => {
    const wipe = wipeRef.current;
    if (!wipe || reducedMotion()) { router.push(href); return; }
    const size = innerWidth < 700 ? 48 : 72;
    const cols = Math.ceil(innerWidth / size), rows = Math.ceil(innerHeight / size);
    wipe.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    wipe.style.gridTemplateRows = `repeat(${rows},1fr)`;
    wipe.style.setProperty('--wipe', color);
    wipe.innerHTML = '<b></b>'.repeat(cols * rows);
    const cells = Array.from(wipe.children) as HTMLElement[];
    const dist = cells.map((_, n) => Math.hypot((n % cols) * size - ox, ((n / cols) | 0) * size - oy) + Math.random() * size * 2.2);
    const max = Math.max(...dist);
    cells.forEach((el, n) => setTimeout(() => el.classList.add('on'), (dist[n] / max) * 380));
    router.prefetch(href);
    setTimeout(() => { pending.current = { href, cells }; router.push(href, { scroll: false }); }, 470);
  }, [router]);

  // When the new page is in, jump to its top (or its hash) and clear the squares
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    const hash = p.href.includes('#') ? p.href.slice(p.href.indexOf('#')) : '';
    requestAnimationFrame(() => {
      const target = hash ? document.querySelector(hash) as HTMLElement | null : null;
      const l = lenisRef.current;
      if (l) { l.resize(); l.scrollTo(target ?? 0, { immediate: true, force: true }); } else { target ? target.scrollIntoView() : window.scrollTo(0, 0); }
      p.cells.forEach((el) => setTimeout(() => el.classList.remove('on'), 60 + Math.random() * 360));
      setTimeout(() => { if (wipeRef.current) wipeRef.current.innerHTML = ''; }, 520);
    });
  }, [pathname]);

  return (
    <ShellCtx.Provider value={{ go, lenis: () => lenisRef.current }}>
      {children}
      <div className="wipe" ref={wipeRef} aria-hidden="true" />
    </ShellCtx.Provider>
  );
}
