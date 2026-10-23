import type { DaretStatus } from "@/lib/api";

// Single source of truth for the app design.
// Palette: Majorelle blue #1B2A9B (primary), deep blue #121B6B, saffron #FFB81C (accent),
// ink #0E1442 (text), muted #5B6190, line #E3E7F3, page #F4F6FB.
// To restyle the whole app, change the classes here.

export const display = "font-[family-name:var(--font-display)]";

export const pageTitle = `${display} text-3xl font-extrabold text-[#0E1442]`;
export const sectionTitle = `${display} text-lg font-bold text-[#0E1442]`;
export const subtle = "text-[#5B6190]";

export const card =
  "rounded-2xl border border-[#E3E7F3] bg-white shadow-[0_1px_2px_rgba(18,27,107,0.04)]";

export const labelClass = "mb-1.5 block text-sm font-semibold text-[#0E1442]";

export const inputClass =
  "w-full rounded-xl border-2 border-[#1B2A9B]/15 bg-white px-4 py-2.5 text-sm text-[#0E1442] placeholder:text-[#0E1442]/35 outline-none transition-colors focus:border-[#1B2A9B] focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40 disabled:bg-[#F4F6FB] disabled:text-[#0E1442]/50";

export const selectSmall =
  "h-9 rounded-lg border-2 border-[#1B2A9B]/15 bg-white px-2 text-xs font-medium text-[#0E1442] outline-none focus:border-[#1B2A9B] focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40 disabled:opacity-50";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/50 disabled:cursor-not-allowed disabled:opacity-50";
const md = "px-4 py-2.5 text-sm";
const sm = "px-3 py-1.5 text-xs";

export const btnPrimary = `${btnBase} ${md} bg-[#1B2A9B] text-white hover:bg-[#121B6B]`;
export const btnPrimarySm = `${btnBase} ${sm} bg-[#1B2A9B] text-white hover:bg-[#121B6B]`;
export const btnSecondary = `${btnBase} ${md} border-2 border-[#1B2A9B]/15 bg-white text-[#1B2A9B] hover:border-[#1B2A9B]`;
export const btnSecondarySm = `${btnBase} ${sm} border-2 border-[#1B2A9B]/15 bg-white text-[#1B2A9B] hover:border-[#1B2A9B]`;
export const btnDangerSm = `${btnBase} ${sm} bg-[#D9483B] text-white hover:bg-[#B3261E]`;
export const btnDangerOutlineSm = `${btnBase} ${sm} border-2 border-[#D9483B]/25 bg-white text-[#B3261E] hover:bg-[#FDECEA]`;

export const errorText = "text-sm text-[#B3261E]";
export const errorBox =
  "rounded-xl border-2 border-[#D9483B]/30 bg-[#D9483B]/10 px-4 py-3 text-sm text-[#A3281D]";

export const statusStyles: Record<DaretStatus, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-[#FFF3D1] text-[#8A5A00]" },
  ACTIVE: { label: "Active", className: "bg-[#DDF7F2] text-[#0B7A69]" },
  TERMINEE: { label: "Terminée", className: "bg-[#E8EAF4] text-[#5B6190]" },
};

export const badge = "rounded-full px-2.5 py-0.5 text-xs font-semibold";