"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Design tokens
// Majorelle blue (base), saffron (the "turn"), mint (secondary), cool white (form side)
const BLUE_DEEP = "#121B6B";
const BLUE = "#1B2A9B";
const SAFFRON = "#FFB81C";
const MINT = "#3DDBC2";
const INK = "#0E1442";

const MEMBERS = ["Y", "S", "O", "N", "K", "H", "I", "A"];
const RING_RADIUS = 110;

const fontCss = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap");
.dd-display { font-family: "Bricolage Grotesque", system-ui, sans-serif; }
.dd-body { font-family: "DM Sans", system-ui, sans-serif; }
.dd-disc { transition: fill 500ms ease, stroke 500ms ease, transform 500ms ease; }
@media (prefers-reduced-motion: reduce) {
  .dd-disc { transition: none; }
}
`;

function TurnCircle() {
  const [active, setActive] = useState(2);

  // The turn moves to the next member every few seconds, like a real daret.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % MEMBERS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <svg
      viewBox="0 0 300 300"
      className="h-full w-full"
      role="img"
      aria-label={`Tour ${active + 1} sur ${MEMBERS.length}`}
    >
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
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill={isActive ? BLUE_DEEP : isDone ? MINT : "rgba(255,255,255,0.75)"}
              style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}
            >
              {letter}
            </text>
          </g>
        );
      })}

      <text x="150" y="128" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.6)" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        Tour
      </text>
      <text x="150" y="176" textAnchor="middle" fontSize="56" fontWeight="800" fill="white" style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>
        {active + 1}
      </text>
      <text x="150" y="198" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.6)" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
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

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, motDePasse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "dd-body mt-2 w-full rounded-xl border-2 border-[#1B2A9B]/15 bg-white px-4 py-3 text-[15px] text-[#0E1442] placeholder:text-[#0E1442]/35 transition-colors focus:border-[#1B2A9B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40";

  return (
    <div className="dd-body flex min-h-screen bg-[#F4F6FB]">
      <style>{fontCss}</style>

      {/* Left: the turn circle */}
      <div
        className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ backgroundColor: BLUE }}
      >
        <ZelligePattern />

        <div className="relative flex items-center gap-3">
          <span
            className="dd-display flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold"
            style={{ backgroundColor: SAFFRON, color: BLUE_DEEP }}
          >
            D
          </span>
          <span className="dd-display text-xl font-bold text-white">Daret Digital</span>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <TurnCircle />
        </div>

        <div className="relative max-w-md">
          <h2 className="dd-display text-5xl font-extrabold leading-[1.05] text-white">
            À chacun
            <br />
            son tour.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Cotisations, ordre de passage et versements de votre daret, au même endroit.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[45%] lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span
              className="dd-display flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold"
              style={{ backgroundColor: BLUE, color: SAFFRON }}
            >
              D
            </span>
            <span className="dd-display text-xl font-bold" style={{ color: INK }}>
              Daret Digital
            </span>
          </div>

          <h1 className="dd-display text-4xl font-extrabold" style={{ color: INK }}>
            Connexion
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: `${INK}99` }}>
            Retrouvez vos darets et votre prochain tour.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-semibold" style={{ color: INK }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold" style={{ color: INK }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-md p-1 text-[#0E1442]/50 transition-colors hover:text-[#1B2A9B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border-2 border-[#D9483B]/30 bg-[#D9483B]/10 px-4 py-3 text-sm text-[#A3281D]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="dd-display w-full rounded-xl px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#121B6B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/60 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: BLUE }}
            >
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: `${INK}99` }}>
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="font-semibold underline decoration-[#FFB81C] decoration-2 underline-offset-4 hover:decoration-[#1B2A9B]"
              style={{ color: BLUE }}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}