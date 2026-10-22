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
  Calendar,
  Shield,
  LogOut,
} from "lucide-react";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";

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
  { anchor: "calendrier", label: "Calendrier", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  useEffect(() => {
    getMyGroups()
      .then(setGroups)
      .catch(() => setGroups([])); // silencieux : la sidebar reste utilisable sans daret active
  }, []);

  // Toutes les darets actives du membre.
  const activeDarets = groups.filter((d) => d.statut === "ACTIVE");

  // Si l'URL pointe vers une daret active, on la sélectionne.
  useEffect(() => {
    if (!pathname || activeDarets.length === 0) return;
    const idx = activeDarets.findIndex((d) => pathname.startsWith(`/membre/daret/${d.id}`));
    if (idx !== -1) setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, groups]);

  // Garde l'index valide si la liste change.
  const safeIndex = activeDarets.length > 0 ? Math.min(activeIndex, activeDarets.length - 1) : 0;
  const activeDaret = activeDarets[safeIndex];
  const hasMultiple = activeDarets.length > 1;

  const goPrev = () =>
    setActiveIndex((safeIndex - 1 + activeDarets.length) % activeDarets.length);
  const goNext = () => setActiveIndex((safeIndex + 1) % activeDarets.length);

  const inDaretDetail = activeDaret ? !!pathname?.includes(activeDaret.id) : false;

  if (collapsed) {
    return (
      <div className="flex h-screen w-16 flex-col items-center border-r border-[#1F2023] bg-[#0A0B0D] py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="mb-6 flex h-9 w-9 items-center justify-center rounded-md border border-[#26282C] text-gray-400 hover:text-white transition-colors"
          aria-label="Ouvrir le menu"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-2 flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                active ? "bg-[#16241D] text-[#00D492]" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="mt-auto flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-red-400"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-[#1F2023] bg-[#0A0B0D] text-gray-300">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00D492]/10 text-sm font-semibold text-[#00D492]">
          D
        </div>
        <span className="font-semibold text-white">Daret Digital</span>
      </div>

      <div className="px-4 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        Espace membre
      </div>

      <div className="px-3">
        <Link
          href="/membre/daret/creer"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-[#00D492] px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184]"
        >
          <Plus className="h-4 w-4" />
          Nouvelle daret
        </Link>
      </div>

      <nav className="px-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-[#16171A] text-white" : "text-gray-400 hover:bg-[#141517] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {activeDaret && (
        <>
          <div className="mt-6 flex items-center justify-between px-4 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <span>Daret active</span>
            {hasMultiple && (
              <span className="normal-case tracking-normal">
                {safeIndex + 1}/{activeDarets.length}
              </span>
            )}
          </div>

          <div className="px-3">
            <div className="mb-2 flex w-full items-center gap-1">
              {hasMultiple && (
                <button
                  onClick={goPrev}
                  className="flex h-9 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-[#141517] hover:text-white"
                  aria-label="Daret précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <Link
                href={`/membre/daret/${activeDaret.id}`}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white transition-colors hover:border-[#00D492]/50"
              >
                <Shield className="h-4 w-4 shrink-0 text-[#00D492]" />
                <span className="truncate">{activeDaret.nom}</span>
              </Link>

              {hasMultiple && (
                <button
                  onClick={goNext}
                  className="flex h-9 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-[#141517] hover:text-white"
                  aria-label="Daret suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <nav className="px-3">
            {activeDaretNav.map((item) => (
              <a
                key={item.anchor}
                href={inDaretDetail ? `#${item.anchor}` : `/membre/daret/${activeDaret.id}#${item.anchor}`}
                className="mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-[#141517] hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto border-t border-[#1F2023] px-3 py-3">
        <button
          onClick={handleLogout}
          className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-[#141517] hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-[#141517] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Réduire le menu
        </button>
      </div>
    </div>
  );
}