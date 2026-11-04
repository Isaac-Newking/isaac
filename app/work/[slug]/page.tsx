import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WorldView from '@/components/WorldView';
import { WORLDS, getWorld } from '@/content/worlds';

export function generateStaticParams() {
  return WORLDS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = getWorld(slug);
  if (!w) return {};
  return { title: w.name, description: w.blurb, openGraph: { images: [w.pieces[0].src] } };
}

export default async function WorldPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = WORLDS.findIndex((w) => w.slug === slug);
  if (i < 0) notFound();
  return <WorldView index={i} />;
}
