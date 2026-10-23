"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { display } from "@/components/ui";

const BLUE_DEEP = "#121B6B";
const BLUE = "#1B2A9B";
const SAFFRON = "#FFB81C";
const MINT = "#3DDBC2";

const MEMBERS = ["Y", "S", "O", "N", "K", "H", "I", "A"];
const RING_RADIUS = 110;

const css = `
.dd-disc { transition: fill 500ms ease, stroke 500ms ease, transform 500ms ease; }
@media (prefers-reduced-motion: reduce) { .dd-disc { transition: none; } }
`;

function TurnCircle({ startIndex }: { startIndex: number }) {
  const [active, setActive] = useState(startIndex);

  // The turn moves to the next member every few seconds, like a real daret.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % MEMBERS.length), 2400);
    return () => clearInterval(id);
  }, []);

  const fontDisplay = "var(--font-display), system-ui, sans-serif";
  const fontSans = "var(--font-sans), system-ui, sans-serif";

  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" role="img" aria-label={`Tour ${active + 1} sur ${MEMBERS.length}`}>
      <circle cx="150" cy="150" r={RING_RADIUS} fill="none" stroke="white" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />

      {MEMBERS.map((letter, i) => {
        const angle = ((-90 + i * (360 / MEMBERS.length)) * Math.PI) / 180;
        const cx = 150 + RING_RADIUS * Math.cos(angle);
        const cy = 150 + RING_RADIUS * Math.sin(angle);
        const isActive = i === active;
        const isDone = i < active;

        return (
          <g key={i} className="dd-disc" style={{ transformOrigin: `${cx}px ${cy}px`, transform: isActive ? "scale(1.18)" : "scale(1)" }}>
            <circle
              className="dd-disc"
              cx={cx}
              cy={cy}
              r="21"
              fill={isActive ? SAFFRON : isDone ? "rgba(61,219,194,0.22)" : "rgba(255,255,255,0.04)"}
              stroke={isActive ? SAFFRON : isDone ? MINT : "rgba(255,255,255,0.3)"}
              strokeWidth="1.5"
            />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={isActive ? BLUE_DEEP : isDone ? MINT : "rgba(255,255,255,0.75)"} style={{ fontFamily: fontDisplay }}>
              {letter}
            </text>
          </g>
        );
      })}

      <text x="150" y="128" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.6)" style={{ fontFamily: fontSans }}>
        Tour
      </text>
      <text x="150" y="176" textAnchor="middle" fontSize="56" fontWeight="800" fill="white" style={{ fontFamily: fontDisplay }}>
        {active + 1}
      </text>
      <text x="150" y="198" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.6)" style={{ fontFamily: fontSans }}>
        sur {MEMBERS.length}
      </text>
    </svg>
  );
}

// Eight-point star tiling, inspired by zellige tilework.
function ZelligePattern() {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="zellige" width="72" height="72" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="1">
            <rect x="16" y="16" width="40" height="40" />
            <rect x="16" y="16" width="40" height="40" transform="rotate(45 36 36)" />
            <circle cx="36" cy="36" r="6" />
            <path d="M0 0 L16 16 M72 0 L56 16 M0 72 L16 56 M72 72 L56 56" />
          </g>
        </pattern>
        <radialGradient id="glow" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0" />
          <stop offset="100%" stopColor={BLUE_DEEP} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige)" />
      <rect width="100%" height="100%" fill="url(#glow)" />
    </svg>
  );
}

export function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`${display} flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold`}
        style={dark ? { backgroundColor: BLUE, color: SAFFRON } : { backgroundColor: SAFFRON, color: BLUE_DEEP }}
      >
        D
      </span>
      <span className={`${display} text-xl font-bold ${dark ? "text-[#0E1442]" : "text-white"}`}>Daret Digital</span>
    </div>
  );
}

interface AuthShellProps {
  headline: ReactNode;
  tagline: string;
  startIndex?: number;
  children: ReactNode;
}

export default function AuthShell({ headline, tagline, startIndex = 2, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F4F6FB]">
      <style>{css}</style>

      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 lg:flex" style={{ backgroundColor: BLUE }}>
        <ZelligePattern />
        <div className="relative">
          <LogoMark />
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <TurnCircle startIndex={startIndex} />
        </div>

        <div className="relative max-w-md">
          <h2 className={`${display} text-5xl font-extrabold leading-[1.05] text-white`}>{headline}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">{tagline}</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[45%] lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <LogoMark dark />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}