import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus, UserPlus } from "lucide-react-native";
import { getMyGroups, type MyGroupResponse } from "@/lib/api";
import { Badge, Button, Card, Divider, ErrorBox, Screen } from "@/components/Ui";
import { colors, fonts, statusStyles, type } from "@/lib/theme";

function tourLabel(g: MyGroupResponse): string {
  if (g.statut === "EN_ATTENTE") return "-";
  if (g.statut === "TERMINEE") return `${g.nombreMembres}/${g.nombreMembres}`;
  return `${Math.min(g.tourActuel + 1, g.nombreMembres)}/${g.nombreMembres}`;
}

export default function MesDaretPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Card style={{ padding: 28 }}>
          <Text style={[type.small, { textAlign: "center" }]}>
            Aucune daret pour le moment. Créez-en une ou rejoignez-en une avec un code d'invitation.
          </Text>
        </Card>
      )}

      {!loading && !error && groups.length > 0 && (
        <Card>
          {groups.map((g, idx) => {
            const status = statusStyles[g.statut] ?? statusStyles.EN_ATTENTE;
            return (
              <View key={g.id}>
                {idx > 0 && <Divider />}
                <Pressable onPress={() => router.push(`/daret/${g.id}`)} style={{ padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.blue, flex: 1 }}>{g.nom}</Text>
                    <Badge label={status.label} bg={status.bg} fg={status.fg} />
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4 }}>
                    <Text style={type.body}>{g.montant.toLocaleString("fr-FR")} MAD</Text>
                    <Text style={[type.body, { textTransform: "capitalize" }]}>{g.frequence.toLowerCase()}</Text>
                    <Text style={type.small}>Tour {tourLabel(g)}</Text>
                    <Text style={type.small}>Position {g.position != null ? `#${g.position}` : "-"}</Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
