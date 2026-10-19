export function ShieldMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 64 70" aria-hidden>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9B5" /><stop offset=".55" stopColor="#D9AD62" /><stop offset="1" stopColor="#98662D" />
        </linearGradient>
        <radialGradient id="sf" cx=".5" cy=".35" r=".8"><stop offset="0" stopColor="#7a1a3a" /><stop offset="1" stopColor="#3A0715" /></radialGradient>
      </defs>
      <path d="M32 3 58 13v21c0 17-11 28-26 33C17 62 6 51 6 34V13z" fill="url(#sf)" stroke="url(#sg)" strokeWidth="3.5" />
      <path d="M32 16 46 22v11c0 9-6 15-14 18-8-3-14-9-14-18V22z" fill="none" stroke="url(#sg)" strokeWidth="2.5" />
      <path d="M26 33l5 5 9-10" fill="none" stroke="url(#sg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand() {
  return (
    <div className="flex flex-col items-center gap-1 pt-5">
      <ShieldMark />
      <div className="font-display text-[26px] font-semibold tracking-[0.18em] text-[#FFF1D6]">DEFENEX</div>
      <div className="text-[8.5px] tracking-[0.28em] text-[#D9AD62]">AI DEVICE PROTECTION</div>
    </div>
  );
}
