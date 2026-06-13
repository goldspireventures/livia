import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Instagram, Mail, Menu, Phone, X } from "lucide-react";
import type { EventVendorSitePayload } from "@/hooks/use-event-vendor-site";
import { EventVendorPoweredBy } from "@/components/event-vendor/event-vendor-powered-by";
import "@/styles/event-vendor-site.css";

type Props = {
  slug: string;
  data: EventVendorSitePayload;
  children: ReactNode;
};

const NAV = [
  { href: "", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/enquire", label: "Enquire" },
] as const;

export function EventVendorChrome({ slug, data, children }: Props) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const base = `/e/${slug}`;
  const { business } = data;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const ig = business.instagramHandle?.replace(/^@/, "");

  return (
    <div className="ev-site min-h-screen" data-testid="event-vendor-site">
      <header className={`ev-nav ${scrolled ? "ev-nav--scrolled" : ""}`}>
        <div className="ev-nav__inner">
          <Link href={base} className="ev-brand">
            {business.logoUrl ? (
              <span className="ev-brand__lockup">
                <img src={business.logoUrl} alt="" className="ev-brand__logo" />
                <span>{business.name}</span>
              </span>
            ) : (
              business.name
            )}
          </Link>

          <nav className="ev-nav__links" aria-label="Primary">
            {NAV.map((item) => {
              const path = item.href ? `${base}${item.href}` : base;
              const active =
                item.href === ""
                  ? location === base || location === `${base}/`
                  : location.startsWith(`${base}${item.href}`);
              return (
                <Link key={item.label} href={path} aria-current={active ? "page" : undefined}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ev-nav__actions">
            <Link href={`${base}/enquire`} className="ev-btn ev-btn--primary ev-nav__cta">
              Get a quote
            </Link>
            <button
              type="button"
              className="ev-nav__menu-btn"
              aria-expanded={menuOpen}
              aria-controls="ev-mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          id="ev-mobile-nav"
          className={`ev-mobile-nav ${menuOpen ? "ev-mobile-nav--open" : ""}`}
          aria-hidden={!menuOpen}
        >
          <nav className="ev-mobile-nav__inner" aria-label="Mobile">
            {NAV.map((item) => {
              const path = item.href ? `${base}${item.href}` : base;
              const active =
                item.href === ""
                  ? location === base || location === `${base}/`
                  : location.startsWith(`${base}${item.href}`);
              return (
                <Link key={item.label} href={path} aria-current={active ? "page" : undefined}>
                  {item.label}
                </Link>
              );
            })}
            <Link href={`${base}/enquire`} className="ev-btn ev-btn--primary ev-mobile-nav__cta">
              Get a quote
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="ev-footer">
        <div className="ev-footer__inner">
          <div>
            <p className="ev-footer__brand">{business.name}</p>
            <p className="ev-muted mt-2 max-w-sm">
              {data.site.heroSubtitle ??
                business.description ??
                "Event styling and decor — weddings, birthdays, and celebrations."}
            </p>
            {business.city ? (
              <p className="ev-muted mt-2 text-sm">{business.city}, Ireland</p>
            ) : null}
          </div>
          <div>
            <p className="ev-footer__label">Contact</p>
            <ul className="ev-footer__list">
              {business.phone ? (
                <li>
                  <a href={`tel:${business.phone}`} className="ev-footer__link">
                    <Phone className="h-4 w-4" />
                    {business.phone}
                  </a>
                </li>
              ) : null}
              {business.email ? (
                <li>
                  <a href={`mailto:${business.email}`} className="ev-footer__link">
                    <Mail className="h-4 w-4" />
                    {business.email}
                  </a>
                </li>
              ) : null}
              {ig ? (
                <li>
                  <a
                    href={`https://instagram.com/${ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ev-footer__link"
                  >
                    <Instagram className="h-4 w-4" />@{ig}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="ev-footer__label">Explore</p>
            <ul className="ev-footer__list ev-muted">
              {NAV.map((item) => (
                <li key={item.label}>
                  <Link href={item.href ? `${base}${item.href}` : base}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="ev-muted text-center text-xs mt-10">
          © {new Date().getFullYear()} {business.name}
        </p>
        <EventVendorPoweredBy className="mt-6" />
      </footer>
    </div>
  );
}
