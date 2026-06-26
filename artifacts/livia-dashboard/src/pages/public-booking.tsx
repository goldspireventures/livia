import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  warmPublicGuestSurfaceTheme,
  clearPublicGuestSurfaceTheme,
} from "@/lib/apply-public-guest-theme";
import {
  publicExperienceClassNames,
} from "@/lib/experience-theme";
import { applyAppearancePreviewFromSearch, readAppearancePreviewParams } from "@/lib/appearance-preview-mode";
import { playCelebrationChime, celebrationEnabled } from "@/lib/celebrate";
import { publicGuestPwaEnabled, usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { Link } from "wouter";
import PublicShopPage from "@/pages/public-shop";
import { PublicRetailCartBar } from "@/components/public-booking/public-retail-cart-bar";
import { PublicRetailCartDrawer } from "@/components/public-booking/public-retail-cart-drawer";
import {
  addToRetailCart,
  clearRetailCart,
  readRetailCart,
  retailCartApiItems,
  setRetailCartQty,
  type RetailCart,
} from "@/lib/retail-cart";
import type { PublicRetailProduct } from "@/components/public-booking/public-beauty-shop";
import { isPublicShopPath } from "@/lib/public-guest-route-params";
import { useGuestBookSlug } from "@/lib/use-guest-book-slug";
import { guestBookTokenPath, isPublicRetailVertical, resolveActiveBookingGuards, guestRetailFulfillmentOptions, verticalSupportsPackageCreditCommitment, isPackageCatalogService, packageCatalogPublicLabel, verticalAllowsPackageCatalog, type BusinessVertical, type GuestRetailFulfillmentMode } from "@workspace/policy";
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
import {
  fetchGuestHubBookProfile,
  isMyLiviaRebookFlow,
} from "@/lib/guest-hub-session";
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
import { PublicChairHostingStrip } from "@/components/public-booking/public-chair-hosting-strip";
import { PublicBookLivBar } from "@/components/public-booking/public-book-liv-bar";
import { PublicBookPolicyFooter } from "@/components/public-booking/public-book-policy-footer";
import { PublicBookingStickySummary } from "@/components/public-booking/public-booking-sticky-summary";
import { PublicBookingSummaryCard } from "@/components/public-booking/public-booking-summary-card";
import { GuestMoneyBreakdown } from "@/components/public-booking/guest-money-breakdown";
import { PublicBookingTrustStrip } from "@/components/public-booking/public-booking-trust-strip";
import { PublicBookServicesStep } from "@/components/public-booking/public-book-services-step";
import {
  beautyPublicHeroTagline,
  beautyPublicHeroTitle,
  isBeautyPresentationPreset,
  isBeautyVertical,
  isWellnessPresentationPreset,
  isWellnessVertical,
  resolveBeautyPublicCatalogLayout,
  wellnessPublicHeroTagline,
  wellnessPublicCatalogLayout,
} from "@/lib/presentation-layout";
import {
  dedupePublicSlotsByStartAt,
  guardSectionTitle,
  guessMedspaProcedureCode,
  parsePublicApiError,
  publicBookingLayout,
  verticalHeroCta,
  type PublicPolicyTrust,
  type PublicServiceRow,
} from "@/lib/public-booking-helpers";
import { PublicBookingTimePicker } from "@/components/public-booking/public-booking-time-picker";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { businessVocabulary, guestPublicExperience, resolveWellnessExperience, LIVIA_FORM_EXAMPLES, GUEST_HUB_COPY } from "@workspace/policy";
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
  privacyNoticeBlock?: string;
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
  retailStore?: {
    settings: { enabled: boolean; title: string };
    products: Array<{
      id: string;
      name: string;
      description?: string | null;
      priceMinor: number;
      currency: string;
      imageUrl?: string | null;
      category?: string | null;
    }>;
  };
  designShowcase?: Array<{
    id: string;
    imageUrl: string;
    title: string;
    note?: string | null;
  }>;
  chairHosting?: {
    headline: string;
    body: string;
    weeklyRateMinor: number;
    chairsAvailable: number;
    amenities: string[];
    currency: string;
  };
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
  depositDueMinor?: number | null;
  depositPayUrl?: string | null;
  currency?: string;
  packPurchased?: boolean;
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

const PACK_GUEST_KEY = (slug: string) => `livia_pack_guest_${slug}`;

export default function PublicBookingPage() {
  if (typeof window !== "undefined" && isPublicShopPath(window.location.pathname)) {
    return <PublicShopPage />;
  }

  const slug = useGuestBookSlug();
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
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [partnerLastName, setPartnerLastName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [guestContext, setGuestContext] = useState<{
    recognized: boolean;
    patchTestValid?: boolean;
    lastVisits?: Array<{ serviceId: string; fillHint?: string | null }>;
    preferredStaff?: { id: string; displayName: string } | null;
    pets?: Array<{ id: string; name: string; species: string; breed?: string | null }>;
  } | null>(null);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [consultReferenceUrl, setConsultReferenceUrl] = useState("");
  const [waitlistBusy, setWaitlistBusy] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [usePackageCredit, setUsePackageCredit] = useState(false);
  const [packCheckoutBusy, setPackCheckoutBusy] = useState(false);
  const [packBookNext, setPackBookNext] = useState(false);
  const [validationErr, setValidationErr] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [medspaProcedure, setMedspaProcedure] = useState("");
  const [consentSignature, setConsentSignature] = useState("");
  const [saveToMyLivia, setSaveToMyLivia] = useState(true);
  const [retailCart, setRetailCart] = useState<RetailCart | null>(null);
  const [retailCheckoutBusy, setRetailCheckoutBusy] = useState(false);
  const [combinedCheckoutBusy, setCombinedCheckoutBusy] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<GuestRetailFulfillmentMode>("collect_in_store");
  const [fulfillmentDetail, setFulfillmentDetail] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [hubAuthenticated, setHubAuthenticated] = useState(false);
  const [chatMount, setChatMount] = useState(false);
  const [chatOpenRequest, setChatOpenRequest] = useState(0);
  const [pastHero, setPastHero] = useState(false);
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const servicePrefApplied = useRef(false);
  const hubProfileApplied = useRef(false);

  const sl = slug ?? "";

  useEffect(() => {
    if (!sl || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("pack_purchased") === "1") {
      try {
        const raw = sessionStorage.getItem(PACK_GUEST_KEY(sl));
        if (raw) {
          const guest = JSON.parse(raw) as {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
          };
          if (guest.firstName) setFirstName(guest.firstName);
          if (guest.lastName) setLastName(guest.lastName);
          if (guest.email) setEmail(guest.email);
          if (guest.phone) setPhone(guest.phone);
          sessionStorage.removeItem(PACK_GUEST_KEY(sl));
        }
      } catch {
        /* ignore */
      }
      setUsePackageCredit(true);
      setPackBookNext(true);
      setSelectedService(null);
      setSelectedSlot("");
      setStep("services");
      params.delete("pack_purchased");
      const next = params.toString();
      const path = window.location.pathname;
      window.history.replaceState({}, "", next ? `${path}?${next}` : path);
    }
  }, [sl]);

  usePublicGuestPwa(sl);

  useEffect(() => {
    if (!sl) return;
    setRetailCart(readRetailCart(sl));
  }, [sl]);

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

  useLayoutEffect(() => {
    if (!slug) return;
    if (readAppearancePreviewParams().isPreview) return;
    void warmPublicGuestSurfaceTheme({ slug });
    return () => clearPublicGuestSurfaceTheme();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (!b?.vertical && !b?.category && !b?.country && !b?.experienceSkin) return;

    if (
      applyAppearancePreviewFromSearch(undefined, {
        vertical: b?.vertical ?? null,
        category: b?.category ?? null,
        country: b?.country ?? null,
      })
    ) {
      return;
    }

    void warmPublicGuestSurfaceTheme({
      slug,
      vertical: b?.vertical,
      category: b?.category,
      country: b?.country,
      experienceSkin: b?.experienceSkin as
        | { presentation?: string; presentationColorMode?: string; brandAccentHex?: string | null }
        | undefined,
    });
  }, [slug, b?.experienceSkin, b?.vertical, b?.category, b?.country]);

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

  useEffect(() => {
    if (!sl || hubProfileApplied.current || !isMyLiviaRebookFlow()) return;
    hubProfileApplied.current = true;
    void fetchGuestHubBookProfile(sl).then((profile) => {
      if (!profile) return;
      setHubAuthenticated(true);
      setSaveToMyLivia(false);
      if (profile.firstName) setFirstName(profile.firstName);
      if (profile.lastName) setLastName(profile.lastName);
      if (profile.email) setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);
    });
  }, [sl]);

  const depositDuePreviewMinor = useMemo(() => {
    if (!b?.policyTrust?.depositRequired || !selectedService) return 0;
    const pct = b.policyTrust.depositPercent ?? 0;
    if (pct <= 0) return 0;
    return Math.round((selectedService.priceMinor * pct) / 100);
  }, [b?.policyTrust, selectedService]);

  const depositPercentPreview = b?.policyTrust?.depositPercent ?? 0;

  const friendlyValidationErr = validationErr ? parsePublicApiError(validationErr) : null;
  const isPatchTestErr = friendlyValidationErr?.toLowerCase().includes("patch test") ?? false;
  const patchTestService = useMemo(
    () =>
      b?.services?.find(
        (s) => s.serviceKind === "patch_test" || /patch\s*test/i.test(s.name ?? ""),
      ),
    [b?.services],
  );

  function stepValidationMessage(forStep: Step): string | null {
    if (!friendlyValidationErr) return null;
    if (isPatchTestErr && forStep !== "services" && forStep !== "details") return null;
    return friendlyValidationErr;
  }

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

  const availableSlots = useMemo(
    () => dedupePublicSlotsByStartAt(slots.filter((s) => s.available)),
    [slots],
  );

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
  const presentationPreset = b?.experienceSkin?.presentation ?? null;
  const beautyCssPreset = presentationPreset;
  const beautyBook = isBeautyVertical(b?.vertical);
  const beautyPublic = beautyBook && isBeautyPresentationPreset(beautyCssPreset);
  const wellnessPublic =
    isWellnessVertical(b?.vertical) && isWellnessPresentationPreset(presentationPreset);
  const packageCreditBook = verticalSupportsPackageCreditCommitment(b?.vertical);
  const isSelectedPackage =
    !!selectedService &&
    verticalAllowsPackageCatalog(b?.vertical) &&
    isPackageCatalogService(selectedService);
  const wellnessExperience = wellnessPublic
    ? resolveWellnessExperience(presentationPreset)
    : null;
  const guestPublic = guestPublicExperience(b?.vertical, b?.category);
  const isCouplesBook =
    b?.vertical === "wellness" && guardAnswers.couples_or_shared === "couples";
  const needsGuestContext =
    beautyBook || b?.vertical === "hair" || b?.vertical === "pet-grooming";
  const isBodyArtConsult =
    b?.vertical === "body-art" &&
    (/consult/i.test(selectedService?.name ?? "") ||
      /consult/i.test(selectedService?.category ?? ""));
  const beautyCatalogLayout = beautyBook
    ? resolveBeautyPublicCatalogLayout(beautyCssPreset)
    : wellnessPublic
      ? wellnessPublicCatalogLayout(presentationPreset)
      : "list";

  const showRetailCartBar =
    step === "services" &&
    isPublicRetailVertical(b?.vertical) &&
    b?.retailStore?.settings?.enabled &&
    (retailCart?.lines.length ?? 0) > 0;

  const retailFulfillmentOptions = useMemo(
    () =>
      guestRetailFulfillmentOptions({
        vertical: b?.vertical,
        category: b?.category,
        hasLinkedBooking: Boolean(
          confirmation?.bookingId ||
            selectedSlot ||
            (step !== "services" && !!selectedService),
        ),
      }),
    [b?.vertical, b?.category, confirmation?.bookingId, selectedSlot, selectedService, step],
  );

  const cartBarHeightPx = showRetailCartBar ? 72 : 0;

  const activeBookingGuards = useMemo(() => {
    if (!b?.vertical) return [];
    return resolveActiveBookingGuards({
      vertical: b.vertical as BusinessVertical,
      beautyService: selectedService
        ? {
            requiresPatchTest: selectedService.requiresPatchTest,
            serviceKind: selectedService.serviceKind as import("@workspace/policy").BeautyServiceKind | null,
            category: selectedService.category,
          }
        : null,
    });
  }, [b?.vertical, selectedService]);

  const requestChatOpen = () => setChatOpenRequest((n) => n + 1);

  useEffect(() => {
    if (!needsGuestContext || step !== "details" || !sl || phone.trim().length < 8) {
      if (step !== "details") setGuestContext(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(
        `/api/public/b/${encodeURIComponent(sl)}/guest-context?phone=${encodeURIComponent(phone.trim())}`,
      )
        .then((r) => (r.ok ? r.json() : { recognized: false }))
        .then((ctx: typeof guestContext) => {
          setGuestContext(ctx);
          if (ctx?.recognized && ctx.patchTestValid) {
            setGuardAnswers((prev) =>
              prev.patch_test === "yes" ? prev : { ...prev, patch_test: "yes" },
            );
          }
          if (ctx?.recognized && ctx.preferredStaff?.id) {
            setSelectedStaff(ctx.preferredStaff.id);
          }
          if (ctx?.recognized && ctx.pets?.length) {
            setSelectedPetIds(ctx.pets.map((p) => p.id));
          }
        })
        .catch(() => setGuestContext(null));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [needsGuestContext, step, sl, phone]);

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

  async function handleBook() {
    setValidationErr(null);
    if (!sl || !selectedService || !selectedSlot || !firstName.trim()) return;

    if (!email.trim() && !phone.trim()) {
      setValidationErr("Please add an email or phone number so we can reach you.");
      return;
    }

    for (const g of activeBookingGuards) {
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

    if (isCouplesBook) {
      if (!partnerFirstName.trim()) {
        setValidationErr("Please add your partner's first name for a couples session.");
        return;
      }
      if (!partnerEmail.trim() && !partnerPhone.trim()) {
        setValidationErr("Please add your partner's phone or email so we can reach them.");
        return;
      }
    }

    if (isSelectedPackage) {
      setPackCheckoutBusy(true);
      try {
        const r = await fetch(
          `/api/public/b/${encodeURIComponent(sl)}/packages/${encodeURIComponent(selectedService!.id)}/checkout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: firstName.trim(),
              lastName: lastName.trim() || undefined,
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
            }),
          },
        );
        const body = (await r.json()) as { checkoutUrl?: string; message?: string; mode?: string };
        if (!r.ok) {
          setValidationErr(body.message ?? "Could not start checkout");
          return;
        }
        if (body.mode === "stripe" && body.checkoutUrl) {
          try {
            sessionStorage.setItem(
              PACK_GUEST_KEY(sl),
              JSON.stringify({
                firstName: firstName.trim(),
                lastName: lastName.trim() || "",
                email: email.trim() || "",
                phone: phone.trim() || "",
              }),
            );
          } catch {
            /* ignore */
          }
          window.location.href = body.checkoutUrl;
          return;
        }
        if (body.mode === "dev") {
          setUsePackageCredit(true);
          setPackBookNext(true);
          setSelectedService(null);
          setSelectedSlot("");
          setStep("services");
          setConfirmation(null);
          playCelebrationChime();
          return;
        }
        setValidationErr("Could not start checkout");
      } catch {
        setValidationErr("Could not start checkout");
      } finally {
        setPackCheckoutBusy(false);
      }
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
          ...(isCouplesBook
            ? {
                partnerFirstName: partnerFirstName.trim(),
                partnerLastName: partnerLastName.trim() || undefined,
                partnerEmail: partnerEmail.trim() || undefined,
                partnerPhone: partnerPhone.trim() || undefined,
              }
            : {}),
          ...(selectedPetIds.length ? { petIds: selectedPetIds } : {}),
          ...(isBodyArtConsult && consultReferenceUrl.trim()
            ? { consultReferenceUrl: consultReferenceUrl.trim() }
            : {}),
          ...(packageCreditBook && usePackageCredit ? { usePackageCredit: true } : {}),
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
        onError: (err: unknown) => {
          const msg = parsePublicApiError(err, "Slot no longer available");
          setValidationErr(msg);
          if (msg.toLowerCase().includes("patch test")) {
            setStep("services");
          } else {
            setStep("slots");
          }
          setSelectedSlot("");
        },
      },
    );
  }

  function selectPublicService(svc: PublicService) {
    setPickServiceHint(false);
    setSelectedService(svc);
    syncPublicBookingServiceQuery(svc.id);
    if (
      verticalAllowsPackageCatalog(b?.vertical) &&
      isPackageCatalogService(svc)
    ) {
      setStep("details");
    } else if (!beautyPublic) {
      setStep("slots");
    }
  }

  function retailCartQty(productId: string): number {
    return retailCart?.lines.find((l) => l.productId === productId)?.quantity ?? 0;
  }

  function handleAddRetailToBag(product: PublicRetailProduct) {
    if (!sl) return;
    setRetailCart(addToRetailCart(sl, product, 1));
  }

  function handleChangeRetailQty(productId: string, quantity: number) {
    if (!sl) return;
    setRetailCart(setRetailCartQty(sl, productId, quantity));
  }

  async function checkoutRetailCart() {
    if (!sl || !retailCart?.lines.length) return;
    setRetailCheckoutBusy(true);
    try {
      const r = await fetch(`/api/public/b/${sl}/retail/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: retailCartApiItems(retailCart),
          guestName: [firstName, lastName].filter(Boolean).join(" ").trim() || undefined,
          guestEmail: email.trim() || undefined,
          guestPhone: phone.trim() || undefined,
          bookingId: confirmation?.bookingId,
          fulfillmentMode,
          fulfillmentDetail: fulfillmentDetail.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not start order");
      }
      const body = (await r.json()) as { payUrl: string; payToken?: string };
      clearRetailCart(sl);
      setRetailCart(null);
      setCartDrawerOpen(false);
      window.location.href =
        body.payToken && sl ? guestBookTokenPath(sl, "shop", body.payToken) : body.payUrl;
    } catch (e) {
      toast({
        title: "Could not open checkout",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setRetailCheckoutBusy(false);
    }
  }

  async function checkoutCombinedWithBooking(payToken: string) {
    if (!sl || !retailCart?.lines.length || !payToken) return;
    setCombinedCheckoutBusy(true);
    try {
      const r = await fetch(`/api/public/b/${sl}/pay/${payToken}/checkout-combined`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: retailCartApiItems(retailCart),
          fulfillmentMode,
          fulfillmentDetail: fulfillmentDetail.trim() || undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        mode?: string;
        checkoutUrl?: string;
        payUrl?: string;
        message?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(j.error ?? "Could not start checkout");
      if (j.mode === "stripe" && j.checkoutUrl) {
        clearRetailCart(sl);
        setRetailCart(null);
        window.location.href = j.checkoutUrl;
        return;
      }
      if (j.mode === "dev") {
        clearRetailCart(sl);
        setRetailCart(null);
        setCartDrawerOpen(false);
        window.location.href = j.payUrl ?? guestBookTokenPath(sl, "pay", payToken);
        return;
      }
      throw new Error(j.message ?? "Unexpected checkout response");
    } catch (e) {
      toast({
        title: "Could not open checkout",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setCombinedCheckoutBusy(false);
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
          "mx-auto px-4 sm:px-6 py-6 pb-6 md:pb-8 relative z-10",
          showRetailCartBar && pastHero && aiOn && "pb-32",
          showRetailCartBar && !(pastHero && aiOn) && "pb-24",
          !showRetailCartBar && pastHero && aiOn && "pb-20",
          step === "services" ? "max-w-6xl w-full" : "max-w-xl",
          beautyBook && step === "services" && "beauty-public-shell",
          beautyBook &&
            step === "services" &&
            beautyCssPreset === "editorial" &&
            "beauty-public-shell--editorial",
          wellnessPublic && step === "services" && "wellness-public-shell",
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
              heroTagline={
                beautyPublic
                  ? beautyPublicHeroTagline(beautyCssPreset)
                  : wellnessPublic
                    ? wellnessPublicHeroTagline(presentationPreset)
                    : undefined
              }
              heroTitle={
                beautyPublic
                  ? beautyPublicHeroTitle(vocab.serviceNoun)
                  : wellnessPublic
                    ? guestPublic.heroTitle
                    : undefined
              }
              onHeroCta={() =>
                document.getElementById("public-service-menu")?.scrollIntoView({ behavior: "smooth" })
              }
              onOpenChat={aiOn ? requestChatOpen : undefined}
              showMessage={aiOn && !beautyPublic}
            />
            <div ref={heroSentinelRef} className="h-px w-full" aria-hidden />
            {b.chairHosting && slug ? (
              <div className="mt-4 mb-2">
                <PublicChairHostingStrip slug={slug} listing={b.chairHosting} />
              </div>
            ) : null}
            {packBookNext && packageCreditBook ? (
              <div
                className="mt-4 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm"
                data-testid="pack-book-next-banner"
              >
                <p className="font-medium">Pack purchased — book your first session</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Choose a session below. Your pack credit will apply automatically.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8"
                  onClick={() => setPackBookNext(false)}
                >
                  Dismiss
                </Button>
              </div>
            ) : null}
            {!beautyPublic && !wellnessPublic ? (
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
          </>
        ) : null}

        {step === "services" ? (
          <>
            {isPatchTestErr && friendlyValidationErr ? (
              <div
                className="text-sm border-l-2 border-primary pl-3 py-1 space-y-2 mb-4"
                data-testid="public-patch-test-gate"
              >
                <p className="text-muted-foreground">{friendlyValidationErr}</p>
                {patchTestService ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValidationErr(null);
                      selectPublicService(patchTestService as PublicService);
                    }}
                  >
                    Book patch test
                  </Button>
                ) : null}
              </div>
            ) : null}
            <PublicBookServicesStep
            staffForward={staffForward}
            staff={b.staff}
            selectedStaff={selectedStaff}
            onSelectStaff={setSelectedStaff}
            teamNoun={vocab.teamNoun}
            services={b.services}
            vertical={b.vertical}
            category={b.category}
            featuredServiceIds={b.publicFeaturedServiceIds}
            catalogTitle={vocab.publicBookCatalogTitle}
            catalogLayout={beautyCatalogLayout}
            selectedService={selectedService}
            onSelectService={selectPublicService}
            beautyBook={beautyBook}
            beautyPublic={beautyPublic}
            wellnessPublic={wellnessPublic}
            retailEnabled={
              isPublicRetailVertical(b?.vertical) && !!b.retailStore?.settings?.enabled
            }
            retailTitle={b.retailStore?.settings?.title ?? "Take home"}
            retailProducts={b.retailStore?.products ?? []}
            retailCartQty={retailCartQty}
            onAddRetailToBag={handleAddRetailToBag}
            onChangeRetailQty={handleChangeRetailQty}
            wellnessSlug={sl}
            aiOn={aiOn}
            onChat={aiOn ? requestChatOpen : undefined}
            pickServiceHint={pickServiceHint}
            cancelWindowHours={b.policyTrust?.cancelWindowHours}
            giftComingSoonNote={guestPublic.giftComingSoonNote}
            designShowcase={b.designShowcase}
            onBook={() => {
              if (selectedService) {
                setPickServiceHint(false);
                setStep("slots");
                return;
              }
              setPickServiceHint(true);
              toast({
                title: beautyPublic ? "Choose a treatment first" : `Choose a ${vocab.serviceNoun.toLowerCase()} first`,
                description: "Pick from the menu above, then continue to choose a time.",
              });
              document.getElementById("public-service-menu")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          </>
        ) : null}

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
                <Label htmlFor="public-staff">
                  {wellnessPublic ? guestPublic.staffSelectLabel : `${vocab.teamNoun} member`}
                </Label>
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
              <div className="space-y-3 py-4 border rounded-md px-4">
                <p className="text-center text-sm text-muted-foreground">
                  No available times on this date
                </p>
                {waitlistDone ? (
                  <p className="text-sm text-center text-emerald-700 dark:text-emerald-300">
                    You are on the waitlist — we will reach out when a slot opens.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-center text-muted-foreground">
                      Leave your details and we will text you when something opens.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <Input
                        placeholder="Mobile"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={waitlistBusy || !firstName.trim() || phone.trim().length < 8}
                      onClick={() => {
                        if (!sl || !selectedService) return;
                        setWaitlistBusy(true);
                        void fetch(`/api/public/b/${encodeURIComponent(sl)}/waitlist/join`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            serviceId: selectedService.id,
                            staffId: selectedStaff || undefined,
                            customerFirstName: firstName.trim(),
                            customerPhone: phone.trim(),
                            notes: notes.trim() || undefined,
                          }),
                        })
                          .then(async (r) => {
                            if (!r.ok) {
                              const j = await r.json().catch(() => ({}));
                              throw new Error((j as { error?: string }).error ?? "Could not join");
                            }
                            setWaitlistDone(true);
                          })
                          .catch((e: unknown) => {
                            setValidationErr(
                              parsePublicApiError(e, "Could not join waitlist"),
                            );
                          })
                          .finally(() => setWaitlistBusy(false));
                      }}
                    >
                      {waitlistBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Join waitlist"
                      )}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div>
                <Label className="mb-2 block">
                  {b.countryPack?.publicBooking.pickTime ?? "Pick a time"}
                </Label>
                <PublicBookingTimePicker
                  slots={availableSlots}
                  selectedStartAt={selectedSlot}
                  timeZone={b.timezone}
                  onSelect={(startAt) => {
                    setSelectedSlot(startAt);
                    setStep("details");
                  }}
                />
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
                  placeholder={LIVIA_FORM_EXAMPLES.guestEmail}
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
              {guestContext?.recognized ? (
                <p
                  className="text-xs rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-muted-foreground"
                  data-testid="public-guest-recognized"
                >
                  {guestContext.patchTestValid
                    ? "Welcome back — your patch test is on file for this studio."
                    : "Welcome back — confirm patch-test status below if this treatment needs one."}
                  {guestContext.lastVisits?.find((v) => v.serviceId === selectedService?.id)
                    ?.fillHint ? (
                    <span className="block mt-1 text-foreground/90">
                      {
                        guestContext.lastVisits.find((v) => v.serviceId === selectedService?.id)
                          ?.fillHint
                      }
                    </span>
                  ) : null}
                </p>
              ) : null}
              {phone.trim() && !hubAuthenticated ? (
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
              {activeBookingGuards.length > 0 && (
                <div
                  className="space-y-3 rounded-lg border border-primary/20 p-4 bg-primary/5"
                  data-testid="public-booking-guards"
                >
                  <p className="text-sm font-medium">{guardSectionTitle(b.vertical, b.category)}</p>
                  {activeBookingGuards.map((g) => (
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

              {guestContext?.recognized && (guestContext.pets?.length ?? 0) > 0 ? (
                <div
                  className="space-y-2 rounded-lg border border-border/60 p-4"
                  data-testid="public-booking-pet-picker"
                >
                  <p className="text-sm font-medium">Which pet is this visit for?</p>
                  {guestContext.pets!.map((pet) => (
                    <label key={pet.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedPetIds.includes(pet.id)}
                        onCheckedChange={(v) => {
                          setSelectedPetIds((prev) =>
                            v === true
                              ? [...new Set([...prev, pet.id])]
                              : prev.filter((id) => id !== pet.id),
                          );
                        }}
                      />
                      <span>
                        {pet.name}
                        {pet.breed ? ` (${pet.breed})` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}

              {packageCreditBook ? (
                <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer">
                  <Checkbox
                    checked={usePackageCredit}
                    onCheckedChange={(v) => setUsePackageCredit(v === true)}
                    data-testid="use-package-credit"
                  />
                  <span className="text-sm leading-snug">
                    <span className="font-medium">Use session pack credit</span>
                    <span className="block text-muted-foreground text-xs mt-0.5">
                      If you have a package on file, we&apos;ll apply one session — no deposit needed.
                    </span>
                  </span>
                </label>
              ) : null}

              {isBodyArtConsult ? (
                <div className="space-y-2">
                  <Label htmlFor="consult-reference-url">Reference image URL (optional)</Label>
                  <Input
                    id="consult-reference-url"
                    value={consultReferenceUrl}
                    onChange={(e) => setConsultReferenceUrl(e.target.value)}
                    placeholder="Link to inspiration photo"
                    data-testid="consult-reference-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a link to your reference — the artist will review before your session.
                  </p>
                </div>
              ) : null}

              {isCouplesBook ? (
                <div
                  className="space-y-3 rounded-lg border border-primary/20 p-4 bg-primary/5"
                  data-testid="public-booking-couples-partner"
                >
                  <p className="text-sm font-medium">Partner details</p>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll book you both into the same session time.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="partner-first-name">Partner first name *</Label>
                      <Input
                        id="partner-first-name"
                        value={partnerFirstName}
                        onChange={(e) => setPartnerFirstName(e.target.value)}
                        data-testid="input-partner-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner-last-name">Partner last name</Label>
                      <Input
                        id="partner-last-name"
                        value={partnerLastName}
                        onChange={(e) => setPartnerLastName(e.target.value)}
                        data-testid="input-partner-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partner-phone">Partner phone</Label>
                    <Input
                      id="partner-phone"
                      type="tel"
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                      data-testid="input-partner-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partner-email">Partner email</Label>
                    <Input
                      id="partner-email"
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      data-testid="input-partner-email"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    At least one of partner phone or email is required.
                  </p>
                </div>
              ) : null}

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

              {stepValidationMessage("details") && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  {stepValidationMessage("details")}
                </div>
              )}

              <PublicBookingSummaryCard
                className="bg-muted/50"
                serviceName={selectedService.name}
                startAt={selectedSlot}
                durationMinutes={selectedService.durationMinutes}
                priceMinor={selectedService.priceMinor}
                currency={selectedService.currency}
                serviceNoun={vocab.serviceNoun}
                depositDueMinor={depositDuePreviewMinor}
                depositPercent={depositPercentPreview}
                depositPolicySummary={b.depositPolicySummary}
              />

              {b.bookingTermsBlock ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {b.bookingTermsBlock}
                </p>
              ) : null}
              {b.privacyNoticeBlock ? (
                <p className="text-[11px] text-muted-foreground/90 leading-relaxed">
                  {b.privacyNoticeBlock}
                </p>
              ) : null}

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
            {stepValidationMessage("consent") && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {stepValidationMessage("consent")}
              </div>
            )}
            <PublicBookingSummaryCard
              className="bg-muted/40"
              serviceName={selectedService.name}
              startAt={selectedSlot}
              durationMinutes={selectedService.durationMinutes}
              priceMinor={selectedService.priceMinor}
              currency={selectedService.currency}
              serviceNoun={vocab.serviceNoun}
              depositDueMinor={depositDuePreviewMinor}
              depositPercent={depositPercentPreview}
              depositPolicySummary={b.depositPolicySummary}
            />

            <Button
              className="w-full hidden md:flex"
              disabled={createBooking.isPending || packCheckoutBusy}
              onClick={handleBook}
              data-testid="button-confirm-booking"
            >
              {packCheckoutBusy
                ? "Starting checkout..."
                : isSelectedPackage
                  ? "Purchase pack"
                  : createBooking.isPending
                    ? "Booking..."
                    : confirmLabel}
            </Button>
          </section>
        )}

        {/* Step: Confirmed */}
        {step === "confirmed" && confirmation && (
          <div
            className={`text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 rounded-2xl p-2 ${
              wellnessPublic ? "wellness-success-glow motion-glow-success" : "motion-glow-success"
            } ${celebrationEnabled() ? "celebrate-shimmer" : ""}`}
            style={
              wellnessExperience
                ? ({ "--wellness-breath-ms": `${wellnessExperience.motion.successGlowMs}ms` } as CSSProperties)
                : undefined
            }
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--chart-3))]/10 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--chart-3))]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-confirmed">
                {confirmation.status === "PENDING"
                  ? guestPublic.confirmPendingTitle
                  : guestPublic.confirmBookedTitle}
              </h2>
              <p className="text-muted-foreground mt-2">
                {confirmation.status === "PENDING"
                  ? pendingReasonLabel(confirmation.pendingReason, b?.vertical, b?.category)
                  : wellnessExperience?.ritualCopy.arrivalCalm ??
                    guestPublic.confirmBookedTitle + " — details below."}
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
                      ? pendingReasonLabel(confirmation.pendingReason, b?.vertical, b?.category)
                      : "Confirmed"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Confirmation</span>
                  <span className="font-mono text-xs">
                    #{confirmation.bookingId.slice(-8)}
                  </span>
                </div>
                {(confirmation.depositDueMinor ?? 0) > 0 ||
                (b?.policyTrust?.depositRequired && selectedService) ? (
                  <GuestMoneyBreakdown
                    priceMinor={selectedService?.priceMinor ?? 0}
                    currency={confirmation.currency ?? selectedService?.currency ?? "EUR"}
                    depositPercent={b?.policyTrust?.depositPercent ?? 0}
                    depositDueMinor={confirmation.depositDueMinor ?? 0}
                    depositPaidMinor={0}
                    depositRequired={(confirmation.depositDueMinor ?? 0) > 0}
                    dueLabel={
                      confirmation.depositPayUrl
                        ? pendingReasonLabel(confirmation.pendingReason, b?.vertical, b?.category)
                        : undefined
                    }
                  />
                ) : null}
                {confirmation.depositPayUrl && (confirmation.depositDueMinor ?? 0) > 0 ? (
                  <Button asChild className="w-full mt-2" data-testid="public-pay-deposit">
                    <a href={confirmation.depositPayUrl}>Pay deposit</a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {confirmation.savedToMyLivia && !hubAuthenticated ? (
              <Card className="border-primary/20 bg-primary/5" data-testid="post-book-my-livia-nudge">
                <CardContent className="py-4 space-y-2 text-center">
                  <p className="text-sm font-medium">{GUEST_HUB_COPY.postBookVerifyTitle}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {GUEST_HUB_COPY.postBookVerifyBody}
                  </p>
                  <Button asChild className="w-full mt-1" variant="default">
                    <Link href="/my">{GUEST_HUB_COPY.postBookVerifyCta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

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
                {hubAuthenticated || confirmation.savedToMyLivia
                  ? `Tip: add ${b.name} to your home screen for one-tap rebooking.`
                  : `Tip: add ${b.name} to your home screen for quick access to My Livia.`}
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

            {confirmation.guestToken &&
            retailCart &&
            retailCart.lines.length > 0 &&
            isPublicRetailVertical(b?.vertical) ? (
              <Card className="text-left border-primary/20">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium">Your bag</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {retailCart.lines.map((line) => (
                      <li key={line.productId} className="flex justify-between gap-2">
                        <span className="truncate">
                          {line.name} × {line.quantity}
                        </span>
                        <span className="tabular-nums shrink-0">
                          {formatCurrency(line.priceMinor * line.quantity, line.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    disabled={combinedCheckoutBusy}
                    data-testid="public-combined-checkout"
                    onClick={() => void checkoutCombinedWithBooking(confirmation.guestToken!)}
                  >
                    {combinedCheckoutBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Pay deposit + bag in one checkout
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    One secure payment for your visit deposit and take-home items.
                  </p>
                </CardContent>
              </Card>
            ) : null}

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

      {step === "services" && aiOn ? (
        <PublicBookLivBar
          visible={pastHero}
          livActive={chatOpenRequest > 0}
          onOpenChat={requestChatOpen}
          bottomOffsetPx={cartBarHeightPx}
        />
      ) : null}

      {showRetailCartBar && retailCart ? (
        <>
          <PublicRetailCartBar
            cart={retailCart}
            checkoutBusy={retailCheckoutBusy || combinedCheckoutBusy}
            onViewBag={() => setCartDrawerOpen(true)}
          />
          <PublicRetailCartDrawer
            open={cartDrawerOpen}
            onOpenChange={setCartDrawerOpen}
            cart={retailCart}
            fulfillmentOptions={retailFulfillmentOptions}
            fulfillmentMode={fulfillmentMode}
            onFulfillmentModeChange={setFulfillmentMode}
            fulfillmentDetail={fulfillmentDetail}
            onFulfillmentDetailChange={setFulfillmentDetail}
            onChangeQty={handleChangeRetailQty}
            checkoutBusy={retailCheckoutBusy || combinedCheckoutBusy}
            onCheckoutRetailOnly={() => void checkoutRetailCart()}
            combinedAvailable={false}
          />
        </>
      ) : null}

      {showStickyCta && selectedService && (
        <PublicBookingStickySummary
          serviceName={selectedService.name}
          startAt={selectedSlot}
          priceMinor={selectedService.priceMinor}
          currency={selectedService.currency}
          depositDueMinor={depositDuePreviewMinor}
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
            vertical={b.vertical}
            category={b.category}
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
