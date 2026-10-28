import Image from 'next/image';

type PhotoProps = {
  name: 'pizza' | 'table' | 'calzone' | 'service' | 'restaurant';
  alt: string;
  priority?: boolean;
  className?: string;
};

export default function EditorialPhoto({ name, alt, priority = false, className = '' }: PhotoProps) {
  const landscape = name === 'restaurant';
  const width = landscape ? 1200 : 900;
  const height = landscape ? 800 : name === 'service' ? 1350 : 1600;
  return <picture className={'editorial-photo ' + className} data-photo>
    <source media="(max-width: 600px)" srcSet={'/images/zio-' + name + '-' + (landscape ? 640 : 480) + '.webp'} />
    <Image src={'/images/zio-' + name + '.webp'} width={width} height={height} alt={alt}
      unoptimized loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
  </picture>;
}
