import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorReveal } from "@/components/event-vendor/event-vendor-reveal";

const EVENT_TYPES = ["Wedding", "Birthday", "Corporate", "Christening", "Other"];

export default function PublicEventVendorEnquirePage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [preferredQuoteChannel, setPreferredQuoteChannel] = useState("email");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [plannerName, setPlannerName] = useState("");
  const [plannerEmail, setPlannerEmail] = useState("");
  const [plannerPhone, setPlannerPhone] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDateFlexible, setEventDateFlexible] = useState(false);
  const [guestCount, setGuestCount] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [theme, setTheme] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [servicesRequested, setServicesRequested] = useState<string[]>([]);
  const [inspirationUrl, setInspirationUrl] = useState("");

  return (
    <EventVendorPageShell>
      {({ slug, data }) => {
        const blocked = new Set(data.site.blockedDates ?? []);

        async function submit(e: React.FormEvent) {
          e.preventDefault();
          setSubmitting(true);
          setErr(null);
          try {
            const body = {
              contactName,
              contactEmail,
              contactPhone: contactPhone || undefined,
              partnerName: partnerName || undefined,
              plannerName: plannerName || undefined,
              plannerEmail: plannerEmail || undefined,
              plannerPhone: plannerPhone || undefined,
              eventType: eventType || undefined,
              eventDate: eventDate || undefined,
              eventDateFlexible,
              guestCount: guestCount ? Number(guestCount) : undefined,
              budgetRange: budgetRange || undefined,
              theme: theme || undefined,
              venue: venue || undefined,
              notes: notes || undefined,
              preferredQuoteChannel,
              servicesRequested,
              inspirationUrls: inspirationUrl ? [inspirationUrl] : [],
              source: "web",
            };
            const r = await fetch(`/api/public/${slug}/enquire`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!r.ok) {
              if (r.status === 404) throw new Error("That date may be unavailable — try another date.");
              throw new Error("Could not submit enquiry");
            }
            setDone(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : "Something went wrong");
          } finally {
            setSubmitting(false);
          }
        }

        function toggleService(name: string) {
          setServicesRequested((prev) =>
            prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
          );
        }

        if (done) {
          return (
            <EventVendorReveal>
              <section className="ev-section text-center py-16">
                <CheckCircle2 className="h-14 w-14 ev-form__success-icon mx-auto mb-5" />
                <h1 className="ev-section__title">Thank you — we&apos;ve got it</h1>
                <p className="ev-muted max-w-md mx-auto mb-8">
                  {data.business.name} will reply via{" "}
                  {preferredQuoteChannel === "whatsapp" ? "WhatsApp" : "email"} with a personalised quote.
                  No obligation until you accept.
                </p>
                <Link href={`/e/${slug}`} className="ev-btn ev-btn--primary">
                  Back to home
                </Link>
              </section>
            </EventVendorReveal>
          );
        }

        return (
          <section className="ev-section ev-enquire-wrap">
            <EventVendorReveal>
              <p className="ev-section__label">Enquire</p>
              <h1 className="ev-section__title">Start your quote</h1>
              <p className="ev-muted mb-8 max-w-lg">
                Three short sections — we&apos;ll follow up within 24 hours with a line-item quote you can
                accept online.
              </p>
            </EventVendorReveal>

            <EventVendorReveal delay={0.08}>
              <form onSubmit={(e) => void submit(e)} className="ev-form space-y-0">
                <div className="ev-form__section">
                  <h2 className="ev-form__heading">You</h2>
                  <p className="ev-form__hint">How we reach you with your quote.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="ev-field sm:col-span-2">
                      <label htmlFor="name">Full name *</label>
                      <input
                        id="name"
                        required
                        autoComplete="name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    <div className="ev-field">
                      <label htmlFor="email">Email *</label>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="ev-field">
                      <label htmlFor="phone">Phone (for WhatsApp quotes)</label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+353 …"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                    <div className="ev-field sm:col-span-2">
                      <label htmlFor="channel">Send quote via</label>
                      <select
                        id="channel"
                        value={preferredQuoteChannel}
                        onChange={(e) => setPreferredQuoteChannel(e.target.value)}
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="ev-form__section">
                  <h2 className="ev-form__heading">Your event</h2>
                  <p className="ev-form__hint">Date and scale help us price accurately.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="ev-field">
                      <label htmlFor="type">Event type</label>
                      <select
                        id="type"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                      >
                        <option value="">Select…</option>
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ev-field">
                      <label htmlFor="date">Event date</label>
                      <input
                        id="date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                      />
                      {eventDate && blocked.has(eventDate) ? (
                        <p className="ev-form__error">This date is fully booked — try another.</p>
                      ) : null}
                    </div>
                    <div className="ev-field sm:col-span-2">
                      <label className="ev-field__check">
                        <input
                          type="checkbox"
                          checked={eventDateFlexible}
                          onChange={(e) => setEventDateFlexible(e.target.checked)}
                        />
                        <span>My date is flexible</span>
                      </label>
                    </div>
                    <div className="ev-field">
                      <label htmlFor="guests">Approx. guests</label>
                      <input
                        id="guests"
                        type="number"
                        min={1}
                        placeholder="e.g. 80"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                      />
                    </div>
                    <div className="ev-field">
                      <label htmlFor="budget">Budget guide</label>
                      <input
                        id="budget"
                        placeholder="e.g. €2,000–€4,000"
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                      />
                    </div>
                    <div className="ev-field sm:col-span-2">
                      <label htmlFor="venue">Venue or area</label>
                      <input
                        id="venue"
                        placeholder="e.g. Powerscourt Estate, Co. Wicklow"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="ev-form__section">
                  <h2 className="ev-form__heading">Your vision</h2>
                  <p className="ev-form__hint">Optional — the more we know, the sharper the quote.</p>
                  <div className="grid gap-4">
                    <div className="ev-field">
                      <label htmlFor="theme">Theme or colour palette</label>
                      <input
                        id="theme"
                        placeholder="e.g. sage green & gold, romantic garden"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                      />
                    </div>

                    {data.services.length > 0 ? (
                      <div className="ev-field">
                        <span>Interested in</span>
                        <div className="ev-chip-row">
                          {data.services.map((s) => (
                            <button
                              key={s.name}
                              type="button"
                              className={`ev-chip ${servicesRequested.includes(s.name) ? "ev-chip--on" : ""}`}
                              onClick={() => toggleService(s.name)}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="ev-field">
                      <label htmlFor="notes">Anything else?</label>
                      <textarea
                        id="notes"
                        rows={3}
                        placeholder="Tell us what you're dreaming of — we'll ask follow-ups if needed."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="text-sm text-left text-amber-900/80 underline underline-offset-2 w-fit"
                      onClick={() => setShowExtras((v) => !v)}
                    >
                      {showExtras ? "Hide" : "Planning with a partner or coordinator?"}
                    </button>

                    {showExtras ? (
                      <div className="grid gap-4 sm:grid-cols-2 pt-1">
                        <div className="ev-field">
                          <label htmlFor="partner">Partner name</label>
                          <input
                            id="partner"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                          />
                        </div>
                        <div className="ev-field">
                          <label htmlFor="planner">Planner / coordinator</label>
                          <input
                            id="planner"
                            value={plannerName}
                            onChange={(e) => setPlannerName(e.target.value)}
                          />
                        </div>
                        <div className="ev-field">
                          <label htmlFor="planner-email">Planner email</label>
                          <input
                            id="planner-email"
                            type="email"
                            value={plannerEmail}
                            onChange={(e) => setPlannerEmail(e.target.value)}
                          />
                        </div>
                        <div className="ev-field">
                          <label htmlFor="planner-phone">Planner phone</label>
                          <input
                            id="planner-phone"
                            type="tel"
                            value={plannerPhone}
                            onChange={(e) => setPlannerPhone(e.target.value)}
                          />
                        </div>
                        <div className="ev-field sm:col-span-2">
                          <label htmlFor="inspo">Pinterest or mood board link</label>
                          <input
                            id="inspo"
                            type="url"
                            placeholder="https://…"
                            value={inspirationUrl}
                            onChange={(e) => setInspirationUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {err ? <p className="ev-form__error mb-4">{err}</p> : null}

                <button
                  type="submit"
                  className="ev-btn ev-btn--primary ev-form__submit mt-6"
                  disabled={submitting || Boolean(eventDate && blocked.has(eventDate))}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send enquiry"}
                </button>
                <p className="ev-muted text-xs text-center mt-4">
                  No payment now — you&apos;ll receive a written quote to review first.
                </p>
              </form>
            </EventVendorReveal>
          </section>
        );
      }}
    </EventVendorPageShell>
  );
}
