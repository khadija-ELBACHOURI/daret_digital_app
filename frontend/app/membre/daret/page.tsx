"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, UserPlus, Users } from "lucide-react";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";
import {
  badge,
  btnPrimary,
  btnSecondary,
  card,
  display,
  errorBox,
  pageTitle,
  statusStyles,
  subtle,
} from "@/components/ui";

type Filter = "ALL" | "ACTIVE" | "EN_ATTENTE" | "TERMINEE";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "ACTIVE", label: "Actives" },
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "TERMINEE", label: "Terminées" },
];

function tourLabel(g: MyGroupResponse): string {
  if (g.statut === "EN_ATTENTE") return "-";
  if (g.statut === "TERMINEE") return `${g.nombreMembres}/${g.nombreMembres}`;
  return `${Math.min(g.tourActuel + 1, g.nombreMembres)}/${g.nombreMembres}`;
}

function progress(g: MyGroupResponse): number {
  if (g.statut === "TERMINEE") return 100;
  if (g.statut === "EN_ATTENTE") return 0;
  return Math.round((g.tourActuel / g.nombreMembres) * 100);
}

export default function MesDaretPage() {
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    getMyGroups()
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      ALL: groups.length,
      ACTIVE: groups.filter((g) => g.statut === "ACTIVE").length,
      EN_ATTENTE: groups.filter((g) => g.statut === "EN_ATTENTE").length,
      TERMINEE: groups.filter((g) => g.statut === "TERMINEE").length,
    }),
    [groups]
  );

  const visible = filter === "ALL" ? groups : groups.filter((g) => g.statut === filter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Mes daret</h1>
          <p className={`mt-1 text-sm ${subtle}`}>
            {groups.length} daret{groups.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/membre/daret/join" className={btnSecondary}>
            <UserPlus className="h-4 w-4" />
            Rejoindre
          </Link>
          <Link href="/membre/daret/creer" className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Nouvelle daret
          </Link>
        </div>
      </div>

      {loading && <p className={`text-sm ${subtle}`}>Chargement...</p>}
      {error && <p className={errorBox}>{error}</p>}

      {!loading && !error && groups.length === 0 && (
        <div className={`${card} flex flex-col items-center p-10 text-center`}>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6E9FB]">
            <Users className="h-7 w-7 text-[#1B2A9B]" aria-hidden="true" />
          </div>
          <h2 className={`${display} mb-2 text-lg font-bold text-[#0E1442]`}>Aucune daret pour le moment</h2>
          <p className={`mb-6 max-w-sm text-sm ${subtle}`}>
            Créez un groupe avec vos proches, ou rejoignez-en un avec le code d&apos;invitation de l&apos;organisateur.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/membre/daret/creer" className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Créer une daret
            </Link>
            <Link href="/membre/daret/join" className={btnSecondary}>
              <UserPlus className="h-4 w-4" />
              Rejoindre
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <div role="tablist" aria-label="Filtrer par statut" className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const selected = filter === f.key;
              return (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40 ${
                    selected
                      ? "border-[#1B2A9B] bg-[#1B2A9B] text-white"
                      : "border-[#E3E7F3] bg-white text-[#5B6190] hover:border-[#1B2A9B]/40"
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 text-xs ${selected ? "text-white/80" : "text-[#5B6190]"}`}>
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <div className={`${card} p-8 text-center text-sm ${subtle}`}>Aucune daret dans cette catégorie.</div>
          ) : (
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E3E7F3] bg-[#F4F6FB] text-[#5B6190]">
                    <th className="px-5 py-3 font-semibold">Nom</th>
                    <th className="px-5 py-3 font-semibold">Montant</th>
                    <th className="px-5 py-3 font-semibold">Fréquence</th>
                    <th className="px-5 py-3 font-semibold">Tour</th>
                    <th className="px-5 py-3 font-semibold">Ma position</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7F3]">
                  {visible.map((g) => {
                    const status = statusStyles[g.statut] ?? statusStyles.EN_ATTENTE;
                    const myTurn = g.statut === "ACTIVE" && g.position != null && g.position === g.tourActuel + 1;
                    return (
                      <tr key={g.id} className="transition-colors hover:bg-[#F4F6FB]">
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/membre/daret/${g.id}`}
                              className="font-semibold text-[#1B2A9B] underline-offset-4 hover:underline"
                            >
                              {g.nom}
                            </Link>
                            {g.role === "ORGANISATEUR" && (
                              <span className={`${badge} bg-[#FFF3D1] text-[#8A5A00]`}>Organisateur</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#0E1442]">{g.montant.toLocaleString("fr-FR")} MAD</td>
                        <td className="px-5 py-4 capitalize text-[#0E1442]">{g.frequence.toLowerCase()}</td>
                        <td className="px-5 py-4 text-[#0E1442]">
                          <div className="w-24">
                            <span>{tourLabel(g)}</span>
                            {g.statut !== "EN_ATTENTE" && (
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E8EAF4]">
                                <div className="h-full rounded-full bg-[#1B2A9B]" style={{ width: `${progress(g)}%` }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#0E1442]">
                          <div className="flex flex-wrap items-center gap-2">
                            {g.position != null ? `#${g.position}` : "-"}
                            {myTurn && <span className={`${badge} bg-[#DDF7F2] text-[#0B7A69]`}>Votre tour</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`${badge} ${status.className}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}