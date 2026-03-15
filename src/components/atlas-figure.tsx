import Image from 'next/image';

export function AtlasFigure({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="atlas-figure">
      <Image src={src} alt={alt} width={1200} height={600} />
    </figure>
  );
}
