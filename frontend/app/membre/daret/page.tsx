"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";

const statusLabel: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-[#2A2410] text-[#E5B800]" },
  ACTIVE: { label: "Active", className: "bg-[#16241D] text-[#00D492]" },
  TERMINEE: { label: "Terminée", className: "bg-[#1F2023] text-gray-400" },
};

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Mes daret</h1>
          <p className="mt-1 text-sm text-gray-400">{groups.length} daret au total</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/membre/daret/join"
            className="flex items-center gap-2 rounded-md border border-[#26282C] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
          >
            <UserPlus className="h-4 w-4" />
            Rejoindre
          </Link>
          <Link
            href="/membre/daret/create"
            className="flex items-center gap-2 rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle daret
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Chargement...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-[#1F2023]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#101113] text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Fréquence</th>
                <th className="px-4 py-3 font-medium">Tour</th>
                <th className="px-4 py-3 font-medium">Ma position</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const status = statusLabel[g.statut] ?? statusLabel.EN_ATTENTE;
                return (
                  <tr key={g.id} className="border-t border-[#1F2023] bg-[#0A0B0D] transition-colors hover:bg-[#101113]">
                    <td className="px-4 py-3">
                      <Link href={`/membre/daret/${g.id}`} className="font-medium text-white hover:underline">
                        {g.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{g.montant.toLocaleString("fr-FR")} MAD</td>
                    <td className="px-4 py-3 capitalize text-gray-300">{g.frequence.toLowerCase()}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {g.tourActuel}/{g.nombreMembres}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{g.position != null ? `#${g.position}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
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