import { useMemo, useState } from "react";
import { heroImageCandidates } from "@/lib/event-vendor-media";

type Props = {
  data: Parameters<typeof heroImageCandidates>[0];
  className?: string;
};

/** Hero photo with local bundled fallbacks when CMS/seed URLs 404. */
export function EventVendorHeroMedia({ data, className }: Props) {
  const candidates = useMemo(() => heroImageCandidates(data), [data]);
  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, candidates.length - 1)];

  return (
    <div className={className} aria-hidden>
      <img
        src={src}
        alt=""
        decoding="async"
        fetchPriority="high"
        onError={() => {
          setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
        }}
      />
    </div>
  );
}
