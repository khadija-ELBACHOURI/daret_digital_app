"use client";

import type { ReactNode } from "react";
import { Wallet, Calendar, Users, Pencil, Copy, Check, Trash2, UserMinus } from "lucide-react";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  getGroup,
  getGroupMembers,
  assignPosition,
  updateGroupStatus,
  deleteGroup,
  removeMember,
  DaretGroup,
  DaretStatus,
  MemberResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCallback, useEffect, useState } from "react";
import AddMemberForm from "@/components/AddMemberForm";
import PaymentsPanel from "@/components/PaymentsPanel";
import EditGroupForm from "@/components/EditGroupForm";

const statusLabel: Record<DaretStatus, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-[#2A2410] text-[#E5B800]" },
  ACTIVE: { label: "Active", className: "bg-[#16241D] text-[#00D492]" },
  TERMINEE: { label: "Terminée", className: "bg-[#1F2023] text-gray-400" },
};

export default function DaretDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [group, setGroup] = useState<DaretGroup | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editing, setEditing] = useState(false); // must stay before any early return
  const [copied, setCopied] = useState(false); // must stay before any early return
  const [confirmingDelete, setConfirmingDelete] = useState(false); // must stay before any early return
  const [deleting, setDeleting] = useState(false); // must stay before any early return
  const [deleteError, setDeleteError] = useState<string | null>(null); // must stay before any early return
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null); // must stay before any early return
  const [removing, setRemoving] = useState(false); // must stay before any early return
  const [memberError, setMemberError] = useState<string | null>(null); // must stay before any early return

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

  const canInvite =
    !!group.inviteCode &&
    group.statut !== "TERMINEE" &&
    members.length < group.nombreMembres;

  const canDelete = isOrganisateur && group.statut === "EN_ATTENTE";
  const canRemoveMembers = isOrganisateur && group.statut === "EN_ATTENTE";

  async function handleCopyCode() {
    if (!group?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible (http, permissions): l'utilisateur peut copier à la main
    }
  }

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

  async function handleGroupSaved() {
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteGroup(id);
      router.push("/darets"); // adaptez à la route de votre liste "Mes daret"
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Suppression impossible. Reessayez.");
      setDeleting(false);
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    setRemoving(true);
    setMemberError(null);
    try {
      await removeMember(id, memberUserId);
      setMemberToRemove(null);
      await loadData();
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Retrait impossible. Reessayez.");
    } finally {
      setRemoving(false);
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

        <div className="flex items-center gap-2">
          {isOrganisateur && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#26282C] px-3 text-xs text-gray-300 transition-colors hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}

          {canDelete && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#3A1F1F] px-3 text-xs text-red-400 transition-colors hover:bg-[#2A1414]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          )}

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
      </div>

      {canDelete && confirmingDelete && (
        <div className="mb-6 rounded-lg border border-[#3A1F1F] bg-[#1A1010] p-4">
          <p className="mb-1 text-sm font-medium text-white">Supprimer cette daret ?</p>
          <p className="mb-3 text-xs text-gray-400">
            Cette action est définitive. Tous les membres seront retirés du groupe et le code d'invitation ne
            fonctionnera plus.
          </p>
          {deleteError && <p className="mb-3 text-xs text-red-400">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-8 items-center gap-1.5 rounded-md bg-red-500 px-3 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Suppression..." : "Oui, supprimer"}
            </button>
            <button
              onClick={() => {
                setConfirmingDelete(false);
                setDeleteError(null);
              }}
              disabled={deleting}
              className="h-8 rounded-md border border-[#26282C] px-3 text-xs text-gray-300 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {isOrganisateur && editing && (
        <EditGroupForm
          group={group}
          onSaved={handleGroupSaved}
          onCancel={() => setEditing(false)}
        />
      )}

      {canInvite && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-[#1F2023] bg-[#101113] p-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
              Code d'invitation
            </p>
            <p className="font-mono text-lg font-semibold tracking-wider text-white">
              {group.inviteCode}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Partagez ce code pour inviter des personnes à rejoindre la daret.
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#26282C] px-3 text-xs text-gray-300 transition-colors hover:text-white"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#00D492]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}

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

        {memberError && <p className="mb-3 text-sm text-red-400">{memberError}</p>}

        <div className="rounded-lg border border-[#1F2023] bg-[#101113]">
          {sortedMembers.map((m, i) => {
            const canRemoveThis = canRemoveMembers && m.role !== "ORGANISATEUR";
            const confirmingThis = memberToRemove === m.userId;

            return (
              <div
                key={m.userId}
                className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
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

                <div className="flex items-center gap-3">
                  {!confirmingThis && <span className="text-xs text-gray-500">{m.email}</span>}

                  {canRemoveThis && !confirmingThis && (
                    <button
                      onClick={() => {
                        setMemberError(null);
                        setMemberToRemove(m.userId);
                      }}
                      title="Retirer ce membre"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#26282C] text-gray-400 transition-colors hover:border-[#3A1F1F] hover:text-red-400"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {canRemoveThis && confirmingThis && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Retirer ce membre ?</span>
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        disabled={removing}
                        className="h-7 rounded-md bg-red-500 px-2.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {removing ? "..." : "Oui"}
                      </button>
                      <button
                        onClick={() => setMemberToRemove(null)}
                        disabled={removing}
                        className="h-7 rounded-md border border-[#26282C] px-2.5 text-xs text-gray-300 transition-colors hover:text-white disabled:opacity-50"
                      >
                        Non
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {group.statut === "ACTIVE" && (
        <div id="paiements" className="mb-8 scroll-mt-8">
          <PaymentsPanel
            groupId={id}
            cycle={group.tourActuel}
            totalTurns={group.nombreMembres}
            amount={group.montant}
            members={members}
            currentUserId={userId}
            isOrganisateur={isOrganisateur}
            onTurnClosed={loadData}
          />
        </div>
      )}

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