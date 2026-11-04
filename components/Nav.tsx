'use client';

import Link from 'next/link';
import { SITE } from '@/content/site';

export default function Nav() {
  const toggle = () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', r.dataset.theme); } catch { /* storage blocked */ }
    window.dispatchEvent(new Event('themechange'));
  };
  return (
    <nav className="nav" aria-label="Main">
      <Link className="mark" href="/">{SITE.name}</Link>
      <ul>
        <li><a href="#work">Work</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <button className="theme" type="button" onClick={toggle} aria-label="Switch light or dark mode">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 0h2v3H7zM7 13h2v3H7zM0 7h3v2H0zM13 7h3v2h-3zM5 5h6v6H5zM2 2h2v2H2zM12 2h2v2h-2zM2 12h2v2H2zM12 12h2v2h-2z" /></svg>
      </button>
    </nav>
  );
}
