"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  Shield,
  LogOut,
} from "lucide-react";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LogoMark } from "@/components/AuthShell";
import { display } from "@/components/ui";

const mainNav = [
  { href: "/membre/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/membre/daret", label: "Mes daret", icon: Users },
  { href: "/membre/daret/join", label: "Rejoindre", icon: UserPlus },
  { href: "/membre/daret/profil", label: "Profil", icon: UserCircle },
];

const activeDaretNav = [
  { anchor: "apercu", label: "Aperçu", icon: LayoutDashboard },
  { anchor: "membres", label: "Membres", icon: Users },
  { anchor: "paiements", label: "Paiements", icon: Wallet },
];

const itemBase =
  "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/50";
const itemIdle = "text-white/65 hover:bg-white/10 hover:text-white";
const itemActive = "bg-white/15 text-white";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Small screens start with the icon rail.
  useEffect(() => {
    if (window.innerWidth < 768) setCollapsed(true);
  }, []);

  useEffect(() => {
    getMyGroups()
      .then(setGroups)
      .catch(() => setGroups([])); // silent: the sidebar stays usable without active darets
  }, []);

  const activeDarets = groups.filter((d) => d.statut === "ACTIVE");

  // When the URL points to an active daret, select it.
  useEffect(() => {
    if (!pathname || activeDarets.length === 0) return;
    const idx = activeDarets.findIndex((d) => pathname.startsWith(`/membre/daret/${d.id}`));
    if (idx !== -1) setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, groups]);

  const safeIndex = activeDarets.length > 0 ? Math.min(activeIndex, activeDarets.length - 1) : 0;
  const activeDaret = activeDarets[safeIndex];
  const hasMultiple = activeDarets.length > 1;

  const goPrev = () => setActiveIndex((safeIndex - 1 + activeDarets.length) % activeDarets.length);
  const goNext = () => setActiveIndex((safeIndex + 1) % activeDarets.length);

  const inDaretDetail = activeDaret ? !!pathname?.includes(activeDaret.id) : false;

  if (collapsed) {
    return (
      <aside className="sticky top-0 flex h-screen w-[72px] shrink-0 flex-col items-center bg-[#121B6B] py-5">
        <span
          className={`${display} mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFB81C] text-lg font-extrabold text-[#121B6B]`}
        >
          D
        </span>

        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={`${itemBase} mb-1.5 h-10 w-10 justify-center ${active ? itemActive : itemIdle}`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-1.5">
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className={`${itemBase} ${itemIdle} h-10 w-10 justify-center`}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => setCollapsed(false)}
            title="Ouvrir le menu"
            aria-label="Ouvrir le menu"
            className={`${itemBase} ${itemIdle} h-10 w-10 justify-center`}
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[#121B6B] text-white">
      <div className="px-5 py-6">
        <LogoMark />
      </div>

      <div className="px-4">
        <Link
          href="/membre/daret/creer"
          className={`${display} mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFB81C] px-3 py-2.5 text-sm font-bold text-[#121B6B] transition-colors hover:bg-[#FFC845] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40`}
        >
          <Plus className="h-4 w-4" />
          Nouvelle daret
        </Link>
      </div>

      <nav className="px-4" aria-label="Navigation principale">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${itemBase} relative mb-1 px-3 py-2.5 ${active ? itemActive : itemIdle}`}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#FFB81C]" aria-hidden="true" />
              )}
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {activeDaret && (
        <div className="mt-6 px-4">
          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-white/50">
            <span>Daret active</span>
            {hasMultiple && (
              <span>
                {safeIndex + 1}/{activeDarets.length}
              </span>
            )}
          </div>

          <div className="mb-2 flex items-center gap-1">
            {hasMultiple && (
              <button
                onClick={goPrev}
                className="flex h-10 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/50"
                aria-label="Daret précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <Link
              href={`/membre/daret/${activeDaret.id}`}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/50"
            >
              <Shield className="h-4 w-4 shrink-0 text-[#3DDBC2]" />
              <span className="truncate">{activeDaret.nom}</span>
            </Link>

            {hasMultiple && (
              <button
                onClick={goNext}
                className="flex h-10 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/50"
                aria-label="Daret suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <nav aria-label="Daret active">
            {activeDaretNav.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.anchor}
                  href={inDaretDetail ? `#${item.anchor}` : `/membre/daret/${activeDaret.id}#${item.anchor}`}
                  className={`${itemBase} ${itemIdle} mb-1 px-3 py-2`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      )}

      <div className="mt-auto border-t border-white/10 px-4 py-4">
        <button onClick={handleLogout} className={`${itemBase} ${itemIdle} mb-1 w-full px-3 py-2.5`}>
          <LogOut className="h-[18px] w-[18px]" />
          Déconnexion
        </button>
        <button onClick={() => setCollapsed(true)} className={`${itemBase} ${itemIdle} w-full px-3 py-2.5 text-white/45`}>
          <ChevronLeft className="h-[18px] w-[18px]" />
          Réduire le menu
        </button>
      </div>
    </aside>
  );
}