# Per-cell economics + switching costs and aids — F6

**Status:** F6 (2026-05-07). Companion to `competitive-landscape.md`.

## Per-cell economics

Euro number on each cell's pain and on Livia's promise. Sourced from `.local/discovery-notes/web-research.md`. Numbers flagged `[VALIDATE]` are estimates pending design-partner confirmation.

### P1 Founder × C7 chain (3 shops, 60 staff)

**Pain euros (annual):**
- No-show revenue loss: 3 shops × ~€10,000/yr/shop = **€30,000/yr** (Phorest State of the Salon 2024 baseline).
- Missed-call bookings: 3 shops × ~€8-15k/yr = **€24-45k/yr** (IBISWorld 2024).
- Sunday-evening triage: ~90 min/wk × 50 wks × €150/hr = **~€11,250/yr** of Founder time.
- Cross-shop reporting manual rollup: ~6 hrs/quarter × 4 = ~€3,600/yr Founder time.
- Cross-shop staff-borrow inefficiency (manual coordination): ~€5-10k/yr in lost coverage.

**Total measurable pain:** ~**€75-100k/yr** for a 3-shop chain.

**Liv's promise (year 1, R3 baseline → R4 chain-level):**
- Voice answers ~70% of phone calls; recovers ~80% of missed-call bookings: **~€20-35k/yr recovered**.
- Sunday triage to ~25 min: **~€8k/yr saved**.
- Auto cross-shop rollup: **~€3.6k/yr saved**.
- Cross-shop staff-borrow auto-mediated: **~€3-7k/yr saved**.
- No-show reduction (deposit + soft-touch + waitlist recovery): ~30% reduction = **~€9k/yr recovered**.

**Total measurable Liv-value year 1:** **~€45-65k/yr.**

### P2a Owner-with-Mgr × C5 single-shop (14 staff)

**Pain (annual):**
- No-show: ~€10k/yr.
- Missed-call bookings: ~€6-12k/yr.
- Manager's cap-bound refund interruptions to Owner: ~30 min/week × 50 wks × €100/hr = **€2,500/yr** of Owner attention.
- Late-evening DM coverage by Manager: ~3 hrs/week × 50 wks = ~150 hrs of Manager time = **~€6k/yr**.

**Total:** **~€25-30k/yr.**

**Liv's promise:**
- Voice + missed-call recovery: ~€7k/yr.
- Refund-ladder + auto-routing: removes the Owner-attention cost.
- Late-evening DM handled: ~€6k/yr Manager time freed.
- No-show reduction: ~€3k/yr.

**Total Liv-value year 1:** **~€16-20k/yr.**

### P2b Owner-no-Mgr × C2-C4 (Conor, single-chair barbershop + apprentice)

**Pain (annual):**
- Missed-call bookings (the dominant pain): **~€8-15k/yr** (IBISWorld 2024 + r/barbershopmanagement aggregates).
- Excel admin time evenings: ~10 hrs/wk × 50 = 500 hrs at his chair-rate equivalent (~€40/hr) = **~€20k/yr** of his time.
- No-show + empty-slot loss: ~€4-7k/yr.

**Total:** **~€32-42k/yr.**

**Liv's promise (year 1, R3 → R5 by year-end):**
- Voice receptionist: **~€7-12k/yr** recovered (catches ~80% of missed calls).
- Cash close + admin to ~3 min/day: **~€18k/yr** of his time freed.
- No-show recovery: ~€3-5k/yr.
- **Year 1 total Liv-value: ~€28-35k/yr.**

For Conor specifically, the year-1 Liv-value is ~**€30k** vs a Liv-cost of ~**€2.5k/yr** (per F9 pricing). 12x ROI; payback in ~30 days.

### P2b × C10 Host (chair-rental barbershop, 4 renters)

**Pain (annual):**
- Friday rent collection time: ~1.5 hrs/wk × 50 = **~€3.75k/yr** of his time.
- Lost rent due to disputes: ~€500-2,000/yr [VALIDATE].
- Front-desk burden (his own + renters' walk-in inquiry): ~3 hrs/day × 6 days × 50 wks = **~€36k/yr** [the receptionist cost — currently borne by him directly].
- His own missed-call bookings (his own 2 chairs): ~€5-8k/yr.

**Total:** **~€45-50k/yr.**

**Liv's promise:**
- Auto-rent calculation + reminder: **~€3.75k/yr saved**.
- Voice receptionist + WhatsApp routing: **~€20-30k/yr** of receptionist-equivalent value (in lieu of hiring a receptionist).
- His own missed calls: ~€5-7k/yr.

**Total Liv-value year 1:** **~€28-40k/yr** (depending on whether he was already paying for partial reception).

### P3 Manager × C5

**Pain (Manager's experience):**
- Re-rota when a Senior calls in sick: ~3-5 hrs/week × 50 = ~150-250 hrs/yr.
- Cap-bound refund escalations: ~30 min/wk × 50 = ~25 hrs/yr.
- Late-evening DM coverage on her own time: ~3 hrs/wk × 50 = ~150 hrs/yr (technically her cost, not the salon's, but a retention risk).

**Total:** ~**325-425 hrs/yr** of Manager time (worth ~€8-15k/yr at her rate).

**Liv's promise:**
- Re-rota auto-drafted: ~120-200 hrs/yr saved.
- Refund-ladder removes the Owner-ping wait: ~25 hrs/yr immediate.
- Late-evening DM handled: ~150 hrs/yr of HER time saved.

**Total Liv-value year 1 in Manager-time terms:** **~280-400 hrs/yr.**

This is meaningful **for Manager retention.** The Manager-burnout pattern (work-week creep into evenings) is the single biggest cause of Manager turnover (cited in r/salonowners).

### P7 Customer (CT2 Regular)

**Pain:** Phone call durations to reschedule (~5-10 min); SMS chains across multiple staff to find a time; the awkward "leave a voicemail and wait" loop.

**Liv's promise:** 90-second WhatsApp reschedule. Voice line that recognises her by caller-id.

**Customer-side economic value:** difficult to quantify in euros; but customer NPS impact is the relevant signal. Web-research §1 + Treatwell Consumer Report 2023: under-35 customers strongly prefer DM over phone (~70-80%); a salon that responds in <30 sec on WhatsApp is meaningfully preferred over one that responds in 24h.

---

## Per-cell switching cost

What each cell loses leaving their current incumbent.

### Switching from Phorest

- **Customer history.** ~6,000-15,000 customers + 5+ years of bookings per chain. Phorest data export broker (Livia-side) handles this; 30-day reconciliation window.
- **Marketing automations.** Phorest's campaign templates + customer segments. Mostly NOT migrated (Bet 5: marketing-as-conversation; the campaign-blasts don't translate). Owners must consciously decide to drop the muscle memory.
- **Integrations.** Xero/Quickbooks; payment provider; Mailchimp. Re-integrated on Livia side; ~4-8 hours of concierge time.
- **Muscle memory.** 6 months of staff training.
- **Lock-in feeling.** Owners report Phorest "is hard to leave" — partly real (data complexity) and partly emotional (sunk cost).

**Switching cost (one-shot):** ~€500-1,500 in concierge time (Livia eats this for first 100 customers); ~2-6 weeks of parallel-run; ~3 months of Manager + STAFF retraining.

### Switching from Fresha

- **Customer history.** Less than Phorest typically (Fresha customers are newer). CSV-style export.
- **Marketplace exposure.** **Customer acquisition stops** if owner relied on Fresha marketplace. Significant — Owner must replace acquisition channel (this is a business-model conversation, not just a software switch). Some owners will stay on Fresha *for marketplace* and use Livia *for ops* during transition.
- **Payment-fees.** Fresha's payment-fees gone; Livia's payment fees instead (per F9 pricing).
- **Switching cost:** ~€200-500 concierge time.

### Switching from Booksy

- **Customer marketplace exposure.** Same issue as Fresha for barbers who acquire via Booksy.
- **Customer history.** Limited; CSV export.
- **Switching cost:** ~€200 concierge time.

### Switching from Square

- **Customer history.** Square API is rich; broker is robust.
- **Payment stack.** Square handles payments; Livia uses different provider (per F9 — Stripe IE primary). Owner must migrate payment stack.
- **Switching cost:** ~€300-800 concierge time + payment-stack migration.

### Switching from paper-and-Excel

- **No history.** Start clean.
- **Switching cost:** Zero technical; emotional cost is "I have to learn software." Onboarding budget extra reassurance + lighter feature defaults.

---

## Per-cell switching aid (Livia-built)

Each switching aid ranked by impact × effort.

| Aid | Impact | Effort | Priority |
|---|---|---|---|
| **Phorest data export broker** (Livia builds) | Very high — opens the dominant heartland | XL | v1 (built into onboarding) |
| **Concierge-managed migration** (Livia ops team) | Very high (eats the friction) | High (ops cost per customer) | v1 |
| **30-day parallel-run reconciliation tool** | High (reduces switching anxiety) | M | v1 |
| **Phorest read-only access for 90 days post-cutover** | Medium (peace of mind) | S | v1 |
| **"Liv learns from your last 90 days" first-week sprint** | High (Liv comes online with context) | L | v1 |
| **Square API broker** | Medium-high | L | v1 (US-adjacent solo customers) |
| **CSV importer (universal)** | Medium (catches the long tail) | S | v1 |
| **Fresha API broker** | Medium | L | v1.5 |
| **Booksy CSV-style importer** | Medium | M | v1 |
| **Vagaro / Acuity / Timely / Mindbody brokers** | Low-medium individually; sum is meaningful | M each | v2 |
| **Marketing-list import (with reason logging)** | Low (we don't want this culturally) | S | v1 explicit "do you really want to import this?" workflow |
| **Per-staff onboarding sprint (Liv-led)** | High (staff buy-in) | M | v1 |

---

## Failure modes today + in 6 months

### Per cell, where Livia lets them down today

| Cell | Today's failure mode |
|---|---|
| P1 Founder × C7 | Limited chain-rollup report depth (vs Phorest's 10-year head start). |
| P2a Owner-with-Mgr × C5 | Tight feature set vs Phorest's everything-and-the-kitchen-sink. |
| P2b × C2-C4 (Conor) | None significant — this is heartland. |
| P2b × C10 host | We're v1.5, not v1. He has to wait. |
| P3 Manager | Tight power-user features vs mature Phorest workflows. |
| P7 Customer | Voice modality scoped to single-vertical/single-locale at v1 — non-Hair/Beauty cells use SMS only. |
| Medspa, Allied health | We're v3 — they have to wait or stay on incumbents. |

### Per cell, where Livia will let them down in 6 months without intervention

- **Chain-rollup depth.** If we don't ship the next-3 chain reports by month 6, Founder-side R4 progression slows.
- **Voice expansion.** If we don't open Voice to a second locale or vertical by month 9, the wedge feels narrower than promised.
- **Phorest broker maturity.** If the broker has rough edges discovered in early migrations, word-of-mouth reverses fast. Mitigation: founder-led handling of first 10-20 migrations; broker becomes self-serve only after the rough edges are smoothed.
- **Cross-tenant intelligence latency.** Until we cross k≥10 in enough peer-sets, the insight panel is empty — feels like a missing feature rather than a privacy stance. Mitigation: clear "you're in a peer-set of N — insights begin at 10" framing.

These failure modes are the **engineering backlog** for F8 to read from.

---

## What this F6 economics-and-switching doc enables

- **F7 (already merged):** the wedge cells and "in its own league" bets stand on this evidence base.
- **F8 engineering blueprint:** prioritises the data brokers + the chain-rollup reports + the voice-stack robustness as the blocking bets.
- **F9 pricing:** the per-cell value numbers calibrate the price-points and packaging.
- **F10 hiring plan:** the concierge-onboarding requirement (especially for migrations) is the second-hire-after-engineer signal.
