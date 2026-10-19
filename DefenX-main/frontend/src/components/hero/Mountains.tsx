/** Layered dusk-mountain backdrop built from SVG (no stock photo). */
export function Mountains() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 480" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c0510" /><stop offset=".55" stopColor="#5a1228" /><stop offset="1" stopColor="#8a2a3a" />
        </linearGradient>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6e1d36" /><stop offset="1" stopColor="#2a0813" /></linearGradient>
        <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#45102a" /><stop offset="1" stopColor="#1a050b" /></linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFE2A0" stopOpacity=".55" /><stop offset="1" stopColor="#FFE2A0" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1000" height="480" fill="url(#sky)" />
      <ellipse cx="500" cy="230" rx="380" ry="220" fill="url(#sun)" />
      <path d="M0 330 L60 250 L95 285 L150 190 L205 270 L240 235 L300 330 L300 480 L0 480Z" fill="url(#m1)" />
      <path d="M700 330 L760 245 L800 285 L860 170 L915 260 L950 220 L1000 280 L1000 480 L700 480Z" fill="url(#m1)" />
      <path d="M0 380 L70 300 L120 340 L190 250 L260 345 L330 300 L380 400 L380 480 L0 480Z" fill="url(#m2)" />
      <path d="M620 400 L680 310 L740 350 L820 240 L890 330 L940 290 L1000 360 L1000 480 L620 480Z" fill="url(#m2)" />
      <path d="M150 190 l14 28 -10 -6 -6 20 -8 -22 -12 8z M860 170 l14 30 -10 -6 -6 22 -8 -24 -12 8z" fill="#FFD9B0" opacity=".28" />
      <g stroke="#FFE2A0" strokeOpacity=".25" strokeWidth=".6" fill="none">
        <path d="M150 190 L120 340 M860 170 L890 330 M190 250 L260 345" />
      </g>
    </svg>
  );
}
