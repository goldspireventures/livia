import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { verticalHomeModules } from "@/lib/vertical-features";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { getVerticalPlaybook, resolveVerticalFromCategory, type BusinessVertical } from "@workspace/policy";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function VerticalHomeModules() {
  const { business } = useBusiness();
  const vertical = (business as { vertical?: string; category?: string } | undefined)?.vertical;
  const category = business?.category;
  const modules = verticalHomeModules(vertical, category);
  const vocab = verticalPackUi(vertical, category);
  const vKey = (vertical ?? resolveVerticalFromCategory(category)) as BusinessVertical;
  const playbook = getVerticalPlaybook(vKey);

  if (modules.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="vertical-home-modules">
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/10 px-4 py-3">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-aurora-cyan/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-aurora-violet/10 blur-2xl" />
        <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground relative">
          {vocab.label}
        </p>
        <h2 className="text-sm font-semibold tracking-tight relative mt-0.5">
          Built for your workflow
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed relative">
          {playbook.wedge}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <Link key={m.id} href={m.href}>
              <div
                data-testid={m.testId}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 backdrop-blur-sm px-3 py-3",
                  "hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm hover:shadow-primary/5",
                  "transition-all duration-300",
                  MOTION.listItem,
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary ring-1 ring-primary/10 group-hover:ring-primary/25 transition-all">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                    {m.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
