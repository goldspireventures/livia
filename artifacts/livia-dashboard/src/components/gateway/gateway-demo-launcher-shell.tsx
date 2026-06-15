import { useEffect, type ReactNode } from "react";
import { applyGatewaySurfaceTheme } from "@/lib/gateway-surface-theme";
import { Link } from "wouter";
import {
  Compass,
  Lock,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  Vault,
} from "lucide-react";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { getMarketingOrigin } from "@/lib/surface-urls";
import { LiviaMark } from "@/components/brand/LiviaMark";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Founder / ops panel below the prospect grid */
  advanced?: ReactNode;
};

const RAIL: {
  id: string;
  label: string;
  icon: typeof Sparkles;
  active: boolean;
  locked?: boolean;
}[] = [
  { id: "worlds", label: "Worlds", icon: Sparkles, active: true },
  { id: "compass", label: "Compass", icon: Compass, active: false },
  { id: "messages", label: "Messages", icon: MessageSquare, active: false },
  { id: "profile", label: "Profile", icon: User, active: false },
  { id: "vault", label: "My Livia", icon: Vault, active: false, locked: true },
  { id: "settings", label: "Settings", icon: Settings, active: false },
];

/** W2 G1 — aurora gateway shell (matches g1-wedge-web.target.png). */
export function GatewayDemoLauncherShell({ children, advanced }: Props) {
  useEffect(() => {
    applyGatewaySurfaceTheme();
  }, []);

  return (
    <div className="gateway-g1-root min-h-[100dvh] text-foreground" data-testid="gateway-g1-launcher">
      <div className="gateway-g1-aurora" aria-hidden />
      <div className="gateway-g1-horizon" aria-hidden />
      <div className="gateway-g1-grain" aria-hidden />
      <div className="gateway-g1-vignette" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh]">
        <aside
          className="gateway-g1-rail hidden w-[72px] shrink-0 flex-col items-center border-r border-white/10 bg-black/35 py-6 backdrop-blur-md lg:flex xl:w-[88px]"
          aria-label="Gateway navigation"
        >
          <a
            href={getMarketingOrigin()}
            className="mb-8 inline-flex opacity-90 transition-opacity hover:opacity-100"
            aria-label="Livia home"
          >
            <LiviaMark className="h-8 w-8 text-aurum-champagne" />
          </a>
          <nav className="flex flex-1 flex-col items-center gap-2">
            {RAIL.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.id}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 px-1 py-2 text-[10px] tracking-wide",
                    item.active ? "text-primary" : "text-white/45",
                  )}
                  aria-current={item.active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                      item.active
                        ? "border-primary/50 bg-primary/15 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.55)]"
                        : "border-transparent bg-white/5",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-center leading-tight">{item.label}</span>
                  {item.locked ? <Lock className="h-2.5 w-2.5 opacity-50" aria-hidden /> : null}
                </span>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-2 pt-6 text-center">
            <LiviaMark className="h-7 w-7 opacity-80" />
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">North star</p>
            <p className="text-[9px] font-mono text-white/25">v0.1.0-demo</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
            <LiviaLogoLink size="lg" className="text-white" home="marketing" />
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                <Lock className="h-3 w-3" aria-hidden />
                Demo gateway
              </span>
              <span className="rounded-md border border-aurum-champagne/40 bg-aurum-champagne/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-aurum-champagne">
                G1 locked
              </span>
            </div>
          </header>

          <main className="flex-1 px-5 pb-8 sm:px-8 lg:px-10">{children}</main>

          {advanced ? (
            <section className="border-t border-white/10 bg-black/40 px-5 py-6 backdrop-blur-sm sm:px-8 lg:px-10">
              {advanced}
            </section>
          ) : null}

          <footer className="px-5 pb-8 pt-2 text-center sm:px-8 lg:px-10">
            <p className="font-serif text-sm text-white/50">
              <span className="text-white/70">One platform.</span>{" "}
              <span className="text-primary italic">Infinite</span> possibilities.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function GatewayG1Hero() {
  return (
    <div className="mb-8 max-w-3xl text-center lg:mb-10 lg:text-left">
      <h1
        className="font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]"
        data-testid="gateway-g1-title"
      >
        Pick <span className="text-primary italic">your</span> world
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
        Choose a trade to walk through as studio staff. Guest paths sit on each wedge&apos;s enter
        screen.
      </p>
    </div>
  );
}

export function GatewayG1SignInHint({
  devPassword,
}: {
  devPassword?: string;
}) {
  return (
    <p className="mb-6 text-center text-xs text-white/45 lg:text-left">
      {devPassword ? (
        <>
          Shared password: <code className="text-white/70">{devPassword}</code>
          {" · "}
        </>
      ) : null}
      <Link href="/sign-in?beta=1" className="text-primary/90 underline-offset-2 hover:underline">
        Sign in with your own account
      </Link>
    </p>
  );
}
