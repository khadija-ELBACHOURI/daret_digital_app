"use client";

import type { ReactNode } from "react";
import {
  Wallet,
  Calendar,
  Repeat,
  Pencil,
  Copy,
  Check,
  Trash2,
  UserMinus,
  ChevronDown,
  Mail,
  Phone,
  Landmark,
} from "lucide-react";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  getGroup,
  getGroupMembers,
  assignPosition,
  updateGroupStatus,
  deleteGroup,
  removeMember,
  getMemberContact,
  DaretGroup,
  DaretStatus,
  MemberResponse,
  MemberContact,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCallback, useEffect, useState } from "react";
import AddMemberForm from "@/components/AddMemberForm";
import PaymentsPanel from "@/components/PaymentsPanel";
import EditGroupForm from "@/components/EditGroupForm";
import {
  badge,
  btnDangerSm,
  btnDangerOutlineSm,
  btnSecondarySm,
  card,
  display,
  errorText,
  pageTitle,
  sectionTitle,
  selectSmall,
  statusStyles,
  subtle,
} from "@/components/ui";

type ContactState =
  { status: "loading" } | { status: "ok"; data: MemberContact } | { status: "error"; message: string };

// "MA64001100000123456789" -> "MA64 0011 0000 0123 4567 89"
function formatIban(iban: string): string {
  return iban
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null); // must stay before any early return
  const [contacts, setContacts] = useState<Record<string, ContactState>>({}); // must stay before any early return
  const [copiedKey, setCopiedKey] = useState<string | null>(null); // must stay before any early return

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

  if (loading) return <div className={`text-sm ${subtle}`}>Chargement...</div>;
  if (error || !group) return notFound();

  const currentMember = members.find((m) => m.userId === userId);
  const isOrganisateur = currentMember?.role === "ORGANISATEUR";

  const sortedMembers = [...members].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

  const takenPositions = new Set(members.filter((m) => m.position != null).map((m) => m.position));

  const canInvite = !!group.inviteCode && group.statut !== "TERMINEE" && members.length < group.nombreMembres;

  const canDelete = isOrganisateur && group.statut === "EN_ATTENTE";
  const canRemoveMembers = isOrganisateur && group.statut === "EN_ATTENTE";

  async function handleCopyCode() {
    if (!group?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (http, permissions): the user can copy by hand
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
      // silent here, the display goes back to the previous state on the next loadData
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
      // silent, same as for the position
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
      router.push("/membre/daret");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Suppression impossible. Réessayez.");
      setDeleting(false);
    }
  }

  async function toggleMember(memberUserId: string) {
    if (expandedId === memberUserId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(memberUserId);
    setContacts((c) => ({ ...c, [memberUserId]: { status: "loading" } }));
    try {
      const data = await getMemberContact(id, memberUserId);
      setContacts((c) => ({ ...c, [memberUserId]: { status: "ok", data } }));
    } catch (err) {
      setContacts((c) => ({
        ...c,
        [memberUserId]: {
          status: "error",
          message: err instanceof Error ? err.message : "Impossible de charger les informations.",
        },
      }));
    }
  }

  async function handleCopyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // clipboard unavailable: the organizer can select the text by hand
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
      setMemberError(err instanceof Error ? err.message : "Retrait impossible. Réessayez.");
    } finally {
      setRemoving(false);
    }
  }

  const status = statusStyles[group.statut];

  return (
    <div>
      <div id="apercu" className="mb-6 flex flex-wrap items-start justify-between gap-4 scroll-mt-8">
        <div>
          <h1 className={pageTitle}>{group.nom}</h1>
          <p className={`mt-1 text-sm ${subtle}`}>
            {members.length} membre{members.length > 1 ? "s" : ""} · {group.nombreMembres} places
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOrganisateur && !editing && (
            <button onClick={() => setEditing(true)} className={btnSecondarySm}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}

          {canDelete && !confirmingDelete && (
            <button onClick={() => setConfirmingDelete(true)} className={btnDangerOutlineSm}>
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          )}

          {isOrganisateur ? (
            <select
              value={group.statut}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={savingStatus}
              aria-label="Statut de la daret"
              className={selectSmall}
            >
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACTIVE">Active</option>
              <option value="TERMINEE">Terminée</option>
            </select>
          ) : (
            <span className={`${badge} ${status?.className ?? ""}`}>{status?.label ?? group.statut}</span>
          )}
        </div>
      </div>

      {canDelete && confirmingDelete && (
        <div className="mb-6 rounded-2xl border-2 border-[#D9483B]/25 bg-[#FDECEA] p-5">
          <p className="mb-1 text-sm font-semibold text-[#0E1442]">Supprimer cette daret ?</p>
          <p className={`mb-4 text-sm ${subtle}`}>
            Cette action est définitive. Tous les membres seront retirés du groupe et le code d&apos;invitation ne
            fonctionnera plus.
          </p>
          {deleteError && <p className={`mb-3 ${errorText}`}>{deleteError}</p>}
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting} className={btnDangerSm}>
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Suppression..." : "Oui, supprimer"}
            </button>
            <button
              onClick={() => {
                setConfirmingDelete(false);
                setDeleteError(null);
              }}
              disabled={deleting}
              className={btnSecondarySm}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {isOrganisateur && editing && (
        <EditGroupForm group={group} onSaved={handleGroupSaved} onCancel={() => setEditing(false)} />
      )}

      {canInvite && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#FFB81C]/60 bg-[#FFF8E6] p-5">
          <div>
            <p className="mb-1 text-sm font-semibold text-[#8A5A00]">Code d&apos;invitation</p>
            <p className={`${display} text-2xl font-extrabold tracking-wider text-[#0E1442]`}>{group.inviteCode}</p>
            <p className="mt-1 text-sm text-[#8A5A00]/80">
              Partagez ce code pour inviter des personnes à rejoindre la daret.
            </p>
          </div>
          <button onClick={handleCopyCode} className={btnSecondarySm}>
            {copied ? <Check className="h-3.5 w-3.5 text-[#0B7A69]" /> : <Copy className="h-3.5 w-3.5" />}
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
          icon={<Repeat className="h-4 w-4" />}
          label="Fréquence"
          value={group.frequence.toLowerCase()}
          capitalize
        />
      </div>

      <div id="membres" className="mb-8 scroll-mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className={sectionTitle}>Membres</h2>
          {members.length >= group.nombreMembres && <span className={`text-sm ${subtle}`}>Groupe complet</span>}
        </div>

        {isOrganisateur && members.length < group.nombreMembres && (
          <div className="mb-3">
            <AddMemberForm groupId={id} onMemberAdded={loadData} />
          </div>
        )}

        {memberError && <p className={`mb-3 ${errorText}`}>{memberError}</p>}

        <div className={`${card} divide-y divide-[#E3E7F3]`}>
          {sortedMembers.map((m) => {
            const canRemoveThis = canRemoveMembers && m.role !== "ORGANISATEUR";
            const confirmingThis = memberToRemove === m.userId;
            const initials = `${m.firstname?.[0] ?? ""}${m.lastname?.[0] ?? ""}`.toUpperCase();

            const expanded = isOrganisateur && expandedId === m.userId;
            const contact = contacts[m.userId];

            const identity = (
              <>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2A9B] text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="font-medium text-[#0E1442]">
                  {m.firstname} {m.lastname}
                </span>
                {m.role === "ORGANISATEUR" && (
                  <span className={`${badge} bg-[#FFF3D1] text-[#8A5A00]`}>Organisateur</span>
                )}
              </>
            );

            return (
              <div key={m.userId}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    {isOrganisateur ? (
                      <select
                        value={m.position ?? ""}
                        onChange={(e) => handlePositionChange(m.userId, e.target.value)}
                        disabled={savingUserId === m.userId}
                        aria-label={`Position de ${m.firstname} ${m.lastname}`}
                        className={`${selectSmall} w-16 text-center`}
                      >
                        <option value="">–</option>
                        {Array.from({ length: group.nombreMembres }, (_, idx) => idx + 1).map((pos) => (
                          <option key={pos} value={pos} disabled={takenPositions.has(pos) && pos !== m.position}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6E9FB] text-xs font-bold text-[#1B2A9B]">
                        {m.position ?? "–"}
                      </div>
                    )}
                    {isOrganisateur ? (
                      <button
                        type="button"
                        onClick={() => toggleMember(m.userId)}
                        aria-expanded={expanded}
                        aria-controls={`contact-${m.userId}`}
                        title="Voir les informations de contact"
                        className="flex items-center gap-3 rounded-xl py-1 pr-2 text-left transition-colors hover:bg-[#F4F6FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40"
                      >
                        {identity}
                        <ChevronDown
                          className={`h-4 w-4 text-[#5B6190] transition-transform ${expanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      identity
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {!confirmingThis && <span className={`hidden text-xs sm:inline ${subtle}`}>{m.email}</span>}

                    {canRemoveThis && !confirmingThis && (
                      <button
                        onClick={() => {
                          setMemberError(null);
                          setMemberToRemove(m.userId);
                        }}
                        title="Retirer ce membre"
                        aria-label={`Retirer ${m.firstname} ${m.lastname}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#1B2A9B]/15 text-[#5B6190] transition-colors hover:border-[#D9483B]/40 hover:text-[#B3261E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {canRemoveThis && confirmingThis && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${subtle}`}>Retirer ce membre ?</span>
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          disabled={removing}
                          className={btnDangerSm}
                        >
                          {removing ? "..." : "Oui"}
                        </button>
                        <button onClick={() => setMemberToRemove(null)} disabled={removing} className={btnSecondarySm}>
                          Non
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div
                    id={`contact-${m.userId}`}
                    className="border-t border-dashed border-[#E3E7F3] bg-[#F8F9FD] px-5 py-4"
                  >
                    {(!contact || contact.status === "loading") && <p className={`text-sm ${subtle}`}>Chargement...</p>}
                    {contact?.status === "error" && <p className={errorText}>{contact.message}</p>}
                    {contact?.status === "ok" && (
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <ContactItem
                          icon={<Mail className="h-4 w-4" />}
                          label="Email"
                          value={m.email}
                          href={`mailto:${m.email}`}
                          copied={copiedKey === `${m.userId}-email`}
                          onCopy={() => handleCopyValue(`${m.userId}-email`, m.email)}
                        />
                        <ContactItem
                          icon={<Phone className="h-4 w-4" />}
                          label="Téléphone"
                          value={contact.data.phone}
                          href={contact.data.phone ? `tel:${contact.data.phone.replace(/\s+/g, "")}` : undefined}
                          copied={copiedKey === `${m.userId}-phone`}
                          onCopy={() => contact.data.phone && handleCopyValue(`${m.userId}-phone`, contact.data.phone)}
                        />
                        <ContactItem
                          icon={<Landmark className="h-4 w-4" />}
                          label="IBAN"
                          value={contact.data.iban ? formatIban(contact.data.iban) : null}
                          copied={copiedKey === `${m.userId}-iban`}
                          onCopy={() =>
                            contact.data.iban &&
                            handleCopyValue(`${m.userId}-iban`, contact.data.iban.replace(/\s+/g, ""))
                          }
                        />
                      </dl>
                    )}
                  </div>
                )}
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
          <h2 className={`${sectionTitle} mb-3`}>Description</h2>
          <p className={`${card} p-5 text-sm text-[#0E1442]`}>{group.description}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  capitalize = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#5B6190]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6E9FB] text-[#1B2A9B]">{icon}</span>
        {label}
      </div>
      <div className={`${display} text-xl font-extrabold text-[#0E1442] ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
  copied,
  onCopy,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  href?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5B6190]">
        {icon}
        {label}
      </dt>
      <dd className="flex items-center gap-2">
        {value ? (
          <>
            {href ? (
              <a
                href={href}
                className="min-w-0 break-words font-semibold text-[#1B2A9B] underline-offset-4 hover:underline"
              >
                {value}
              </a>
            ) : (
              <span className="min-w-0 break-words font-semibold text-[#0E1442]">{value}</span>
            )}
            <button
              type="button"
              onClick={onCopy}
              title="Copier"
              aria-label={`Copier ${label}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#1B2A9B]/15 bg-white text-[#5B6190] transition-colors hover:border-[#1B2A9B] hover:text-[#1B2A9B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#0B7A69]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </>
        ) : (
          <span className="text-sm italic text-[#5B6190]">Non renseigné</span>
        )}
      </dd>
    </div>
  );
}