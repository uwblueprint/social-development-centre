"use client";

import * as React from "react";
import { styled } from "next-yak";

/*
 * A listing's image as partner cards show it (owner): always exactly 16:9, a taupe ground
 * (--color-bg-hover is taupe-100) and the whole image inset at least 4px on every side, so any other
 * shape gets taupe bars. The image keeps its own box (not object-fit), so its 4px corners round the
 * picture itself. Pictures smaller than the frame aren't enlarged.
 */
const Frame = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  min-height: 0;
  overflow: hidden;
  background: var(--color-bg-hover);
`;

const Photo = styled.img`
  position: absolute;
  inset: var(--space-1);
  display: block;
  max-width: calc(100% - var(--space-2));
  max-height: calc(100% - var(--space-2));
  margin: auto;
  border-radius: var(--radius-sm);
`;

export function ImageMatte({
  src,
  alt = "",
  id,
  className,
  loading,
  fallback = null,
}: {
  src: string;
  alt?: string;
  id?: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Shown if the image fails to load (owner): cards pass the type's icon; panels and previews show nothing. */
  fallback?: React.ReactNode;
}) {
  const [failedSrc, setFailedSrc] = React.useState<string>();
  if (failedSrc === src) return <>{fallback}</>;
  return (
    <Frame className={className}>
      <Photo id={id} src={src} alt={alt} loading={loading} onError={() => setFailedSrc(src)} />
    </Frame>
  );
}
