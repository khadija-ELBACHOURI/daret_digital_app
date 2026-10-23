"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";
import {
  badge,
  btnPrimary,
  btnSecondary,
  card,
  errorBox,
  pageTitle,
  statusStyles,
  subtle,
} from "@/components/ui";

function tourLabel(g: MyGroupResponse): string {
  if (g.statut === "EN_ATTENTE") return "—";
  if (g.statut === "TERMINEE") return `${g.nombreMembres}/${g.nombreMembres}`;
  return `${Math.min(g.tourActuel + 1, g.nombreMembres)}/${g.nombreMembres}`;
}

export default function MesDaretPage() {
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyGroups()
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
        <div className={`${card} p-8 text-center text-sm ${subtle}`}>
          Aucune daret pour le moment. Créez-en une ou rejoignez-en une avec un code d&apos;invitation.
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
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
              {groups.map((g) => {
                const status = statusStyles[g.statut] ?? statusStyles.EN_ATTENTE;
                return (
                  <tr key={g.id} className="transition-colors hover:bg-[#F4F6FB]">
                    <td className="px-5 py-4">
                      <Link
                        href={`/membre/daret/${g.id}`}
                        className="font-semibold text-[#1B2A9B] underline-offset-4 hover:underline"
                      >
                        {g.nom}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-[#0E1442]">{g.montant.toLocaleString("fr-FR")} MAD</td>
                    <td className="px-5 py-4 capitalize text-[#0E1442]">{g.frequence.toLowerCase()}</td>
                    <td className="px-5 py-4 text-[#0E1442]">{tourLabel(g)}</td>
                    <td className="px-5 py-4 text-[#0E1442]">{g.position != null ? `#${g.position}` : "—"}</td>
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
    </div>
  );
}