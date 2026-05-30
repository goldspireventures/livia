import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { applyExperienceTheme, applyPresentationTheme, clearExperienceTheme, clearPresentationTheme, publicExperienceClassNames, marketRibbon } from "@/lib/experience-theme";
import { playCelebrationChime, celebrationEnabled } from "@/lib/celebrate";
import { Link, useParams } from "wouter";
import {
  useGetPublicBusiness,
  useGetPublicSlots,
  useCreatePublicBooking,
} from "@workspace/api-client-react";
import { formatTime, formatDate, formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  MapPin,
  ChevronLeft,
  Calendar,
  CalendarPlus,
  Loader2,
} from "lucide-react";
const ChatWidget = lazy(() => import("@/components/chat-widget"));
import {
  PublicCustomerRitual,
  type PublicRitualStep,
} from "@/components/ritual/public-customer-ritual";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import { PublicBookingStickySummary } from "@/components/public-booking/public-booking-sticky-summary";
import { PublicBookingSummaryCard } from "@/components/public-booking/public-booking-summary-card";
import { PublicBookingTrustStrip } from "@/components/public-booking/public-booking-trust-strip";
import { PublicCareNotes } from "@/components/public-booking/public-care-notes";
import { PublicStaffStrip } from "@/components/public-booking/public-staff-strip";
import { PublicServiceCatalog } from "@/components/public-booking/public-service-catalog";
import { PublicStorefrontHero } from "@/components/public-booking/public-storefront-hero";
import { PublicSocialProofStrip } from "@/components/public-booking/public-social-proof";
import {
  formatPublicAddress,
  guardSectionTitle,
  guessMedspaProcedureCode,
  publicBookingLayout,
  verticalPublicCta,
  type PublicPolicyTrust,
  type PublicServiceRow,
} from "@/lib/public-booking-helpers";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { businessVocabulary } from "@workspace/policy";

type Step = "services" | "slots" | "details" | "consent" | "confirmed";

interface MedspaProcedure {
  code: string;
  label: string;
  summary: string;
  risksBullets: string[];
}

interface PublicService extends PublicServiceRow {}
interface PublicStaff {
  id: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  color?: string | null;
}
interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  category: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  instagramHandle: string | null;
  timezone: string;
  aiEnabled?: string;
  aiGreeting?: string | null;
  aiDisclosureChatFirstMessage?: string;
  aiDisclosureFooterLine?: string;
  bookingTermsBlock?: string;
  depositPolicySummary?: string;
  publicCta?: string;
  policyTrust?: PublicPolicyTrust;
  vertical?: string;
  country?: string | null;
  socialProof?: { rating: number; reviewCount: number; highlights: string[] };
  experienceSkin?: {
    shell: string;
    display: string;
    market: string;
    presentation?: string;
    brandAccentHex?: string | null;
  };
  bookingGuards?: BookingGuardField[];
  medspaProcedures?: MedspaProcedure[];
  regulatoryFooter?: string[];
  services: PublicService[];
  staff: PublicStaff[];
  countryPack?: {
    jurisdiction: string;
    publicBooking: {
      chooseService: string;
      pickTime: string;
      yourDetails: string;
      confirmBooking: string;
      closedHoliday: string;
    };
    upcomingHolidays?: Array<{ date: string; name: string }>;
    countryShowcaseNote?: string;
  };
}

interface BookingGuardField {
  id: string;
  label: string;
  type: "text" | "select" | "boolean";
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}
interface PublicSlot {
  startAt: string;
  endAt: string;
  available: boolean;
}
interface BookingConfirmation {
  bookingId: string;
  status: string;
  pendingReason?: string | null;
  startAt: string;
  endAt: string;
  serviceName: string;
  staffDisplayName: string | null;
  businessName: string;
  nextSteps?: string[];
  instagramDeepLink?: string | null;
  visitPath?: string | null;
  guestToken?: string | null;
  myLiviaPath?: string | null;
  savedToMyLivia?: boolean;
}

function buildIcsDataUri(args: {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
}): string {
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${Date.now()}@livia`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Livia//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(args.startAt)}`,
    `DTEND:${fmt(args.endAt)}`,
    `SUMMARY:${args.title}`,
    `DESCRIPTION:${args.description}`,
    `LOCATION:${args.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<Step>("services");
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0],
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [guardAnswers, setGuardAnswers] = useState<Record<string, string>>({});
  const [validationErr, setValidationErr] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [medspaProcedure, setMedspaProcedure] = useState("");
  const [consentSignature, setConsentSignature] = useState("");
  const [saveToMyLivia, setSaveToMyLivia] = useState(true);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [chatMount, setChatMount] = useState(false);

  const sl = slug ?? "";

  const { data: bizData, isLoading: isLoadingBiz } = useGetPublicBusiness(
    sl,
    { query: { enabled: !!sl } as any },
  );

  const { data: slotsData, isLoading: isLoadingSlots } = useGetPublicSlots(
    sl,
    {
      serviceId: selectedService?.id ?? "",
      date: selectedDate,
      staffId: selectedStaff || undefined,
    },
    {
      query: {
        enabled: !!sl && !!selectedService?.id && !!selectedDate && step === "slots",
      } as any,
    },
  );

  const createBooking = useCreatePublicBooking();

  const b = bizData as PublicBusiness | undefined;
  const slots = (slotsData as { slots?: PublicSlot[] } | undefined)?.slots ?? [];

  useEffect(() => {
    if (b?.vertical || b?.category || b?.country) {
      applyExperienceTheme({
        vertical: b?.vertical,
        category: b?.category,
        country: b?.country,
      });
    }
    return () => {
      clearExperienceTheme();
      clearPresentationTheme();
    };
  }, [b?.vertical, b?.category, b?.country]);

  useEffect(() => {
    if (b?.experienceSkin?.presentation || b?.experienceSkin?.brandAccentHex) {
      applyPresentationTheme({
        cssPreset: b.experienceSkin.presentation,
        brandAccentHex: b.experienceSkin.brandAccentHex,
      });
    }
  }, [b?.experienceSkin?.presentation, b?.experienceSkin?.brandAccentHex]);

  const aiOn = (b?.aiEnabled ?? "true") === "true";

  useEffect(() => {
    if (isLoadingBiz || !b || !aiOn || step === "confirmed") {
      setChatMount(false);
      return;
    }
    const schedule = () => setChatMount(true);
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(schedule, { timeout: 2000 });
      return () => win.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(schedule, 600);
    return () => window.clearTimeout(id);
  }, [isLoadingBiz, b, aiOn, step]);

  const availableSlots = useMemo(() => slots.filter((s) => s.available), [slots]);

  const vocab = useMemo(
    () => businessVocabulary(b?.vertical, b?.category),
    [b?.vertical, b?.category],
  );
  const needsMedspaConsent =
    b?.vertical === "medspa" && (b.medspaProcedures?.length ?? 0) > 0;
  const pb = b?.countryPack?.publicBooking;
  const chooseServiceTitle =
    pb?.chooseService ?? `Choose a ${vocab.serviceNoun.toLowerCase()}`;
  const confirmLabel = pb?.confirmBooking ?? "Confirm booking";
  const aiFooterLine = b?.aiDisclosureFooterLine?.trim() || null;
  const publicAddress = b ? formatPublicAddress(b) : null;
  const showStickyCta =
    (step === "details" || step === "consent") && !!selectedService && !!selectedSlot;
  const layout = publicBookingLayout(b?.vertical);
  const bookCta = b?.publicCta ?? verticalPublicCta(b?.vertical);
  const staffForward = layout === "staff-forward";

  useEffect(() => {
    if (step !== "consent" || !selectedService || !b?.medspaProcedures?.length) return;
    if (medspaProcedure) return;
    setMedspaProcedure(
      guessMedspaProcedureCode(selectedService.name, b.medspaProcedures),
    );
  }, [step, selectedService, b?.medspaProcedures, medspaProcedure]);

  function handleBook() {
    setValidationErr(null);
    if (!sl || !selectedService || !selectedSlot || !firstName.trim()) return;

    if (!email.trim() && !phone.trim()) {
      setValidationErr("Please add an email or phone number so we can reach you.");
      return;
    }

    for (const g of b?.bookingGuards ?? []) {
      if (g.required && !guardAnswers[g.id]?.trim()) {
        setValidationErr(`Please complete: ${g.label}`);
        return;
      }
    }

    const isMedspa = b?.vertical === "medspa";
    if (isMedspa && (!medspaProcedure || !consentAgreed || !consentSignature.trim())) {
      setValidationErr("Select a procedure, read the risks, and sign with your full name.");
      return;
    }

    createBooking.mutate(
      {
        slug: sl,
        data: {
          serviceId: selectedService.id,
          staffId: selectedStaff || undefined,
          startAt: selectedSlot,
          customerFirstName: firstName.trim(),
          customerLastName: lastName.trim() || undefined,
          customerEmail: email.trim() || undefined,
          customerPhone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          saveToMyLivia: saveToMyLivia && Boolean(phone.trim()),
          ...(Object.keys(guardAnswers).length ? { guardAnswers } : {}),
          ...(isMedspa
            ? {
                medspaConsent: {
                  procedureCode: medspaProcedure,
                  signatureName: consentSignature.trim(),
                },
              }
            : {}),
        } as Parameters<typeof createBooking.mutate>[0]["data"],
      },
      {
        onSuccess: (data) => {
          setConfirmation(data as BookingConfirmation);
          setStep("confirmed");
          // Champagne shimmer + soft chime — gated by reduced-motion + opt-out.
          playCelebrationChime();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Slot no longer available";
          setValidationErr(msg);
          setStep("slots");
          setSelectedSlot("");
        },
      },
    );
  }

  function resetFlow() {
    setStep("services");
    setSelectedService(null);
    setSelectedSlot("");
    setSelectedStaff("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setGuardAnswers({});
    setValidationErr(null);
    setConfirmation(null);
  }

  if (isLoadingBiz) {
    return <PublicSurfaceLoading />;
  }

  if (!b) {
    return (
      <PublicSurfaceNotFound
        title="Business not found"
        detail="This booking page doesn't exist, or the link may be outdated."
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-background ${publicExperienceClassNames({
        vertical: b.vertical,
        category: b.category,
        country: b.country,
        experienceSkin: b.experienceSkin,
      })}${showStickyCta ? " has-sticky-cta" : ""}`}
    >
      {b.coverImageUrl ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-52 -z-0 overflow-hidden public-booking-cover"
          aria-hidden
        >
          <img
            src={b.coverImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-50"
          />
        </div>
      ) : null}
      <div
        className="public-booking-hero pointer-events-none absolute inset-x-0 top-0 h-48 -z-0"
        aria-hidden
      />
      <main className="max-w-xl mx-auto px-4 py-8 pb-24 relative z-10">
        <PublicCustomerRitual
          businessName={b.name}
          city={b.city ? `${b.city}` : null}
          step={step as PublicRitualStep}
          aiGreeting={b.aiGreeting}
          verticalLabel={verticalPackUi(b.vertical, b.category).label}
          logoUrl={b.logoUrl}
          description={b.description}
          serviceStepLabel={vocab.serviceNoun}
          includeConsentStep={needsMedspaConsent}
          tagline={vocab.hint}
        />
        {publicAddress ? (
          <p className="text-xs text-muted-foreground text-center -mt-2 mb-4 flex items-start justify-center gap-1.5 max-w-md mx-auto px-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
            <span>{publicAddress}</span>
          </p>
        ) : null}
        {step === "services" ? (
          <PublicBookingTrustStrip
            depositPolicySummary={b.depositPolicySummary}
            policyTrust={b.policyTrust}
          />
        ) : null}
        {b.countryPack?.countryShowcaseNote ? (
          <p className="text-[11px] text-muted-foreground/80 mb-4 text-center max-w-md mx-auto">
            {b.countryPack.countryShowcaseNote}
          </p>
        ) : null}
        {b.countryPack?.upcomingHolidays && b.countryPack.upcomingHolidays.length > 0 ? (
          <p className="text-[11px] text-muted-foreground mb-4 text-center">
            Upcoming closure: {b.countryPack.upcomingHolidays[0].name} ({b.countryPack.upcomingHolidays[0].date})
          </p>
        ) : null}

        {step === "services" && (
          <PublicStorefrontHero
            name={b.name}
            description={b.description}
            city={b.city}
            vertical={b.vertical}
            category={b.category}
            logoUrl={b.logoUrl}
            coverImageUrl={b.coverImageUrl}
            instagramHandle={b.instagramHandle}
            publicCta={bookCta}
            publicAddress={publicAddress}
            onPrimaryAction={() => {
              document.getElementById("public-service-menu")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* Step: Services */}
        {step === "services" && (
          <div
            id="public-service-menu"
            className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {staffForward ? (
              <PublicStaffStrip
                staff={b.staff}
                selectedStaffId={selectedStaff}
                onSelect={setSelectedStaff}
                teamNoun={vocab.teamNoun}
              />
            ) : null}
            {marketRibbon(b.country, b.experienceSkin) ? (
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 text-center -mt-2 mb-2">
                {marketRibbon(b.country, b.experienceSkin)}
              </p>
            ) : null}
            <PublicSocialProofStrip proof={b.socialProof} />
            <PublicCareNotes vertical={b.vertical} />
            <h2 className="text-lg font-semibold">{chooseServiceTitle}</h2>
            <PublicServiceCatalog
              services={b.services}
              vertical={b.vertical}
              bookCta={bookCta}
              onSelect={(svc) => {
                setSelectedService(svc);
                setStep("slots");
              }}
            />
          </div>
        )}

        {/* Step: Slots */}
        {step === "slots" && selectedService && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to services" onClick={() => setStep("services")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">{selectedService.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedService.durationMinutes} min ·{" "}
                  {formatCurrency(selectedService.priceMinor, selectedService.currency)}
                </p>
              </div>
            </div>

            {b.staff.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="public-staff">{vocab.teamNoun} member</Label>
                <Select
                  value={selectedStaff || "any"}
                  onValueChange={(v) => setSelectedStaff(v === "any" ? "" : v)}
                >
                  <SelectTrigger
                    id="public-staff"
                    data-testid="select-staff"
                    aria-label={`Select ${vocab.teamNoun.toLowerCase()} member`}
                  >
                    <SelectValue placeholder="Any available" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any available</SelectItem>
                    {b.staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="public-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                Select date
              </Label>
              <Input
                id="public-date"
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                data-testid="input-date"
                aria-label="Appointment date"
              />
            </div>

            {validationErr && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {validationErr}
              </div>
            )}

            {isLoadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6 border rounded-md">
                No available times on this date
              </p>
            ) : (
              <div>
                <Label className="mb-2 block">
                  {b.countryPack?.publicBooking.pickTime ?? "Pick a time"}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startAt}
                      type="button"
                      data-testid={`button-slot-${slot.startAt}`}
                      onClick={() => {
                        setSelectedSlot(slot.startAt);
                        setStep("details");
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        selectedSlot === slot.startAt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {formatTime(slot.startAt)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && selectedService && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 relative">
            {createBooking.isPending && (
              <div className="absolute inset-0 -m-4 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Booking your slot...</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to time slots" onClick={() => setStep("slots")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">
                  {b.countryPack?.publicBooking.yourDetails ?? "Your details"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedService.name} · {formatDate(selectedSlot)} at{" "}
                  {formatTime(selectedSlot)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="public-first-name">First name *</Label>
                  <Input
                    id="public-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    data-testid="input-first-name"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public-last-name">Last name</Label>
                  <Input
                    id="public-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    data-testid="input-last-name"
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Email <span className="text-muted-foreground text-xs">(or phone)</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Phone <span className="text-muted-foreground text-xs">(or email)</span>
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  data-testid="input-phone"
                />
              </div>
              {phone.trim() ? (
                <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer">
                  <Checkbox
                    checked={saveToMyLivia}
                    onCheckedChange={(v) => setSaveToMyLivia(v === true)}
                    data-testid="save-to-my-livia"
                  />
                  <span className="text-sm leading-snug">
                    <span className="font-medium">Save to My Livia</span>
                    <span className="block text-muted-foreground text-xs mt-0.5">
                      View all your bookings in one place — verify with a quick code after booking.
                    </span>
                  </span>
                </label>
              ) : null}
              {(b?.bookingGuards?.length ?? 0) > 0 && (
                <div
                  className="space-y-3 rounded-lg border border-primary/20 p-4 bg-primary/5"
                  data-testid="public-booking-guards"
                >
                  <p className="text-sm font-medium">{guardSectionTitle(b.vertical)}</p>
                  {b!.bookingGuards!.map((g) => (
                    <div key={g.id} className="space-y-1.5">
                      <Label>
                        {g.label}
                        {g.required ? " *" : ""}
                      </Label>
                      {g.type === "select" && g.options ? (
                        <Select
                          value={guardAnswers[g.id] ?? ""}
                          onValueChange={(v) =>
                            setGuardAnswers((prev) => ({ ...prev, [g.id]: v }))
                          }
                        >
                          <SelectTrigger
                            data-testid={`guard-${g.id}`}
                            aria-label={g.label}
                          >
                            <SelectValue placeholder="Choose…" />
                          </SelectTrigger>
                          <SelectContent>
                            {g.options.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={guardAnswers[g.id] ?? ""}
                          onChange={(e) =>
                            setGuardAnswers((prev) => ({ ...prev, [g.id]: e.target.value }))
                          }
                          data-testid={`guard-${g.id}`}
                          aria-label={g.label}
                        />
                      )}
                      {g.helpText ? (
                        <p className="text-xs text-muted-foreground">{g.helpText}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes for the team (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any preferences, allergies, parking needs..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              {validationErr && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  {validationErr}
                </div>
              )}

              <PublicBookingSummaryCard
                className="hidden md:block bg-muted/50"
                serviceName={selectedService.name}
                startAt={selectedSlot}
                durationMinutes={selectedService.durationMinutes}
                priceMinor={selectedService.priceMinor}
                currency={selectedService.currency}
                serviceNoun={vocab.serviceNoun}
              />

              {b.bookingTermsBlock && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {b.bookingTermsBlock}
                </p>
              )}

              <Button
                className="w-full hidden md:flex"
                disabled={!firstName.trim()}
                onClick={() => {
                  setValidationErr(null);
                  if (needsMedspaConsent) {
                    setStep("consent");
                  } else {
                    handleBook();
                  }
                }}
                data-testid="button-continue-booking"
              >
                {needsMedspaConsent ? "Continue to consent" : confirmLabel}
              </Button>
            </div>
          </div>
        )}

        {step === "consent" && selectedService && b.medspaProcedures && (
          <section
            className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
            aria-labelledby="consent-heading"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to your details" onClick={() => setStep("details")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 id="consent-heading" className="text-lg font-semibold">
                Treatment consent
              </h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              Required before your {vocab.serviceNoun.toLowerCase()} — please read carefully.
            </p>
            {(b.regulatoryFooter?.length ?? 0) > 0 && (
              <div
                className="text-xs text-muted-foreground space-y-1 rounded-md border border-border/60 bg-muted/30 p-3"
                data-testid="regulatory-footer-consent"
              >
                {b.regulatoryFooter!.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Procedure *</Label>
              <Select value={medspaProcedure} onValueChange={setMedspaProcedure}>
                <SelectTrigger data-testid="select-medspa-procedure">
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  {b.medspaProcedures.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {medspaProcedure && (
              <Card className="bg-muted/40">
                <CardContent className="pt-4 text-sm space-y-2">
                  <p>
                    {b.medspaProcedures.find((p) => p.code === medspaProcedure)?.summary}
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {b.medspaProcedures
                      .find((p) => p.code === medspaProcedure)
                      ?.risksBullets.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="mt-1"
                data-testid="checkbox-consent"
              />
              I have read the risks and confirm my medical history is accurate.
            </label>
            <div className="space-y-2">
              <Label>Full legal name (signature) *</Label>
              <Input
                value={consentSignature}
                onChange={(e) => setConsentSignature(e.target.value)}
                placeholder="Jane Smith"
                data-testid="input-consent-signature"
              />
            </div>
            {validationErr && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {validationErr}
              </div>
            )}
            <PublicBookingSummaryCard
              className="hidden md:block bg-muted/40"
              serviceName={selectedService.name}
              startAt={selectedSlot}
              durationMinutes={selectedService.durationMinutes}
              priceMinor={selectedService.priceMinor}
              currency={selectedService.currency}
              serviceNoun={vocab.serviceNoun}
            />

            <Button
              className="w-full hidden md:flex"
              disabled={createBooking.isPending}
              onClick={handleBook}
              data-testid="button-confirm-booking"
            >
              {createBooking.isPending ? "Booking..." : confirmLabel}
            </Button>
          </section>
        )}

        {/* Step: Confirmed */}
        {step === "confirmed" && confirmation && (
          <div
            className={`text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 rounded-2xl p-2 ${
              celebrationEnabled() ? "celebrate-shimmer" : ""
            }`}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--chart-3))]/10 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--chart-3))]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-confirmed">
                Booking Confirmed!
              </h2>
              <p className="text-muted-foreground mt-2">
                {confirmation.pendingReason === "awaiting_continuity"
                  ? "Check your messages to finish confirming"
                  : "Your appointment has been received"}
              </p>
            </div>
            {confirmation.instagramDeepLink && b?.instagramHandle ? (
              <p className="text-sm text-muted-foreground">
                {confirmation.instagramDeepLink}
              </p>
            ) : null}

            {confirmation.nextSteps && confirmation.nextSteps.length > 0 && (
              <Card className="text-left border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">What happens next</p>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                    {confirmation.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {(b?.regulatoryFooter?.length ?? 0) > 0 && (
              <div className="text-left text-xs text-muted-foreground space-y-1 max-w-md mx-auto">
                {b!.regulatoryFooter!.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            <Card>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{confirmation.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium">
                    {formatDate(confirmation.startAt)} at{" "}
                    {formatTime(confirmation.startAt)}
                  </span>
                </div>
                {confirmation.staffDisplayName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With</span>
                    <span className="font-medium">
                      {confirmation.staffDisplayName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className="text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30"
                  >
                    {confirmation.status}
                  </Badge>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Confirmation</span>
                  <span className="font-mono text-xs">
                    #{confirmation.bookingId.slice(-8)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {confirmation.visitPath ? (
              <Link href={confirmation.visitPath}>
                <Button variant="default" className="w-full" data-testid="link-manage-visit">
                  Manage your visit (running late · receipt)
                </Button>
              </Link>
            ) : null}

            {confirmation.savedToMyLivia && confirmation.myLiviaPath ? (
              <Link href={confirmation.myLiviaPath}>
                <Button variant="outline" className="w-full" data-testid="link-my-livia">
                  Open My Livia — verify your phone
                </Button>
              </Link>
            ) : null}

            <a
              href={buildIcsDataUri({
                title: `${confirmation.serviceName} @ ${confirmation.businessName}`,
                description: `Booking confirmation #${confirmation.bookingId}`,
                startAt: confirmation.startAt,
                endAt: confirmation.endAt,
                location: confirmation.businessName,
              })}
              download={`livia-booking-${confirmation.bookingId.slice(-6)}.ics`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              data-testid="link-add-calendar"
            >
              <CalendarPlus className="h-4 w-4" />
              Add to calendar
            </a>

            <Button
              variant="outline"
              className="w-full"
              onClick={resetFlow}
              data-testid="button-book-another"
            >
              Book another {vocab.serviceNoun.toLowerCase()}
            </Button>
          </div>
        )}

        {aiOn && aiFooterLine && step !== "confirmed" ? (
          <p
            className="mt-10 text-center text-[11px] text-muted-foreground leading-relaxed max-w-md mx-auto px-2"
            data-testid="text-ai-disclosure-footer"
          >
            {aiFooterLine}
          </p>
        ) : null}

        <PublicSurfaceFooter />
      </main>

      {showStickyCta && selectedService && (
        <PublicBookingStickySummary
          serviceName={selectedService.name}
          startAt={selectedSlot}
          priceMinor={selectedService.priceMinor}
          currency={selectedService.currency}
          ctaLabel={
            step === "consent"
              ? confirmLabel
              : needsMedspaConsent
                ? "Continue to consent"
                : confirmLabel
          }
          disabled={
            step === "details"
              ? !firstName.trim()
              : !medspaProcedure || !consentAgreed || !consentSignature.trim()
          }
          pending={createBooking.isPending}
          onCta={() => {
            setValidationErr(null);
            if (step === "consent") {
              handleBook();
            } else if (needsMedspaConsent) {
              setStep("consent");
            } else {
              handleBook();
            }
          }}
        />
      )}

      {chatMount && aiOn && step !== "confirmed" && (
        <Suspense fallback={null}>
          <ChatWidget
            slug={sl}
            businessName={b.name}
            greeting={b.aiGreeting ?? undefined}
            disclosureFirstMessage={b.aiDisclosureChatFirstMessage}
            disclosureFooterLine={b.aiDisclosureFooterLine}
            initialName={firstName ? `${firstName} ${lastName}`.trim() : undefined}
            initialEmail={email || undefined}
            initialPhone={phone || undefined}
          />
        </Suspense>
      )}
    </div>
  );
}
