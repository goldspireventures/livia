/** Ambient orbital watermark — platform-default Constellation inheritance (M4 → W4). */
export function PlatformDefaultAmbient() {
  return (
    <div className="platform-default-ambient" aria-hidden>
      <svg className="platform-default-ambient__svg" viewBox="0 0 500 500">
        <defs>
          <linearGradient id="pd-orbit-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d9c39a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8a7549" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx="250" cy="250" r="175" fill="none" stroke="url(#pd-orbit-gold)" strokeWidth="1" />
        <circle cx="250" cy="250" r="108" fill="none" stroke="rgba(217,195,154,0.35)" strokeWidth="0.75" />
        <ellipse cx="250" cy="250" rx="175" ry="72" fill="none" stroke="rgba(217,195,154,0.2)" strokeWidth="0.75" />
        <ellipse cx="250" cy="250" rx="72" ry="175" fill="none" stroke="rgba(217,195,154,0.2)" strokeWidth="0.75" />
      </svg>
    </div>
  );
}
