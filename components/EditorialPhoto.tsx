import { cinemaEnabled } from '@/lib/visualPack';

const photos = {
  pizza: [900, 1600, '480'],
  table: [900, 1600, '480'],
  calzone: [900, 1600, '480'],
  service: [900, 1350, '480'],
  restaurant: [1200, 800, '640'],
  'hero-v2': [1280, 720, 'mobile'],
  'dining-v2': [1920, 1280, 'mobile'],
  'terrace-v2': [1920, 1280, 'mobile'],
} as const;

const fallbacks = {
  'hero-v2': { name: 'pizza', alt: '' },
  'dining-v2': { name: 'table', alt: 'Une table dressée avec deux assiettes de Pizza Zio.' },
  'terrace-v2': { name: 'restaurant', alt: 'La salle d’un restaurant Pizza Zio.' },
} as const;

type PhotoProps = { name: keyof typeof photos; alt: string; priority?: boolean; className?: string };

export default function EditorialPhoto({ name, alt, priority = false, className = '' }: PhotoProps) {
  if (!cinemaEnabled && (name === 'hero-v2' || name === 'dining-v2' || name === 'terrace-v2')) {
    const fallback = fallbacks[name];
    name = fallback.name;
    alt = fallback.alt;
  }
  const [width, height, size] = photos[name];
  return <picture className={'editorial-photo ' + className} data-photo>
    <source media="(max-width: 600px)" srcSet={`/images/zio-${name}-${size}.webp`} />
    {/* Pre-sized, local WebP variants are already optimized. A native image avoids Next’s CSP-blocked inline placeholder. */}
    <img src={`/images/zio-${name}.webp`} width={width} height={height} alt={alt}
      decoding="async" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
  </picture>;
}
