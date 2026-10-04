/**
 * LanovaLogo — Unique vector brand icon for LANOVA.
 * Features the signature LAN network mesh nodes + glowing radiant Nova star burst
 * rendered in neon lime (#c2f135) and emerald space tones.
 */
export default function LanovaLogo({ size = 28, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="header-lanova-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0e1a11" />
          <stop offset="60%" stopColor="#070e09" />
          <stop offset="100%" stopColor="#0a170d" />
        </linearGradient>

        <linearGradient id="header-lanova-border" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2f135" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#22c55e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#14532d" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="header-lanova-lime" x1="12" y1="16" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e4ff6b" />
          <stop offset="50%" stopColor="#c2f135" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        <radialGradient id="header-lanova-glow" cx="44" cy="22.5" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2f135" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#22c55e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c2f135" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="2" y="3.5" width="60" height="58" rx="15" fill="url(#header-lanova-bg)" stroke="url(#header-lanova-border)" strokeWidth="2.2" />
      <circle cx="44" cy="22.5" r="14" fill="url(#header-lanova-glow)" />

      <path d="M25 22.5 C33 22.5 40 25.5 44 30.5" stroke="#c2f135" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 29.5 C29 29.5 38 33.5 42 40.5" stroke="#c2f135" strokeOpacity="0.3" strokeWidth="2.2" strokeLinecap="round" />

      <path d="M18 20.5 C18 19.4 18.9 18.5 20 18.5 H22 C23.1 18.5 24 19.4 24 20.5 V45.5 C24 46.6 24.9 47.5 26 47.5 H45 C46.1 47.5 47 48.4 47 49.5 V51.5 C47 52.6 46.1 53.5 45 53.5 H20 C18.9 53.5 18 52.6 18 51.5 Z" fill="url(#header-lanova-lime)" />

      <path d="M21 32.5 L33 40.5 L45 50.5" stroke="#c2f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="40.5" r="2.8" fill="#e4ff6b" />

      <circle cx="21" cy="19.5" r="4" fill="#e4ff6b" stroke="#070e09" strokeWidth="1.6" />
      <circle cx="21" cy="50.5" r="4.5" fill="#c2f135" stroke="#070e09" strokeWidth="1.6" />
      <circle cx="46" cy="50.5" r="4" fill="#22c55e" stroke="#070e09" strokeWidth="1.6" />

      <path d="M44 12.5 C44 18.5 47 21.5 53 22.5 C47 23.5 44 26.5 44 32.5 C44 26.5 41 23.5 35 22.5 C41 21.5 44 18.5 44 12.5 Z" fill="#ffffff" />
      <circle cx="44" cy="22.5" r="1.6" fill="#c2f135" />
    </svg>
  );
}
