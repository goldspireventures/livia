import { useEffect, useState } from "react";

import { Link } from "wouter";

import { Button } from "@/components/ui/button";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import { useBusiness } from "@/lib/business-context";

import { OnboardingVideoPlayer } from "@/components/onboarding-video-player";

import { getOnboardingVideoUrl, ONBOARDING_VIDEO_COPY } from "@/lib/onboarding-videos";

import {

  BookOpen,

  Calendar,

  Inbox,

  LayoutDashboard,

  MessageCircle,

  Settings,

  Sparkles,

  PlayCircle,

} from "lucide-react";



const STORAGE_KEY = "livia.platformTour.dismissed.v1";



type TourStep = {

  id: string;

  icon: typeof LayoutDashboard;

  title: string;

  body: string;

  href: string;

  cta: string;

  videoKey?: "tour" | "channels" | "liv";

};



const TOUR_STEPS: TourStep[] = [

  {

    id: "welcome",

    icon: PlayCircle,

    title: "Quick tour + optional video",

    body: "Watch the short overview, then step through where bookings, inbox, and Liv live. Skip anytime.",

    href: "/dashboard",

    cta: "Start tour",

    videoKey: "tour",

  },

  {

    id: "dashboard",

    icon: LayoutDashboard,

    title: "Today / Dashboard",

    body: "Your morning briefing, Liv moments, and what needs attention before the first client arrives.",

    href: "/dashboard",

    cta: "Open dashboard",

  },

  {

    id: "inbox",

    icon: Inbox,

    title: "Inbox",

    body: "WhatsApp, Instagram DMs, SMS, and web chat in one queue. Hand off to your team anytime.",

    href: "/inbox",

    cta: "Open inbox",

  },

  {

    id: "bookings",

    icon: Calendar,

    title: "Bookings",

    body: "Calendar, new booking, running late, and no-show recovery — the operational spine of the day.",

    href: "/bookings",

    cta: "Open bookings",

  },

  {

    id: "comms",

    icon: MessageCircle,

    title: "Communications",

    body: "Connect WhatsApp and Instagram with the step-by-step wizard. Provision SMS for reminders and day-of texts.",

    href: "/settings?tab=comms",

    cta: "Set up channels",

    videoKey: "channels",

  },

  {

    id: "liv",

    icon: Sparkles,

    title: "Liv",

    body: "Tone, greeting, knowledge, and auto-book live under Settings → Liv. This is how she sounds like your shop.",

    href: "/settings?tab=liv",

    cta: "Configure Liv",

    videoKey: "liv",

  },

  {

    id: "settings",

    icon: Settings,

    title: "Settings & integrations",

    body: "Team, services, billing, Booksy/CSV import, and partner webhooks — everything else lives here.",

    href: "/settings",

    cta: "All settings",

  },

];



function shouldOfferTour(business: { onboardingState?: { percentComplete?: number } } | null): boolean {

  if (!business) return false;

  if (typeof window === "undefined") return false;

  try {

    if (window.localStorage.getItem(STORAGE_KEY) === "1") return false;

  } catch {

    return false;

  }

  const pct = business.onboardingState?.percentComplete;

  if (pct != null && pct >= 100) return true;

  // New starters (establishing) and veterans both get the tour once onboarding has momentum.
  if (pct != null && pct >= 35) return true;

  return false;

}



export function PlatformTour() {

  const { business } = useBusiness();

  const [open, setOpen] = useState(false);

  const [index, setIndex] = useState(0);



  useEffect(() => {

    if (shouldOfferTour(business as { onboardingState?: { percentComplete?: number } } | null)) {

      setOpen(true);

      setIndex(0);

    }

  }, [business?.id, (business as { onboardingState?: { percentComplete?: number } } | null)?.onboardingState?.percentComplete]);



  function dismiss() {

    try {

      window.localStorage.setItem(STORAGE_KEY, "1");

    } catch {

      /* ignore */

    }

    setOpen(false);

  }



  const step = TOUR_STEPS[index];

  if (!step) return null;

  const Icon = step.icon;

  const isLast = index >= TOUR_STEPS.length - 1;

  const videoUrl = step.videoKey ? getOnboardingVideoUrl(step.videoKey) : null;

  const videoMeta = step.videoKey ? ONBOARDING_VIDEO_COPY[step.videoKey] : null;



  return (

    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>

      <DialogContent className="sm:max-w-lg" data-testid="platform-tour-dialog">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2 font-serif">

            <BookOpen className="h-5 w-5 text-primary" />

            {step.title}

          </DialogTitle>

          <DialogDescription>

            Step {index + 1} of {TOUR_STEPS.length} — {step.body}

          </DialogDescription>

        </DialogHeader>



        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">

          {videoUrl && videoMeta ? (

            <OnboardingVideoPlayer

              url={videoUrl}

              title={`${videoMeta.title} (${videoMeta.duration})`}

              testId="platform-tour-video"

            />

          ) : null}

          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">

            <Icon className="h-8 w-8 shrink-0 text-primary" />

            <div>

              <p className="font-medium text-sm">{step.title}</p>

              <p className="text-sm text-muted-foreground mt-1">{step.body}</p>

            </div>

          </div>

          {index > 0 ? (

            <Button variant="outline" size="sm" asChild className="w-full">

              <Link href={step.href}>{step.cta}</Link>

            </Button>

          ) : null}

        </div>



        <DialogFooter className="flex-col sm:flex-row gap-2">

          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>

            Skip tour

          </Button>

          <div className="flex gap-2 ml-auto">

            {index > 0 ? (

              <Button type="button" variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)}>

                Back

              </Button>

            ) : null}

            {isLast ? (

              <Button type="button" size="sm" onClick={dismiss}>

                Got it

              </Button>

            ) : (

              <Button type="button" size="sm" onClick={() => setIndex((i) => i + 1)}>

                Next

              </Button>

            )}

          </div>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}



export function resetPlatformTourForDev() {

  try {

    window.localStorage.removeItem(STORAGE_KEY);

  } catch {

    /* ignore */

  }

}


