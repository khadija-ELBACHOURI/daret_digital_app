import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus, UserPlus, Users } from "lucide-react-native";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";
import { Badge, Button, Card, Divider, ErrorBox, Screen } from "@/components/Ui";
import { colors, fonts, statusStyles, type } from "@/lib/theme";

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
  const router = useRouter();
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  const load = useCallback(() => {
    setError(null);
    return getMyGroups()
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <View style={{ marginBottom: 20, gap: 14 }}>
        <View>
          <Text style={type.pageTitle}>Mes daret</Text>
          <Text style={[type.small, { marginTop: 4 }]}>
            {groups.length} daret{groups.length > 1 ? "s" : ""} au total
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            title="Rejoindre"
            onPress={() => router.push("/join")}
            variant="secondary"
            icon={<UserPlus size={16} color={colors.blue} />}
          />
          <Button
            title="Nouvelle daret"
            onPress={() => router.push("/daret/creer")}
            icon={<Plus size={16} color="#fff" />}
          />
        </View>
      </View>

      {loading && <Text style={type.small}>Chargement...</Text>}
      {error && <ErrorBox message={error} />}

      {!loading && !error && groups.length === 0 && (
        <Card style={{ padding: 28, alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.greenBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={26} color={colors.blue} />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink }}>Aucune daret pour le moment</Text>
          <Text style={[type.small, { textAlign: "center" }]}>
            Créez-en une ou rejoignez-en une avec un code d'invitation.
          </Text>
        </Card>
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          {/* Status filters */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {FILTERS.map((f) => {
              const selected = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: selected ? colors.blue : "#E3E7F3",
                    backgroundColor: selected ? colors.blue : "#fff",
                  }}
                >
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: selected ? "#fff" : "#5B6190" }}>
                    {f.label} {counts[f.key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <Card style={{ padding: 24 }}>
              <Text style={[type.small, { textAlign: "center" }]}>Aucune daret dans cette catégorie.</Text>
            </Card>
          ) : (
            <Card>
              {visible.map((g, idx) => {
                const status = statusStyles[g.statut] ?? statusStyles.EN_ATTENTE;
                const myTurn = g.statut === "ACTIVE" && g.position != null && g.position === g.tourActuel + 1;
                return (
                  <View key={g.id}>
                    {idx > 0 && <Divider />}
                    <Pressable onPress={() => router.push(`/daret/${g.id}`)} style={{ padding: 16, gap: 10 }}>
                      <View
                        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}
                      >
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.blue, flex: 1 }}>
                          {g.nom}
                        </Text>
                        <Badge label={status.label} bg={status.bg} fg={status.fg} />
                      </View>

                      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4 }}>
                        <Text style={type.body}>{g.montant.toLocaleString("fr-FR")} MAD</Text>
                        <Text style={[type.body, { textTransform: "capitalize" }]}>{g.frequence.toLowerCase()}</Text>
                        <Text style={type.small}>Tour {tourLabel(g)}</Text>
                        <Text style={type.small}>Position {g.position != null ? `#${g.position}` : "-"}</Text>
                      </View>

                      {g.statut !== "EN_ATTENTE" && (
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: "#E8EAF4", overflow: "hidden" }}>
                          <View
                            style={{
                              width: `${progress(g)}%`,
                              height: "100%",
                              backgroundColor: colors.blue,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                      )}

                      {myTurn && (
                        <View
                          style={{
                            alignSelf: "flex-start",
                            backgroundColor: colors.greenBg,
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.mintDark }}>
                            C'est votre tour
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}