import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorReveal } from "@/components/event-vendor/event-vendor-reveal";
import { EventVendorHeroMedia } from "@/components/event-vendor/event-vendor-hero-media";
import { resolveGalleryImage } from "@/lib/event-vendor-media";

export default function PublicEventVendorSitePage() {
  return (
    <EventVendorPageShell>
      {({ slug, data }) => {
        const base = `/e/${slug}`;
        const currency = data.business.currency ?? "EUR";
        const featured = data.site.gallery.slice(0, 3).map((g, i) => resolveGalleryImage(g, i));
        const services = data.services.slice(0, 3);

        return (
          <>
            <section className="ev-hero">
            <EventVendorHeroMedia data={data} className="ev-hero__media" />
              <div className="ev-hero__shade" />
              <div className="ev-hero__content">
                <p className="ev-hero__eyebrow">
                  {data.business.city ? `${data.business.city} · ` : ""}Event styling & decor
                </p>
                <h1 className="ev-hero__title">{data.site.heroTitle ?? data.business.name}</h1>
                <p className="ev-hero__subtitle">
                  {data.site.heroSubtitle ??
                    "Tell us your vision — we send a personalised quote within 24 hours."}
                </p>
                <div className="ev-hero__actions">
                  <Link href={`${base}/enquire`} className="ev-btn ev-btn--primary">
                    Plan your event
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={`${base}/gallery`} className="ev-btn ev-btn--outline">
                    View our work
                  </Link>
                </div>
              </div>
            </section>

            <EventVendorReveal>
              <section className="ev-section">
                <p className="ev-section__label">How it works</p>
                <h2 className="ev-section__title">From enquiry to booked — without the chaos</h2>
                <div className="ev-process">
                  {[
                    { n: "01", t: "Enquire", d: "Share your date, theme, and guest count in one form." },
                    { n: "02", t: "Quote", d: "We build a line-item quote from our catalogue." },
                    { n: "03", t: "Accept", d: "Review online, accept, and pay your deposit." },
                    { n: "04", t: "Celebrate", d: "We style your day — you enjoy the moment." },
                  ].map((step) => (
                    <div key={step.n} className="ev-process__step">
                      <p className="ev-process__num">{step.n}</p>
                      <p className="font-medium mt-2">{step.t}</p>
                      <p className="ev-muted mt-1">{step.d}</p>
                    </div>
                  ))}
                </div>
              </section>
            </EventVendorReveal>

            {featured.length > 0 ? (
              <EventVendorReveal delay={0.05}>
                <section className="ev-section pt-0">
                  <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                      <p className="ev-section__label">Portfolio</p>
                      <h2 className="ev-section__title mb-0">Recent celebrations</h2>
                    </div>
                    <Link
                      href={`${base}/gallery`}
                      className="text-sm font-medium text-amber-800 hover:underline shrink-0"
                    >
                      Full gallery →
                    </Link>
                  </div>
                  <div className="ev-grid-3">
                    {featured.map((g) => (
                      <article key={g.url} className="ev-card">
                        <img src={g.url} alt={g.caption ?? ""} loading="lazy" />
                        <div className="ev-card__body">
                          <p className="font-medium">{g.caption ?? "Event styling"}</p>
                          {g.eventType ? (
                            <p className="ev-muted text-sm capitalize">{g.eventType}</p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </EventVendorReveal>
            ) : null}

            {services.length > 0 ? (
              <EventVendorReveal delay={0.08}>
                <section className="ev-section bg-[#f5f0e8]/60">
                  <p className="ev-section__label">Services</p>
                  <h2 className="ev-section__title">What we create</h2>
                  <div className="ev-grid-3">
                    {services.map((svc) => (
                      <article key={svc.id} className="ev-card">
                        {svc.imageUrl ? <img src={svc.imageUrl} alt="" loading="lazy" /> : null}
                        <div className="ev-card__body">
                          <p className="font-medium">{svc.name}</p>
                          {svc.description ? (
                            <p className="ev-muted text-sm mt-1">{svc.description}</p>
                          ) : null}
                          <p className="text-sm font-medium mt-2 text-amber-900">
                            from {formatCurrency(svc.priceMinor, currency)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="mt-8">
                    <Link href={`${base}/services`} className="ev-btn ev-btn--outline !text-stone-800 !border-stone-300 !bg-white">
                      All services & pricing
                    </Link>
                  </div>
                </section>
              </EventVendorReveal>
            ) : null}

            {data.site.aboutText ? (
              <EventVendorReveal delay={0.1}>
                <section className="ev-section">
                  <p className="ev-section__label">About</p>
                  <h2 className="ev-section__title">Your day, styled with care</h2>
                  <p className="ev-muted max-w-2xl text-lg leading-relaxed">{data.site.aboutText}</p>
                  <Link
                    href={`${base}/about`}
                    className="inline-block mt-6 text-sm font-medium text-amber-800 hover:underline"
                  >
                    Our story →
                  </Link>
                </section>
              </EventVendorReveal>
            ) : null}

            <EventVendorReveal delay={0.12}>
              <section className="ev-cta-band">
                <p className="ev-section__label text-amber-200/80">Ready?</p>
                <h2 className="ev-section__title">Let&apos;s talk about your event</h2>
                <p className="ev-muted max-w-md mx-auto mb-6">
                  Weddings, birthdays, corporate — share your vision and we&apos;ll send a quote.
                </p>
                <Link href={`${base}/enquire`} className="ev-btn ev-btn--primary">
                  Start your enquiry
                </Link>
              </section>
            </EventVendorReveal>
          </>
        );
      }}
    </EventVendorPageShell>
  );
}
