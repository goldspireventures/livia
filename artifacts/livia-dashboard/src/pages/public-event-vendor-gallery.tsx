import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorReveal } from "@/components/event-vendor/event-vendor-reveal";
import { resolveGalleryImage } from "@/lib/event-vendor-media";

export default function PublicEventVendorGalleryPage() {
  return (
    <EventVendorPageShell>
      {({ data }) => (
        <EventVendorReveal>
        <section className="ev-section">
          <p className="ev-section__label">Gallery</p>
          <h1 className="ev-section__title">Work we&apos;re proud of</h1>
          <p className="ev-muted max-w-2xl mb-8">
            Every event is bespoke — here&apos;s a taste of weddings, parties, and celebrations we&apos;ve styled.
          </p>
          <div className="ev-masonry">
            {data.site.gallery.map((g, i) => {
              const item = resolveGalleryImage(g, i);
              return (
              <figure key={`${item.url}-${i}`} className="ev-masonry__item ev-card">
                <img src={item.url} alt={item.caption ?? ""} loading="lazy" />
                {item.caption ? (
                  <figcaption className="ev-card__body text-sm font-medium">{item.caption}</figcaption>
                ) : null}
              </figure>
            );})}
          </div>
        </section>
        </EventVendorReveal>
      )}
    </EventVendorPageShell>
  );
}
