import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Default max-w-3xl — chain uses lg */
  width?: "md" | "lg" | "full";
};

const WIDTH = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  full: "max-w-6xl",
} as const;

/** Consistent page rhythm: enter motion, width, bottom padding for mobile nav. */
export function PageFrame({ children, className, width = "md" }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6 pb-16 px-1",
        WIDTH[width],
        MOTION.enterPage,
        className,
      )}
    >
      {children}
    </div>
  );
}
