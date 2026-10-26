"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useRef } from "react";
import { display } from "@/components/ui";

const BLUE_DEEP = "#121B6B";
const BLUE = "#1B2A9B";
const SAFFRON = "#FFB81C";
const MINT = "#3DDBC2";

export const authButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B2A9B] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#121B6B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/50 disabled:cursor-not-allowed disabled:opacity-60";

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

const css = `
.vt-tilt { transform: perspective(1100px) rotateY(calc(var(--mx, 0) * 9deg)) rotateX(calc(var(--my, 0) * -7deg)); transition: transform 180ms ease-out; will-change: transform; }
.vt-dial, .vt-handle { transform-box: fill-box; transform-origin: center; transition: transform 260ms cubic-bezier(.3,1.3,.5,1); }
.vt-dial { transform: rotate(calc(var(--mx, 0) * 150deg)); }
.vt-handle { transform: rotate(calc(var(--mx, 0) * -60deg)); }
.vt-coin { transform-box: fill-box; transform-origin: center; animation: vt-float 5s ease-in-out infinite; }
@keyframes vt-float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(8deg); } }
@media (prefers-reduced-motion: reduce) {
  .vt-tilt, .vt-dial, .vt-handle { transform: none; transition: none; }
  .vt-coin { animation: none; }
}
`;

const STAR_POINTS = Array.from({ length: 24 }, (_, i) => i);

function Vault() {
  // Stacked, slightly offset copies of the body give the box its depth.
  const layers = Array.from({ length: 15 }, (_, i) => i / 14);

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible" role="img" aria-label="Un coffre-fort qui garde la cagnotte du groupe">
      <defs>
        <linearGradient id="vt-side" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1B2A9B" />
          <stop offset="1" stopColor="#6F8CF5" />
        </linearGradient>
        <linearGradient id="vt-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4C6AEB" />
          <stop offset="1" stopColor="#2437B5" />
        </linearGradient>
        <linearGradient id="vt-door" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3550D8" />
          <stop offset="1" stopColor="#1B2A9B" />
        </linearGradient>
        <linearGradient id="vt-dialring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7DF0DC" />
          <stop offset="1" stopColor="#1FB89F" />
        </linearGradient>
        <filter id="vt-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <ellipse cx="190" cy="356" rx="150" ry="15" fill="rgba(18,27,107,0.28)" filter="url(#vt-blur)" />

      {/* body depth */}
      {layers
        .slice()
        .reverse()
        .map((t) => (
          <rect
            key={t}
            x={66 + 40 * t}
            y={100 - 30 * t}
            width="232"
            height="232"
            rx="36"
            fill="url(#vt-side)"
            stroke="rgba(255,255,255,0.07)"
          />
        ))}

      {/* front plate */}
      <rect x="66" y="100" width="232" height="232" rx="36" fill="url(#vt-front)" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
      <rect x="88" y="122" width="188" height="188" rx="26" fill="url(#vt-door)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

      {/* bolts */}
      {[
        [102, 136],
        [262, 136],
        [102, 296],
        [262, 296],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="rgba(255,255,255,0.35)" />
      ))}

      {/* dial */}
      <circle cx="160" cy="216" r="58" fill="url(#vt-dialring)" />
      <circle cx="160" cy="216" r="49" fill={BLUE_DEEP} />
      <g className="vt-dial">
        <g transform="translate(160 216)">
          {STAR_POINTS.map((i) => (
            <line
              key={i}
              x1="0"
              y1="-45"
              x2="0"
              y2={i % 6 === 0 ? -37 : -41}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={i % 6 === 0 ? 2.4 : 1.4}
              strokeLinecap="round"
              transform={`rotate(${i * 15})`}
            />
          ))}
          <g fill="none" stroke={SAFFRON} strokeWidth="2.4" strokeLinejoin="round">
            <rect x="-22" y="-22" width="44" height="44" rx="4" />
            <rect x="-22" y="-22" width="44" height="44" rx="4" transform="rotate(45)" />
          </g>
          <circle r="7" fill={SAFFRON} />
        </g>
      </g>

      {/* handle */}
      <g className="vt-handle">
        <g transform="translate(240 216)" stroke="#E8EDFF" strokeWidth="8" strokeLinecap="round">
          <line x1="0" y1="0" x2="0" y2="-30" />
          <line x1="0" y1="0" x2="26" y2="15" />
          <line x1="0" y1="0" x2="-26" y2="15" />
          <circle r="13" fill="#E8EDFF" stroke="none" />
          <circle r="5" fill={BLUE} stroke="none" />
        </g>
      </g>

      {/* feet */}
      <rect x="100" y="332" width="48" height="14" rx="5" fill={BLUE_DEEP} />
      <rect x="216" y="332" width="48" height="14" rx="5" fill={BLUE_DEEP} />

      {/* coins */}
      {[
        { x: 352, y: 86, r: 17, d: "0s" },
        { x: 44, y: 150, r: 12, d: "-1.6s" },
        { x: 356, y: 250, r: 13, d: "-3.1s" },
      ].map((c) => (
        <g key={c.d} className="vt-coin" style={{ animationDelay: c.d } as CSSProperties}>
          <circle cx={c.x} cy={c.y} r={c.r} fill={SAFFRON} />
          <circle cx={c.x} cy={c.y} r={c.r * 0.58} fill="none" stroke={BLUE_DEEP} strokeOpacity="0.4" strokeWidth="1.6" />
          <path
            d={`M ${c.x - c.r * 0.6} ${c.y - c.r * 0.35} A ${c.r * 0.72} ${c.r * 0.72} 0 0 1 ${c.x + c.r * 0.1} ${c.y - c.r * 0.72}`}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

function VaultPanel() {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const my = ((e.clientY - r.top) / r.height) * 2 - 1;
    el.style.setProperty("--mx", mx.toFixed(3));
    el.style.setProperty("--my", my.toFixed(3));
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
  }

  return (
    <div
      className="relative hidden w-1/2 items-center justify-center overflow-hidden lg:flex"
      style={{ background: "linear-gradient(160deg, #EEF3FF 0%, #C9D8FB 42%, #8FA9F0 100%)" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <style>{css}</style>

      {/* soft light streaks */}
      {[
        { left: "12%", top: "52%", h: 150 },
        { left: "30%", top: "8%", h: 110 },
        { left: "70%", top: "62%", h: 170 },
        { left: "88%", top: "22%", h: 130 },
      ].map((s) => (
        <span
          key={s.left}
          className="absolute w-3 rounded-full bg-white/40 blur-[2px]"
          style={{ left: s.left, top: s.top, height: s.h }}
          aria-hidden="true"
        />
      ))}

      <div ref={ref} className="vt-tilt relative aspect-square w-[68%] max-w-[460px]">
        <Vault />

        <div className="absolute -left-2 bottom-[8%] flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-[0_8px_24px_rgba(18,27,107,0.18)] backdrop-blur">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: SAFFRON, color: BLUE_DEEP }}
          >
            <Coins className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-[#5B6190]">Cagnotte du tour</p>
            <p className={`${display} text-lg font-extrabold leading-tight text-[#0E1442]`}>1 600 MAD</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AuthShellProps {
  mode: "login" | "register";
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  const tab = (active: boolean) =>
    `rounded-xl py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40 ${
      active ? "bg-white text-[#0E1442] shadow-[0_1px_3px_rgba(18,27,107,0.14)]" : "text-[#5B6190] hover:text-[#0E1442]"
    }`;

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="px-6 pt-7 sm:px-10">
          <LogoMark dark />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px]">
            <h1 className={`${display} text-center text-[32px] font-extrabold leading-tight text-[#0E1442]`}>{title}</h1>
            <p className="mt-1.5 text-center text-sm text-[#5B6190]">{subtitle}</p>

            <nav aria-label="Connexion ou inscription" className="mt-7 grid grid-cols-2 rounded-2xl bg-[#F1F3F9] p-1">
              <Link href="/login" aria-current={mode === "login" ? "page" : undefined} className={tab(mode === "login")}>
                Connexion
              </Link>
              <Link href="/register" aria-current={mode === "register" ? "page" : undefined} className={tab(mode === "register")}>
                Inscription
              </Link>
            </nav>

            {children}
          </div>
        </div>

        <p className="mx-auto max-w-sm px-6 pb-8 text-center text-xs leading-relaxed text-[#6B7199]">
          Cotisez, suivez chaque tour et recevez la cagnotte en toute transparence, avec vos proches.
        </p>
      </div>

      <VaultPanel />
    </div>
  );
}