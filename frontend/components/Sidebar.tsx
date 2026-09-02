"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCircle,
  ChevronsUpDown,
  ChevronLeft,
  Plus,
  Wallet,
  Calendar,
  Shield,
} from "lucide-react";
import { mockDarets } from "@/lib/mock-data";

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
  const [collapsed, setCollapsed] = useState(false);

  // "Daret active" = première daret active du membre, pour l'exemple.
  const activeDaret = mockDarets.find((d) => d.status === "active");
  const inDaretDetail = pathname?.startsWith("/membre/daret/") && activeDaret
    ? pathname.includes(activeDaret.id)
    : false;

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
          <div className="mt-6 px-4 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Daret active
          </div>

          <div className="px-3">
            <Link
              href={`/membre/daret/${activeDaret.id}`}
              className="mb-2 flex w-full items-center gap-2 rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white transition-colors hover:border-[#00D492]/50"
            >
              <Shield className="h-4 w-4 text-[#00D492]" />
              <span className="truncate">{activeDaret.name}</span>
              <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-gray-500" />
            </Link>
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