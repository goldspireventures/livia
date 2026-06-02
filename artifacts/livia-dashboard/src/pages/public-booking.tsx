import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { applyExperienceTheme, applyPresentationTheme, clearExperienceTheme, clearPresentationTheme, publicExperienceClassNames, marketRibbon } from "@/lib/experience-theme";
import { playCelebrationChime, celebrationEnabled } from "@/lib/celebrate";
import { publicGuestPwaEnabled, usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { Link, useParams } from "wouter";
import {
  useGetPublicBusiness,
  useGetPublicSlots,
  useCreatePublicBooking,
} from "@workspace/api-client-react";
import { formatTime, formatDate, formatCurrency } from "@/lib/format";
import { pendingReasonLabel } from "@/lib/booking-pending";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  ChevronLeft,
  Calendar,
  CalendarPlus,
  Loader2,
} from "lucide-react";
const ChatWidget = lazy(() => import("@/components/chat-widget"));
import {
  PublicCustomerRitual,
  PublicBookingStepper,
  type PublicRitualStep,
} from "@/components/ritual/public-customer-ritual";
import {
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import { PublicBookLoading } from "@/components/public/public-book-loading";
import { PublicBookStorefront } from "@/components/public-booking/public-book-storefront";
import { PublicBookLivBar } from "@/components/public-booking/public-book-liv-bar";
import { PublicBookPolicyFooter } from "@/components/public-booking/public-book-policy-footer";
import { PublicBookingStickySummary } from "@/components/public-booking/public-booking-sticky-summary";
import { PublicBookingSummaryCard } from "@/components/public-booking/public-booking-summary-card";
import { PublicBookingTrustStrip } from "@/components/public-booking/public-booking-trust-strip";
import { PublicCareNotes } from "@/components/public-booking/public-care-notes";
import { PublicStaffStrip } from "@/components/public-booking/public-staff-strip";
import { PublicServiceCatalog } from "@/components/public-booking/public-service-catalog";
import {
  PublicBookBeautyDualCta,
  PublicBookBeautyTrustFooter,
} from "@/components/public-booking/public-book-beauty-chrome";
import {
  beautyPublicHeroTagline,
  beautyPublicHeroTitle,
  isBeautyPresentationPreset,
  isBeautyVertical,
  resolveBeautyPublicCatalogLayout,
} from "@/lib/presentation-layout";
import {
  guardSectionTitle,
  guessMedspaProcedureCode,
  publicBookingLayout,
  verticalHeroCta,
  type PublicPolicyTrust,
  type PublicServiceRow,
} from "@/lib/public-booking-helpers";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { businessVocabulary } from "@workspace/policy";
import { cn } from "@/lib/utils";

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
  publicFeaturedServiceIds?: string[];
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

/** Keep `?service=` in sync with beauty treatment pick / back navigation. */
function syncPublicBookingServiceQuery(serviceId: string | null) {
  const url = new URL(window.location.href);
  if (serviceId) url.searchParams.set("service", serviceId);
  else url.searchParams.delete("service");
  const search = url.searchParams.toString();
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${search ? `?${search}` : ""}${url.hash}`,
  );
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<Step>("services");
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [pickServiceHint, setPickServiceHint] = useState(false);
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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [chatMount, setChatMount] = useState(false);
  const [chatOpenRequest, setChatOpenRequest] = useState(0);
  const [pastHero, setPastHero] = useState(false);
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const servicePrefApplied = useRef(false);

  const sl = slug ?? "";

  usePublicGuestPwa(sl);

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
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "1";
    const previewPreset = params.get("preset")?.trim();
    const previewAccent = params.get("accent")?.trim();
    const skin = b?.experienceSkin as
      | { presentation?: string; presentationColorMode?: string; brandAccentHex?: string | null }
      | undefined;
    const colorMode =
      skin?.presentationColorMode === "light" || skin?.presentationColorMode === "dark"
        ? skin.presentationColorMode
        : null;
    if (isPreview && (previewPreset || previewAccent)) {
      applyPresentationTheme({
        cssPreset: previewPreset || skin?.presentation,
        brandAccentHex: previewAccent || skin?.brandAccentHex,
        colorMode,
      });
      return;
    }
    if (skin?.presentation || skin?.brandAccentHex) {
      applyPresentationTheme({
        cssPreset: skin.presentation,
        brandAccentHex: skin.brandAccentHex,
        colorMode,
      });
    }
  }, [b?.experienceSkin]);

  useEffect(() => {
    if (!b?.services?.length || servicePrefApplied.current) return;
    const serviceId = new URLSearchParams(window.location.search).get("service");
    if (!serviceId) return;
    const svc = b.services.find((s) => s.id === serviceId);
    if (svc) {
      servicePrefApplied.current = true;
      setSelectedService(svc);
      setStep("slots");
    }
  }, [b?.services]);

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
  const confirmLabel = pb?.confirmBooking ?? "Confirm booking";
  const aiFooterLine = b?.aiDisclosureFooterLine?.trim() || null;
  const showStickyCta =
    (step === "details" || step === "consent") && !!selectedService && !!selectedSlot;
  const layout = publicBookingLayout(b?.vertical);
  const heroCta = verticalHeroCta(b?.vertical, b?.publicCta);
  const staffForward = layout === "staff-forward";
  const beautyCssPreset = b?.experienceSkin?.presentation ?? null;
  const beautyPublic =
    isBeautyVertical(b?.vertical) && isBeautyPresentationPreset(beautyCssPreset);
  const beautyCatalogLayout = beautyPublic
    ? resolveBeautyPublicCatalogLayout(beautyCssPreset)
    : "list";

  const requestChatOpen = () => setChatOpenRequest((n) => n + 1);

  useEffect(() => {
    if (step !== "services") {
      setPastHero(false);
      return;
    }
    const el = heroSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPastHero(entry ? !entry.isIntersecting : false),
      { threshold: 0, rootMargin: "0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [step, b?.slug]);

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

  function selectPublicService(svc: PublicService) {
    setPickServiceHint(false);
    setSelectedService(svc);
    syncPublicBookingServiceQuery(svc.id);
    if (!beautyPublic) {
      setStep("slots");
    }
  }

  function goBackToServices() {
    setStep("services");
    setSelectedService(null);
    setSelectedSlot("");
    syncPublicBookingServiceQuery(null);
  }

  function navigateBookingHome() {
    goBackToServices();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFlow() {
    setStep("services");
    setSelectedService(null);
    setSelectedSlot("");
    syncPublicBookingServiceQuery(null);
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
    return <PublicBookLoading />;
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
      <main
        className={cn(
          "max-w-xl mx-auto px-4 py-6 pb-6 md:pb-8 relative z-10",
          beautyPublic && step === "services" && "beauty-public-shell",
          beautyPublic &&
            step === "services" &&
            beautyCssPreset === "editorial" &&
            "beauty-public-shell--editorial",
        )}
      >
        {step === "services" ? (
          <>
            <PublicBookStorefront
              businessName={b.name}
              bookingSlug={slug}
              onBookingHome={navigateBookingHome}
              logoUrl={b.logoUrl}
              coverImageUrl={b.coverImageUrl}
              heroCta={heroCta}
              layout={beautyPublic ? "beauty" : "default"}
              tagline={b.description}
              heroTagline={beautyPublic ? beautyPublicHeroTagline(beautyCssPreset) : undefined}
              heroTitle={beautyPublic ? beautyPublicHeroTitle(vocab.serviceNoun) : undefined}
              onHeroCta={() =>
                document.getElementById("public-service-menu")?.scrollIntoView({ behavior: "smooth" })
              }
              onOpenChat={aiOn ? requestChatOpen : undefined}
              showMessage={aiOn && !beautyPublic}
            />
            <div ref={heroSentinelRef} className="h-px w-full" aria-hidden />
            {!beautyPublic ? (
              <div className="mt-4 mb-5">
                <PublicBookingStepper
                  step={step as PublicRitualStep}
                  serviceStepLabel={vocab.serviceNoun}
                  includeConsentStep={needsMedspaConsent}
                />
              </div>
            ) : null}
          </>
        ) : (
          <PublicCustomerRitual
            businessName={b.name}
            bookingSlug={slug}
            onBookingHome={navigateBookingHome}
            city={b.city ? `${b.city}` : null}
            step={step as PublicRitualStep}
            aiGreeting={b.aiGreeting}
            verticalLabel={verticalPackUi(b.vertical, b.category).label}
            logoUrl={b.logoUrl}
            description={b.description}
            serviceStepLabel={vocab.serviceNoun}
            includeConsentStep={needsMedspaConsent}
            tagline={vocab.hint}
            variant="compact"
          />
        )}
        {step === "services" && !beautyPublic ? (
          <>
            <PublicBookingTrustStrip
              depositPolicySummary={b.depositPolicySummary}
              policyTrust={b.policyTrust}
            />
            {(b.countryPack?.countryShowcaseNote ||
              (b.countryPack?.upcomingHolidays && b.countryPack.upcomingHolidays.length > 0)) && (
              <p className="text-[10px] text-muted-foreground/70 mb-4 -mt-1">
                {[
                  b.countryPack?.countryShowcaseNote,
                  b.countryPack?.upcomingHolidays?.[0]
                    ? `Closed ${b.countryPack.upcomingHolidays[0].name} (${b.countryPack.upcomingHolidays[0].date})`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </>
        ) : null}

        {/* Step: Services */}
        {step === "services" && (
          <div
            id="public-service-menu"
            className={cn(
              "space-y-3 rounded-xl transition-shadow",
              pickServiceHint && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
            )}
          >
            {staffForward ? (
              <PublicStaffStrip
                staff={b.staff}
                selectedStaffId={selectedStaff}
                onSelect={setSelectedStaff}
                teamNoun={vocab.teamNoun}
              />
            ) : null}
            {!beautyPublic && marketRibbon(b.country, b.experienceSkin) ? (
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 -mt-1">
                {marketRibbon(b.country, b.experienceSkin)}
              </p>
            ) : null}
            <PublicServiceCatalog
              services={b.services}
              vertical={b.vertical}
              featuredServiceIds={b.publicFeaturedServiceIds}
              catalogTitle={vocab.publicBookCatalogTitle}
              layout={beautyCatalogLayout}
              selectedServiceId={beautyPublic ? selectedService?.id : undefined}
              onSelect={selectPublicService}
            />
            {beautyPublic ? (
              <>
                <PublicBookBeautyDualCta
                  bookLabel="Book now"
                  showChat={aiOn}
                  onChat={aiOn ? requestChatOpen : undefined}
                  bookDisabled={!selectedService}
                  onBook={() => {
                    if (selectedService) {
                      setPickServiceHint(false);
                      setStep("slots");
                      return;
                    }
                    setPickServiceHint(true);
                    toast({
                      title: "Choose a treatment first",
                      description: "Tap a service above, then continue to pick a time.",
                    });
                    document
                      .getElementById("public-service-menu")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
                <PublicBookBeautyTrustFooter cancelWindowHours={b.policyTrust?.cancelWindowHours} />
              </>
            ) : (
              <PublicCareNotes vertical={b.vertical} />
            )}
          </div>
        )}

        {/* Step: Slots */}
        {step === "slots" && selectedService && (
          <div className="space-y-4 motion-wizard-enter">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to services" onClick={goBackToServices}>
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
              <Label
                htmlFor="public-date"
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  const el = dateInputRef.current;
                  if (el && typeof el.showPicker === "function") el.showPicker();
                  else el?.focus();
                }}
              >
                <Calendar className="h-4 w-4" aria-hidden />
                Select date
              </Label>
              <Input
                ref={dateInputRef}
                id="public-date"
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                onClick={(e) => {
                  const el = e.currentTarget;
                  if (typeof el.showPicker === "function") el.showPicker();
                }}
                className="cursor-pointer"
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
          <div className="space-y-4 motion-wizard-enter relative">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Label htmlFor="public-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="public-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="public-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+353 87 123 4567"
                  data-testid="input-phone"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive">*</span> At least one of email or phone is required.
              </p>
              {phone.trim() ? (
                <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer">
                  <Checkbox
                    checked={saveToMyLivia}
                    onCheckedChange={(v) => {
                      if (v !== true) {
                        const ok = window.confirm(
                          "Without My Livia you won't have one place to see all your bookings or rebook quickly. You can still manage this visit from the link after booking. Continue without saving?",
                        );
                        if (!ok) return;
                      }
                      setSaveToMyLivia(v === true);
                    }}
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
            className="space-y-4 motion-wizard-enter"
            aria-labelledby="consent-heading"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to your details" onClick={() => setStep("details")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 id="consent-heading" className="text-lg font-semibold">
                Before we continue
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
              <div className="rounded-xl border border-border/80 bg-muted/30 max-h-[40vh] overflow-y-auto">
                <div className="p-4 text-sm space-y-2">
                  <p className="font-medium">
                    {b.medspaProcedures.find((p) => p.code === medspaProcedure)?.label}
                  </p>
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
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm">
              <Checkbox
                id="checkbox-consent"
                checked={consentAgreed}
                onCheckedChange={(v) => setConsentAgreed(v === true)}
                data-testid="checkbox-consent"
              />
              <Label htmlFor="checkbox-consent" className="leading-snug font-normal cursor-pointer">
                I have read the risks and confirm my medical history is accurate.
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="input-consent-signature">Full legal name (signature) *</Label>
              <Input
                id="input-consent-signature"
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
            className={`text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 rounded-2xl p-2 motion-glow-success ${
              celebrationEnabled() ? "celebrate-shimmer" : ""
            }`}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--chart-3))]/10 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--chart-3))]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-confirmed">
                {confirmation.status === "PENDING" ? "Booking received" : "You're booked"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {confirmation.status === "PENDING"
                  ? pendingReasonLabel(confirmation.pendingReason)
                  : "Your appointment is confirmed — details below."}
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
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground shrink-0">Status</span>
                  <span className="text-right text-sm font-medium">
                    {confirmation.status === "PENDING"
                      ? pendingReasonLabel(confirmation.pendingReason)
                      : "Confirmed"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Confirmation</span>
                  <span className="font-mono text-xs">
                    #{confirmation.bookingId.slice(-8)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {confirmation.visitPath || confirmation.myLiviaPath ? (
              <Link href={confirmation.visitPath ?? confirmation.myLiviaPath ?? "/my"}>
                <Button variant="default" className="w-full" data-testid="link-manage-visit">
                  {confirmation.savedToMyLivia
                    ? "Manage your booking in My Livia"
                    : "Manage your booking"}
                </Button>
              </Link>
            ) : null}

            {publicGuestPwaEnabled ? (
              <p
                className="text-xs text-muted-foreground text-center max-w-sm mx-auto leading-relaxed"
                data-testid="public-pwa-hint"
              >
                Tip: add {b.name} to your home screen for quick access to My Livia.
              </p>
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

        <PublicBookPolicyFooter
          depositPolicySummary={b.depositPolicySummary}
          policyTrust={b.policyTrust}
          regulatoryFooter={b.regulatoryFooter}
        />

        {aiOn && aiFooterLine && step !== "confirmed" ? (
          <p
            className="mt-4 text-center text-[10px] text-muted-foreground/75 leading-relaxed max-w-md mx-auto px-2"
            data-testid="text-ai-disclosure-footer"
          >
            {aiFooterLine}
          </p>
        ) : null}
      </main>

      {step === "services" && aiOn && !beautyPublic ? (
        <PublicBookLivBar
          visible={pastHero}
          livActive={chatOpenRequest > 0}
          onOpenChat={requestChatOpen}
        />
      ) : null}

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
            openRequest={chatOpenRequest}
            hideLauncher={step === "services"}
          />
        </Suspense>
      )}
    </div>
  );
}
