import { ReactNode, useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Coins, Layers, Plus, UserPlus, Wallet } from "lucide-react-native";
import {
  getMyGroups,
  getMyProfile,
  getPaymentsForCycle,
  type MyGroupResponse,
  type PaymentResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Button, Card, Divider, ErrorBox, Screen } from "@/components/Ui";
import { colors, fonts, statusStyles, type } from "@/lib/theme";

interface DueItem {
  group: MyGroupResponse;
  payment: PaymentResponse;
}

const money = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

export default function DashboardPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [due, setDue] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const [profile, myGroups] = await Promise.all([getMyProfile().catch(() => null), getMyGroups()]);
      setFirstname(profile?.firstname ?? "");
      setGroups(myGroups);

      // For each active daret, check whether my contribution for the current turn is still unpaid.
      const active = myGroups.filter((g) => g.statut === "ACTIVE");
      const checks = await Promise.all(
        active.map(async (g): Promise<DueItem | null> => {
          try {
            const payments = await getPaymentsForCycle(g.id, g.tourActuel);
            const mine = payments.find((p) => p.memberId === userId);
            if (mine && (mine.status === "PENDING" || mine.status === "LATE")) {
              return { group: g, payment: mine };
            }
          } catch {
            // a daret whose payments cannot be read is simply not listed as due
          }
          return null;
        })
      );
      setDue(checks.filter((c): c is DueItem => c !== null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger vos darets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Reload every time the tab gets focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const active = groups.filter((g) => g.statut === "ACTIVE");
  const preparing = groups.filter((g) => g.statut === "EN_ATTENTE");
  const totalDue = due.reduce((sum, d) => sum + d.payment.amount, 0);
  const perTurn = active.reduce((sum, g) => sum + g.montant, 0);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <View style={{ marginBottom: 24, gap: 14 }}>
        <View>
          <Text style={type.pageTitle}>Bonjour{firstname ? `, ${firstname}` : ""}</Text>
          <Text style={[type.small, { marginTop: 4 }]}>Voici où en sont vos darets.</Text>
        </View>
        <Button
          title="Nouvelle daret"
          onPress={() => router.push("/daret/creer")}
          icon={<Plus size={16} color="#fff" />}
        />
      </View>

      {error && (
        <View style={{ marginBottom: 20 }}>
          <ErrorBox message={error} />
        </View>
      )}
      {loading && !error && <Text style={type.small}>Chargement...</Text>}

      {!loading && !error && groups.length === 0 && (
        <Card style={{ padding: 28, alignItems: "center" }}>
          <Text style={[type.sectionTitle, { marginBottom: 8, textAlign: "center" }]}>
            Vous n'avez pas encore de daret
          </Text>
          <Text style={[type.small, { textAlign: "center", marginBottom: 20 }]}>
            Créez un groupe pour vos proches, ou rejoignez-en un avec le code d'invitation de l'organisateur.
          </Text>
          <View style={{ gap: 10, alignSelf: "stretch" }}>
            <Button
              title="Créer une daret"
              onPress={() => router.push("/daret/creer")}
              icon={<Plus size={16} color="#fff" />}
              full
            />
            <Button
              title="Rejoindre"
              onPress={() => router.push("/join")}
              variant="secondary"
              icon={<UserPlus size={16} color={colors.blue} />}
              full
            />
          </View>
        </Card>
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <View style={{ gap: 12, marginBottom: 28 }}>
            <StatCard
              icon={<Layers size={16} color={colors.blue} />}
              label="Darets actives"
              value={String(active.length)}
              hint={`${groups.length} au total`}
            />
            <StatCard
              icon={<Wallet size={16} color={due.length > 0 ? colors.amberText : colors.blue} />}
              label="À régler ce tour"
              value={due.length > 0 ? money(totalDue) : "Rien à payer"}
              hint={
                due.length > 0
                  ? `${due.length} cotisation${due.length > 1 ? "s" : ""} en attente`
                  : "Vos cotisations sont à jour"
              }
              highlight={due.length > 0}
            />
            <StatCard
              icon={<Coins size={16} color={colors.blue} />}
              label="Engagé par tour"
              value={money(perTurn)}
              hint="Somme de vos darets actives"
            />
          </View>

          {due.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text style={[type.sectionTitle, { marginBottom: 12 }]}>À régler</Text>
              <Card>
                {due.map(({ group, payment }, idx) => (
                  <View key={payment.id}>
                    {idx > 0 && <Divider />}
                    <View style={{ padding: 16, gap: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={type.bodyBold}>{group.nom}</Text>
                          <Text style={type.small}>
                            Tour {Math.min(group.tourActuel + 1, group.nombreMembres)}/{group.nombreMembres} ·{" "}
                            {money(payment.amount)}
                          </Text>
                        </View>
                        {payment.status === "LATE" ? (
                          <Badge label="En retard" bg={colors.dangerBg} fg={colors.dangerDark} />
                        ) : (
                          <Badge
                            label="À payer"
                            bg={statusStyles.EN_ATTENTE.bg}
                            fg={statusStyles.EN_ATTENTE.fg}
                          />
                        )}
                      </View>
                      <Button title="Payer" onPress={() => router.push(`/daret/${group.id}`)} size="sm" />
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {active.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text style={[type.sectionTitle, { marginBottom: 12 }]}>Mes darets actives</Text>
              <View style={{ gap: 12 }}>
                {active.map((g) => {
                  const turn = Math.min(g.tourActuel + 1, g.nombreMembres);
                  const myTurn = g.position != null && g.position === g.tourActuel + 1;
                  return (
                    <Pressable key={g.id} onPress={() => router.push(`/daret/${g.id}`)}>
                      <Card style={{ padding: 18 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink, flex: 1 }}>
                            {g.nom}
                          </Text>
                          <Badge
                            label={`Tour ${turn}/${g.nombreMembres}`}
                            bg={statusStyles.ACTIVE.bg}
                            fg={statusStyles.ACTIVE.fg}
                          />
                        </View>
                        <Text style={[type.small, { marginTop: 4 }]}>
                          {money(g.montant)} · {g.frequence.toLowerCase()}
                        </Text>

                        <View
                          style={{
                            marginTop: 16,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.greyBg,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.blue,
                              width: `${(g.tourActuel / g.nombreMembres) * 100}%`,
                            }}
                          />
                        </View>

                        <View
                          style={{
                            marginTop: 12,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={type.small}>
                            {g.position != null ? `Ma position : #${g.position}` : "Position non attribuée"}
                          </Text>
                          {myTurn && <Badge label="C'est votre tour" bg={colors.amberBg} fg={colors.amberText} />}
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {preparing.length > 0 && (
            <View>
              <Text style={[type.sectionTitle, { marginBottom: 12 }]}>En préparation</Text>
              <Card>
                {preparing.map((g, idx) => (
                  <View key={g.id}>
                    {idx > 0 && <Divider />}
                    <Pressable
                      onPress={() => router.push(`/daret/${g.id}`)}
                      style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 10 }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={type.bodyBold}>{g.nom}</Text>
                        <Text style={type.small}>
                          {money(g.montant)} · {g.nombreMembres} places ·{" "}
                          {g.role === "ORGANISATEUR" ? "Vous organisez" : "Vous participez"}
                        </Text>
                      </View>
                      <Badge
                        label={statusStyles.EN_ATTENTE.label}
                        bg={statusStyles.EN_ATTENTE.bg}
                        fg={statusStyles.EN_ATTENTE.fg}
                      />
                    </Pressable>
                  </View>
                ))}
              </Card>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      style={{
        padding: 18,
        borderColor: highlight ? colors.saffron : colors.line,
        backgroundColor: highlight ? colors.amberSoft : colors.white,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: highlight ? "rgba(255,184,28,0.3)" : colors.paleBlue,
          }}
        >
          {icon}
        </View>
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.muted }}>{label}</Text>
      </View>
      <Text style={{ fontFamily: fonts.displayXL, fontSize: 24, color: colors.ink }}>{value}</Text>
      {hint && <Text style={[type.tiny, { marginTop: 4 }]}>{hint}</Text>}
    </Card>
  );
}
