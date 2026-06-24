import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PricingPage from "@/pages/pricing";
import HowItWorksPage from "@/pages/how-it-works";
import VerticalPage from "@/pages/vertical";
import ContactPage from "@/pages/contact";
import ChangelogPage from "@/pages/changelog";
import StatusPage from "@/pages/status";
import ForChairRentalPage from "@/pages/for-chair-rental";
import DeHomePage from "@/pages/de";
import EuropePage from "@/pages/europe";
import EuAiPage from "@/pages/eu-ai";
import VerticalsIndexPage from "@/pages/verticals-index";
import BookDemoPage from "@/pages/book-demo";
import GetStartedPage from "@/pages/get-started";
import DemoPage from "@/pages/demo";
import { LegalDpaPage, LegalPrivacyPage, LegalTosPage } from "@/pages/legal";
import { useEffect, useRef } from "react";
import { MarketingErrorBoundary } from "@/components/marketing-error-boundary";
import { metaForPath } from "@/lib/marketing-route-meta";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/de" component={DeHomePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/europe" component={EuropePage} />
      <Route path="/eu-ai" component={EuAiPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/verticals" component={VerticalsIndexPage} />
      <Route path="/verticals/:slug" component={VerticalPage} />
      <Route path="/book-demo" component={BookDemoPage} />
      <Route path="/get-started" component={GetStartedPage} />
      <Route path="/demo" component={DemoPage} />
      <Route path="/for/chair-rental" component={ForChairRentalPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/changelog" component={ChangelogPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/legal/privacy" component={LegalPrivacyPage} />
      <Route path="/legal/tos" component={LegalTosPage} />
      <Route path="/legal/dpa" component={LegalDpaPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function RouteDocumentMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const pathOnly = location.split("#")[0]?.split("?")[0] ?? "/";
    const meta = metaForPath(pathOnly);
    document.title = meta.title;
    if (meta.description) {
      let tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute("content", meta.description);
    }
    if (pathOnly === "/de") {
      document.documentElement.lang = "de";
    } else {
      document.documentElement.lang = "en";
    }
  }, [location]);

  return null;
}

function ScrollToTopOnRouteChange() {
  const [location] = useLocation();
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    // Only scroll to top when the pathname changes (not hash-only changes).
    const pathOnly = location.split("#")[0] ?? location;
    if (prevPathRef.current && prevPathRef.current !== pathOnly) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
    prevPathRef.current = pathOnly;
  }, [location]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MarketingErrorBoundary>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouteDocumentMeta />
            <ScrollToTopOnRouteChange />
            <Router />
          </WouterRouter>
        </MarketingErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
