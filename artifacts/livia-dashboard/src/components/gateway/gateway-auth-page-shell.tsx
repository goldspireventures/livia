import type { ReactNode } from "react";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { LiviaMark } from "@/components/brand/LiviaMark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HeaderAction = {
  href: string;
  label: string;
};

type Props = {
  title: string;
  subtitle?: string;
  headerAction?: HeaderAction;
  children: ReactNode;
  footer?: ReactNode;
  above?: ReactNode;
  below?: ReactNode;
  className?: string;
};

/** Shared gateway auth chrome — atmosphere without marketing copy walls. */
export function GatewayAuthPageShell({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  above,
  below,
  className,
}: Props) {
  return (
    <div className={cn("relative flex min-h-[100dvh] flex-col bg-background", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[22%] h-[min(640px,90vw)] w-[min(640px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/[0.12] blur-[120px]" />
        <div className="absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full bg-aurum-champagne/[0.06] blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <LiviaLogoLink size="md" home="marketing" />
        {headerAction ? (
          <a
            href={headerAction.href}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground min-h-[44px] inline-flex items-center"
          >
            {headerAction.label}
          </a>
        ) : null}
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md space-y-5">
          {above}
          <Card className="border-primary/15 bg-card/90 shadow-xl shadow-black/20 backdrop-blur-xl">
            <CardHeader className="items-center space-y-4 pb-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 shadow-inner">
                <LiviaMark className="h-9 w-9 text-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="font-serif text-2xl font-normal tracking-tight">{title}</CardTitle>
                {subtitle ? <CardDescription className="text-sm">{subtitle}</CardDescription> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">{children}</CardContent>
          </Card>

          {footer ? <div className="text-center">{footer}</div> : null}
          {below}
        </div>
      </main>
    </div>
  );
}
