import { Route, Switch, useRoute } from "wouter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { HomePage } from "@/pages/HomePage";
import { PhilosophyPage } from "@/pages/PhilosophyPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { IndustriesPage } from "@/pages/IndustriesPage";
import { VisionPage } from "@/pages/VisionPage";
import { PartnerPage } from "@/pages/PartnerPage";
import { CompanyPage } from "@/pages/CompanyPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { getCompanyBySlug } from "@/data/portfolio";

function CompanyRoute() {
  const [, params] = useRoute("/companies/:slug");
  const company = params?.slug ? getCompanyBySlug(params.slug) : undefined;

  if (!company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">Company not found</h1>
        <a href="/" className="mt-4 text-gold hover:underline">
          Return home
        </a>
      </div>
    );
  }

  return <CompanyPage company={company} />;
}

export function App() {
  return (
    <div className="min-h-screen bg-navy text-white">
      <ScrollToTop />
      <SiteNav />
      <main>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/philosophy" component={PhilosophyPage} />
          <Route path="/portfolio" component={PortfolioPage} />
          <Route path="/industries" component={IndustriesPage} />
          <Route path="/vision" component={VisionPage} />
          <Route path="/partner" component={PartnerPage} />
          <Route path="/companies/:slug" component={CompanyRoute} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route>
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
              <h1 className="text-2xl font-semibold">Page not found</h1>
              <a href="/" className="mt-4 text-gold hover:underline">
                Return home
              </a>
            </div>
          </Route>
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}
