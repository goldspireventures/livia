import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { verticalToneClass } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  vertical: string;
  className?: string;
};

/** Human label + subtle vertical tone — same Aurora shell, clear industry context. */
export function VerticalBadge({ vertical, className }: Props) {
  const pack = verticalPackUi(vertical);
  const tone = verticalToneClass(vertical);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
        tone,
        className,
      )}
    >
      {pack.label}
    </span>
  );
}
