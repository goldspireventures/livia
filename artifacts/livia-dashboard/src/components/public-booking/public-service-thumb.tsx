import { useEffect, useState } from "react";
import { resolvePublicServiceImageUrl } from "@/lib/public-service-image";
import { cn } from "@/lib/utils";

type Props = {
  serviceName: string;
  vertical?: string | null;
  imageUrl?: string | null;
  className?: string;
};

function serviceInitial(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

/** Service card image with keyword fallback when URL is missing or fails to load. */
export function PublicServiceThumb({ serviceName, vertical, imageUrl, className }: Props) {
  const primary = resolvePublicServiceImageUrl(serviceName, vertical, imageUrl);
  const fallback = resolvePublicServiceImageUrl(serviceName, vertical, null);
  const [src, setSrc] = useState(primary ?? fallback);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const nextPrimary = resolvePublicServiceImageUrl(serviceName, vertical, imageUrl);
    const nextFallback = resolvePublicServiceImageUrl(serviceName, vertical, null);
    setSrc(nextPrimary ?? nextFallback);
    setFailed(false);
  }, [serviceName, vertical, imageUrl]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-primary/12 text-primary/85",
          className,
        )}
        aria-hidden
      >
        <span
          className="text-xl font-medium select-none"
          style={{ fontFamily: "var(--app-font-serif)" }}
        >
          {serviceInitial(serviceName)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      onError={() => {
        if (fallback && src !== fallback) {
          setSrc(fallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
