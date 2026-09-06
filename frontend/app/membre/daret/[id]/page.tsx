"use client";

import type { ReactNode } from "react";
import { Wallet, Calendar, Users } from "lucide-react";
import { useParams, notFound } from "next/navigation";
import {
  getGroup,
  getGroupMembers,
  assignPosition,
  updateGroupStatus,
  DaretGroup,
  DaretStatus,
  MemberResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCallback, useEffect, useState } from "react";
import AddMemberForm from "@/components/AddMemberForm";

const statusLabel: Record<DaretStatus, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-[#2A2410] text-[#E5B800]" },
  ACTIVE: { label: "Active", className: "bg-[#16241D] text-[#00D492]" },
  TERMINEE: { label: "Terminée", className: "bg-[#1F2023] text-gray-400" },
};

export default function DaretDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const [group, setGroup] = useState<DaretGroup | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false); // moved up, before any early return

  const loadData = useCallback(() => {
    return Promise.all([getGroup(id), getGroupMembers(id)])
      .then(([g, m]) => {
        setGroup(g);
        setMembers(m);
      })
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  if (loading) return <div className="text-gray-400">Chargement...</div>;
  if (error || !group) return notFound();

  const currentMember = members.find((m) => m.userId === userId);
  const isOrganisateur = currentMember?.role === "ORGANISATEUR";

  const sortedMembers = [...members].sort(
    (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)
  );

  const takenPositions = new Set(
    members.filter((m) => m.position != null).map((m) => m.position)
  );

  async function handlePositionChange(memberUserId: string, value: string) {
    const position = value === "" ? null : Number(value);
    if (position === null) return;

    setSavingUserId(memberUserId);
    try {
      await assignPosition(id, memberUserId, position);
      await loadData();
    } catch {
      // silencieux ici, l'affichage repart de l'état précédent au prochain loadData
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleStatusChange(value: string) {
    setSavingStatus(true);
    try {
      await updateGroupStatus(id, value as DaretStatus);
      await loadData();
    } catch {
      // silencieux, comme pour la position
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div id="apercu" className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{group.nom}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {members.length} membre{members.length > 1 ? "s" : ""} · {group.nombreMembres} places
          </p>
        </div>

        {isOrganisateur ? (
          <select
            value={group.statut}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={savingStatus}
            className="h-8 rounded-md border border-[#26282C] bg-[#0A0B0D] px-2 text-xs text-gray-300 focus:border-[#00D492] focus:outline-none disabled:opacity-50"
          >
            <option value="EN_ATTENTE">En attente</option>
            <option value="ACTIVE">Active</option>
            <option value="TERMINEE">Terminée</option>
          </select>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusLabel[group.statut]?.className ?? ""}`}>
            {statusLabel[group.statut]?.label ?? group.statut}
          </span>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard
          icon={<Wallet className="h-4 w-4" />}
          label="Montant / tour"
          value={`${group.montant.toLocaleString("fr-FR")} MAD`}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="Date de début"
          value={new Date(group.dateDebut).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
          })}
        />
        <InfoCard
          icon={<Users className="h-4 w-4" />}
          label="Fréquence"
          value={group.frequence}
        />
      </div>

      <div id="membres" className="mb-8 scroll-mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Membres
          </h2>
          {members.length >= group.nombreMembres && (
            <span className="text-xs text-gray-500">Groupe complet</span>
          )}
        </div>

        {isOrganisateur && members.length < group.nombreMembres && (
          <div className="mb-3">
            <AddMemberForm groupId={id} onMemberAdded={loadData} />
          </div>
        )}

        <div className="rounded-lg border border-[#1F2023] bg-[#101113]">
          {sortedMembers.map((m, i) => (
            <div
              key={m.userId}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i !== sortedMembers.length - 1 ? "border-b border-[#1F2023]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {isOrganisateur ? (
                  <select
                    value={m.position ?? ""}
                    onChange={(e) => handlePositionChange(m.userId, e.target.value)}
                    disabled={savingUserId === m.userId}
                    className="h-7 w-14 rounded-md border border-[#26282C] bg-[#0A0B0D] text-center text-xs text-gray-300 focus:border-[#00D492] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">–</option>
                    {Array.from({ length: group.nombreMembres }, (_, idx) => idx + 1).map((pos) => (
                      <option
                        key={pos}
                        value={pos}
                        disabled={takenPositions.has(pos) && pos !== m.position}
                      >
                        {pos}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F2023] text-xs text-gray-300">
                    {m.position ?? "–"}
                  </div>
                )}
                <span className="text-gray-300">
                  {m.firstname} {m.lastname}
                </span>
                {m.role === "ORGANISATEUR" && (
                  <span className="rounded-full bg-[#16241D] px-2 py-0.5 text-xs text-[#00D492]">
                    Organisateur
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{m.email}</span>
            </div>
          ))}
        </div>
      </div>

      {group.description && (
        <div id="description" className="scroll-mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
            Description
          </h2>
          <p className="rounded-lg border border-[#1F2023] bg-[#101113] p-4 text-sm text-gray-300">
            {group.description}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1F2023] bg-[#101113] p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}