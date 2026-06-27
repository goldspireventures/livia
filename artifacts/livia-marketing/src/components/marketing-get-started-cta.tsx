import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { marketingGetStartedPath } from "@/lib/marketing-links";

type MarketingGetStartedCtaProps = {
  id?: string;
  title?: string;
  subtitle?: string;
};

/** Primary post-launch CTA — self-serve signup; partner codes at billing. */
export function MarketingGetStartedCta({
  id = "get-started",
  title = "Get started today",
  subtitle = "Create your account and set up your shop in an afternoon. Have a partner or promo code? Enter it in Billing during setup.",
}: MarketingGetStartedCtaProps) {
  return (
    <section className="cst-waitlist scroll-mt-24" id={id}>
      <div className="cst-waitlist__inner">
        <h2 className="cst-waitlist__title">{title}</h2>
        <p className="cst-waitlist__sub">{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
          <Link
            href={marketingGetStartedPath}
            className="inline-flex items-center gap-2 rounded-sm bg-[#d9c39a] px-5 py-3 text-sm font-medium text-black hover:bg-[#e8d4b0] transition-colors min-h-[44px]"
            data-testid="marketing-get-started-cta"
          >
            Create your account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/contact" className="text-sm text-[#d9c39a] hover:underline min-h-[44px] inline-flex items-center">
            Questions? Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
