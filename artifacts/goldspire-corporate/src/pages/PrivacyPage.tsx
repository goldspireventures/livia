import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";

export function PrivacyPage() {
  return (
    <div className="bg-navy min-h-screen">
      <div className="mx-auto max-w-3xl section-pad">
        <Link href="/" className="text-sm text-muted hover:text-gold">
          ← Home
        </Link>
        <Reveal>
          <h1 className="heading-section mt-8">Privacy Policy</h1>
          <p className="mt-6 text-muted leading-relaxed">
            Goldspire Ventures Ltd (&ldquo;Goldspire&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your
            privacy. This policy describes how we handle information when you visit goldspireventures.com or
            contact us.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-10 text-lg font-semibold text-gold">Information we collect</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We may collect basic analytics data (pages visited, browser type, approximate location) and any
            information you voluntarily provide via email to support@goldspireventures.com.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="mt-10 text-lg font-semibold text-gold">How we use it</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            To respond to enquiries, improve our corporate website, and communicate regarding partnership or
            investment opportunities. We do not sell personal data.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <h2 className="mt-10 text-lg font-semibold text-gold">Contact</h2>
          <p className="mt-3 text-sm text-muted">
            <a href="mailto:support@goldspireventures.com" className="text-gold hover:underline">
              support@goldspireventures.com
            </a>
          </p>
          <p className="mt-8 text-xs text-soft/50">Last updated June 2026 · Goldspire Ventures Ltd, United Kingdom</p>
        </Reveal>
      </div>
    </div>
  );
}
