import { cn } from "@/lib/utils";

type Props = {
  businessName: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  className?: string;
  size?: "sm" | "md";
};

/** Studio logo/cover on guest `/my` shop rows. */
export function GuestShopAvatar({
  businessName,
  imageUrl,
  logoUrl,
  className,
  size = "md",
}: Props) {
  const src = (imageUrl ?? logoUrl)?.trim() || null;
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const initial = (businessName.trim().charAt(0) || "S").toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          dim,
          "rounded-lg object-cover shrink-0 border border-border/50 bg-muted/30",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        dim,
        "rounded-lg shrink-0 flex items-center justify-center border border-border/50 bg-primary/10 text-sm font-medium text-primary",
        className,
      )}
      style={{ fontFamily: "var(--app-font-serif)" }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
