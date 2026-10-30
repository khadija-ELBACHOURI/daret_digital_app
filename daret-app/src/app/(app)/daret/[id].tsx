import { ReactNode, useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Landmark,
  Mail,
  Pencil,
  Phone,
  Repeat,
  Trash2,
  UserMinus,
  Wallet,
} from "lucide-react-native";
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
import AddMemberForm from "@/components/AddMemberForm";
import PaymentsPanel from "@/components/PaymentsPanel";
import EditGroupForm from "@/components/EditGroupForm";
import { Badge, Button, Card, Divider, Screen, Select } from "@/components/Ui";
import { colors, fonts, statusStyles, type } from "@/lib/theme";

type ContactState =
  | { status: "loading" }
  | { status: "ok"; data: MemberContact }
  | { status: "error"; message: string };

// "MA64001100000123456789" -> "MA64 0011 0000 0123 4567 89"
function formatIban(iban: string): string {
  return iban
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function formatStart(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

const STATUS_OPTIONS = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "ACTIVE", label: "Active" },
  { value: "TERMINEE", label: "Terminée" },
];

export default function DaretDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [group, setGroup] = useState<DaretGroup | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, ContactState>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = useCallback(() => {
    return Promise.all([getGroup(id), getGroupMembers(id)])
      .then(([g, m]) => {
        setGroup(g);
        setMembers(m);
        setError(false);
      })
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  if (loading) {
    return (
      <Screen edges={[]}>
        <Text style={type.small}>Chargement...</Text>
      </Screen>
    );
  }

  if (error || !group) {
    return (
      <Screen edges={[]}>
        <Card style={{ padding: 24, gap: 14 }}>
          <Text style={type.sectionTitle}>Daret introuvable</Text>
          <Text style={type.small}>Cette daret n'existe pas ou vous n'y avez pas accès.</Text>
          <Button title="Retour" onPress={() => router.back()} variant="secondary" />
        </Card>
      </Screen>
    );
  }

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
      await Clipboard.setStringAsync(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable: the user can copy by hand
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
      // silent, the display goes back to the previous state on the next loadData
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
      router.replace("/darets");
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
      await Clipboard.setStringAsync(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // clipboard unavailable
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
    <Screen
      edges={[]}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadData().finally(() => setRefreshing(false));
      }}
    >
      <Stack.Screen options={{ title: group.nom }} />

      {/* Header */}
      <View style={{ marginBottom: 20, gap: 12 }}>
        <View>
          <Text style={type.pageTitle}>{group.nom}</Text>
          <Text style={[type.small, { marginTop: 4 }]}>
            {members.length} membre{members.length > 1 ? "s" : ""} · {group.nombreMembres} places
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {isOrganisateur && !editing && (
            <Button
              title="Modifier"
              onPress={() => setEditing(true)}
              variant="secondary"
              size="sm"
              icon={<Pencil size={14} color={colors.blue} />}
            />
          )}

          {canDelete && !confirmingDelete && (
            <Button
              title="Supprimer"
              onPress={() => setConfirmingDelete(true)}
              variant="dangerOutline"
              size="sm"
              icon={<Trash2 size={14} color={colors.dangerDark} />}
            />
          )}

          {isOrganisateur ? (
            <Select
              compact
              value={group.statut}
              options={STATUS_OPTIONS}
              onChange={handleStatusChange}
              disabled={savingStatus}
            />
          ) : (
            <Badge label={status?.label ?? group.statut} bg={status?.bg ?? colors.greyBg} fg={status?.fg ?? colors.muted} />
          )}
        </View>
      </View>

      {canDelete && confirmingDelete && (
        <View
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "rgba(217,72,59,0.25)",
            backgroundColor: colors.dangerBg,
            gap: 10,
          }}
        >
          <Text style={type.bodyBold}>Supprimer cette daret ?</Text>
          <Text style={type.small}>
            Cette action est définitive. Tous les membres seront retirés du groupe et le code d'invitation ne
            fonctionnera plus.
          </Text>
          {deleteError && <Text style={type.errorText}>{deleteError}</Text>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              title={deleting ? "Suppression..." : "Oui, supprimer"}
              onPress={handleDelete}
              disabled={deleting}
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} color="#fff" />}
            />
            <Button
              title="Annuler"
              onPress={() => {
                setConfirmingDelete(false);
                setDeleteError(null);
              }}
              disabled={deleting}
              variant="secondary"
              size="sm"
            />
          </View>
        </View>
      )}

      {isOrganisateur && editing && (
        <EditGroupForm group={group} onSaved={handleGroupSaved} onCancel={() => setEditing(false)} />
      )}

      {canInvite && (
        <View
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "rgba(255,184,28,0.6)",
            backgroundColor: colors.amberSoft,
            gap: 4,
          }}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.amberText }}>Code d'invitation</Text>
          <Text style={{ fontFamily: fonts.displayXL, fontSize: 24, letterSpacing: 1.5, color: colors.ink }} selectable>
            {group.inviteCode}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "rgba(138,90,0,0.8)", marginBottom: 10 }}>
            Partagez ce code pour inviter des personnes à rejoindre la daret.
          </Text>
          <Button
            title={copied ? "Copié" : "Copier"}
            onPress={handleCopyCode}
            variant="secondary"
            size="sm"
            icon={copied ? <Check size={14} color={colors.mintDark} /> : <Copy size={14} color={colors.blue} />}
          />
        </View>
      )}

      {/* Info cards */}
      <View style={{ gap: 12, marginBottom: 28 }}>
        <InfoCard
          icon={<Wallet size={16} color={colors.blue} />}
          label="Montant / tour"
          value={`${group.montant.toLocaleString("fr-FR")} MAD`}
        />
        <InfoCard
          icon={<Calendar size={16} color={colors.blue} />}
          label="Date de début"
          value={formatStart(group.dateDebut)}
        />
        <InfoCard
          icon={<Repeat size={16} color={colors.blue} />}
          label="Fréquence"
          value={group.frequence.toLowerCase()}
          capitalize
        />
      </View>

      {/* Members */}
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={type.sectionTitle}>Membres</Text>
          {members.length >= group.nombreMembres && <Text style={type.small}>Groupe complet</Text>}
        </View>

        {isOrganisateur && members.length < group.nombreMembres && (
          <View style={{ marginBottom: 12 }}>
            <AddMemberForm groupId={id} onMemberAdded={loadData} />
          </View>
        )}

        {memberError && <Text style={[type.errorText, { marginBottom: 12 }]}>{memberError}</Text>}

        <Card>
          {sortedMembers.map((m, idx) => {
            const canRemoveThis = canRemoveMembers && m.role !== "ORGANISATEUR";
            const confirmingThis = memberToRemove === m.userId;
            const initials = `${m.firstname?.[0] ?? ""}${m.lastname?.[0] ?? ""}`.toUpperCase();

            const expanded = isOrganisateur && expandedId === m.userId;
            const contact = contacts[m.userId];

            const identity = (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.blue,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#fff" }}>{initials}</Text>
                </View>
                <View style={{ flexShrink: 1, gap: 4 }}>
                  <Text style={type.bodyMedium}>
                    {m.firstname} {m.lastname}
                  </Text>
                  {m.role === "ORGANISATEUR" && (
                    <View style={{ alignSelf: "flex-start" }}>
                      <Badge label="Organisateur" bg={colors.amberBg} fg={colors.amberText} />
                    </View>
                  )}
                </View>
              </View>
            );

            return (
              <View key={m.userId}>
                {idx > 0 && <Divider />}
                <View style={{ padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    {isOrganisateur ? (
                      <Select
                        compact
                        value={m.position != null ? String(m.position) : ""}
                        placeholder="-"
                        disabled={savingUserId === m.userId}
                        onChange={(v) => handlePositionChange(m.userId, v)}
                        options={Array.from({ length: group.nombreMembres }, (_, i) => i + 1).map((pos) => ({
                          value: String(pos),
                          label: String(pos),
                          disabled: takenPositions.has(pos) && pos !== m.position,
                        }))}
                      />
                    ) : (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.paleBlue,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.blue }}>
                          {m.position ?? "-"}
                        </Text>
                      </View>
                    )}

                    {isOrganisateur ? (
                      <Pressable
                        onPress={() => toggleMember(m.userId)}
                        accessibilityLabel="Voir les informations de contact"
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                      >
                        {identity}
                        <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
                          <ChevronDown size={16} color={colors.muted} />
                        </View>
                      </Pressable>
                    ) : (
                      <View style={{ flex: 1 }}>{identity}</View>
                    )}
                  </View>

                  {!confirmingThis && <Text style={type.tiny}>{m.email}</Text>}

                  {canRemoveThis && !confirmingThis && (
                    <Button
                      title="Retirer ce membre"
                      onPress={() => {
                        setMemberError(null);
                        setMemberToRemove(m.userId);
                      }}
                      variant="secondary"
                      size="sm"
                      icon={<UserMinus size={14} color={colors.blue} />}
                    />
                  )}

                  {canRemoveThis && confirmingThis && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={type.tiny}>Retirer ce membre ?</Text>
                      <Button
                        title={removing ? "..." : "Oui"}
                        onPress={() => handleRemoveMember(m.userId)}
                        disabled={removing}
                        variant="danger"
                        size="sm"
                      />
                      <Button
                        title="Non"
                        onPress={() => setMemberToRemove(null)}
                        disabled={removing}
                        variant="secondary"
                        size="sm"
                      />
                    </View>
                  )}
                </View>

                {expanded && (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                      borderStyle: "dashed",
                      backgroundColor: colors.rowBg,
                      padding: 16,
                      gap: 16,
                    }}
                  >
                    {(!contact || contact.status === "loading") && <Text style={type.small}>Chargement...</Text>}
                    {contact?.status === "error" && <Text style={type.errorText}>{contact.message}</Text>}
                    {contact?.status === "ok" && (
                      <>
                        <ContactItem
                          icon={<Mail size={16} color={colors.muted} />}
                          label="Email"
                          value={m.email}
                          href={`mailto:${m.email}`}
                          copied={copiedKey === `${m.userId}-email`}
                          onCopy={() => handleCopyValue(`${m.userId}-email`, m.email)}
                        />
                        <ContactItem
                          icon={<Phone size={16} color={colors.muted} />}
                          label="Téléphone"
                          value={contact.data.phone}
                          href={contact.data.phone ? `tel:${contact.data.phone.replace(/\s+/g, "")}` : undefined}
                          copied={copiedKey === `${m.userId}-phone`}
                          onCopy={() => contact.data.phone && handleCopyValue(`${m.userId}-phone`, contact.data.phone)}
                        />
                        <ContactItem
                          icon={<Landmark size={16} color={colors.muted} />}
                          label="IBAN"
                          value={contact.data.iban ? formatIban(contact.data.iban) : null}
                          copied={copiedKey === `${m.userId}-iban`}
                          onCopy={() =>
                            contact.data.iban &&
                            handleCopyValue(`${m.userId}-iban`, contact.data.iban.replace(/\s+/g, ""))
                          }
                        />
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </View>

      {/* Payments */}
      {group.statut === "ACTIVE" && (
        <View style={{ marginBottom: 28 }}>
          <PaymentsPanel
            groupId={id}
            groupName={group.nom}
            cycle={group.tourActuel}
            totalTurns={group.nombreMembres}
            amount={group.montant}
            members={members}
            currentUserId={userId}
            isOrganisateur={isOrganisateur}
            onTurnClosed={loadData}
          />
        </View>
      )}

      {group.description && (
        <View>
          <Text style={[type.sectionTitle, { marginBottom: 12 }]}>Description</Text>
          <Card style={{ padding: 18 }}>
            <Text style={type.body}>{group.description}</Text>
          </Card>
        </View>
      )}
    </Screen>
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
    <Card style={{ padding: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.paleBlue,
          }}
        >
          {icon}
        </View>
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.muted }}>{label}</Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.displayXL,
          fontSize: 20,
          color: colors.ink,
          textTransform: capitalize ? "capitalize" : "none",
        }}
      >
        {value}
      </Text>
    </Card>
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
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {icon}
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.muted }}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {value ? (
          <>
            {href ? (
              <Text
                onPress={() => Linking.openURL(href)}
                style={{ flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.blue }}
              >
                {value}
              </Text>
            ) : (
              <Text selectable style={{ flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink }}>
                {value}
              </Text>
            )}
            <Pressable
              onPress={onCopy}
              accessibilityLabel={`Copier ${label}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: "rgba(27,42,155,0.15)",
                backgroundColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {copied ? <Check size={14} color={colors.mintDark} /> : <Copy size={14} color={colors.muted} />}
            </Pressable>
          </>
        ) : (
          <Text style={{ fontFamily: fonts.regular, fontStyle: "italic", fontSize: 14, color: colors.muted }}>
            Non renseigné
          </Text>
        )}
      </View>
    </View>
  );
}
