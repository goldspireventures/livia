import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorReveal } from "@/components/event-vendor/event-vendor-reveal";
import { eventVendorPublicHref } from "@/lib/event-vendor-public-path";

export default function PublicEventVendorServicesPage() {
  return (
    <EventVendorPageShell>
      {({ slug, data }) => {
        const currency = data.business.currency ?? "EUR";
        return (
          <EventVendorReveal>
          <section className="ev-section">
            <p className="ev-section__label">Services & pricing</p>
            <h1 className="ev-section__title">Build your quote from our catalogue</h1>
            <p className="ev-muted max-w-2xl mb-10">
              Prices are starting points — your final quote depends on guest count, venue, and styling level.
              Everything is confirmed in writing before you book.
            </p>
            <div className="ev-services-list grid gap-3.5 md:grid-cols-2">
              {data.services.map((svc) => (
                <article key={svc.id} className="ev-services-card ev-card flex flex-col md:flex-row overflow-hidden">
                  {svc.imageUrl ? (
                    <img src={svc.imageUrl} alt="" className="object-cover shrink-0" />
                  ) : null}
                    <div className="ev-card__body flex-1">
                      {svc.category ? (
                        <p className="text-[10px] uppercase tracking-widest text-amber-800/80 mb-1">
                          {svc.category}
                        </p>
                      ) : null}
                      <h2 className="font-medium text-lg">{svc.name}</h2>
                      {svc.description ? (
                        <p className="ev-muted text-sm mt-2">{svc.description}</p>
                      ) : null}
                      <p className="mt-3 font-medium text-amber-900">
                        from {formatCurrency(svc.priceMinor, currency)}
                        {svc.quoteUnit === "per_guest"
                          ? " / guest"
                          : svc.quoteUnit === "per_table"
                            ? " / table"
                            : ""}
                      </p>
                    </div>
                </article>
              ))}
            </div>
            <div className="ev-cta-band ev-cta-band--inset mt-12">
              <h2 className="ev-section__title text-2xl">Not sure what you need?</h2>
              <p className="ev-muted text-stone-300 mb-4">Tell us about your event — we&apos;ll recommend a package.</p>
              <Link href={eventVendorPublicHref(slug, "/enquire")} className="ev-btn ev-btn--primary">
                Get a personalised quote
              </Link>
            </div>
          </section>
          </EventVendorReveal>
        );
      }}
    </EventVendorPageShell>
  );
}
