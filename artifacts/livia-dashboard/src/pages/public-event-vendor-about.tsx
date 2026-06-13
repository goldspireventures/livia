import { Link } from "wouter";
import { EventVendorHeroMedia } from "@/components/event-vendor/event-vendor-hero-media";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";

export default function PublicEventVendorAboutPage() {
  return (
    <EventVendorPageShell>
      {({ slug, data }) => (
        <>
          <section className="relative min-h-[40vh] flex items-end overflow-hidden">
            <EventVendorHeroMedia data={data} className="ev-hero__media absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
            <div className="relative ev-section py-16 text-white">
              <p className="ev-hero__eyebrow">About us</p>
              <h1 className="ev-hero__title text-4xl">{data.business.name}</h1>
            </div>
          </section>
          <section className="ev-section">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="ev-section__label">Our story</p>
                <p className="text-lg leading-relaxed ev-muted whitespace-pre-line">
                  {data.site.aboutText ??
                    `${data.business.name} is a Dublin event styling studio. We help couples and families turn venues into moments — balloons, backdrops, tablescapes, and the details guests remember.`}
                </p>
              </div>
              <div className="space-y-6">
                <div className="ev-card p-6">
                  <p className="ev-section__label">What we believe</p>
                  <ul className="space-y-3 ev-muted">
                    <li>· Every event deserves a cohesive look — not a pile of Pinterest screenshots.</li>
                    <li>· Clear quotes upfront — no surprise invoices after the confetti settles.</li>
                    <li>· WhatsApp-friendly, but professional — structured enquire, written quote, deposit to book.</li>
                  </ul>
                </div>
                <div className="ev-card p-6">
                  <p className="ev-section__label">Based in</p>
                  <p className="font-medium">{data.business.city ?? "Dublin"} & surrounding counties</p>
                  {data.business.instagramHandle ? (
                    <p className="ev-muted mt-2 text-sm">
                      Follow @{data.business.instagramHandle.replace(/^@/, "")} for latest installs.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-12">
              <Link href={`/e/${slug}/enquire`} className="ev-btn ev-btn--primary">
                Start an enquiry
              </Link>
            </div>
          </section>
        </>
      )}
    </EventVendorPageShell>
  );
}
