import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle } from "@/components/editorial-article";

const ENTRIES = [
  {
    date: "2026-05-25",
    title: "Running late & operator pack",
    body:
      "Staff can notify clients in one tap from Today or the booking. Business docs and starter templates help you go live faster. Hiring removed — grow via Team invite.",
  },
  { date: "2026-05-21", title: "Self-serve onboarding wizard", body: "12-step EU setup with progress tracking." },
  { date: "2026-05-20", title: "Booking wizard + client edit", body: "Dashboard and mobile parity for core CRUD." },
  { date: "2026-05-15", title: "Inngest reminders", body: "T-24h booking reminders via durable workflows." },
  { date: "2026-05-06", title: "Marketing honesty pass", body: "Claims aligned with product truth audit." },
  { date: "2026-05-27", title: "Editorial livia.io", body: "Home, DE, and inner pages — human rhythm, mobile nav, colleague positioning." },
];

export default function ChangelogPage() {
  return (
    <MarketingLayout>
      <EditorialArticle>
        <EditorialPageHeader
          title="Changelog"
          subtitle="What we ship to design partners — honest entries, not marketing vapor."
        />
        <div className="space-y-10 mt-12">
          {ENTRIES.map((e) => (
            <article key={e.date} className="border-l-2 border-aurora-cyan/30 pl-4 sm:pl-5">
              <time className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {e.date}
              </time>
              <h2 className="text-lg font-medium mt-2">{e.title}</h2>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{e.body}</p>
            </article>
          ))}
        </div>
      </EditorialArticle>
    </MarketingLayout>
  );
}
