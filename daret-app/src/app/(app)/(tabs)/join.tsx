import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Search, Users, Wallet } from "lucide-react-native";
import { getInvitePreview, joinByInvite, type InvitePreview } from "@/lib/api";
import { Button, Card, ErrorBox, Input, Screen } from "@/components/Ui";
import { colors, fonts, type } from "@/lib/theme";

export default function RejoindreDaretPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<InvitePreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);
    setFound(null);
    setJoined(false);

    try {
      setFound(await getInvitePreview(trimmed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSearching(false);
    }
  }

  async function handleJoin() {
    if (!found) return;

    setJoining(true);
    setError(null);

    try {
      await joinByInvite(code);
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setJoining(false);
    }
  }

  const isFull = found ? found.membresActuels >= found.nombreMembres : false;
  const isClosed = found ? found.statut !== "EN_ATTENTE" : false;
  const canJoin = !isFull && !isClosed;

  return (
    <Screen>
      <Text style={[type.pageTitle, { marginBottom: 4 }]}>Rejoindre une daret</Text>
      <Text style={[type.small, { marginBottom: 24 }]}>Entrez le code d'invitation partagé par l'organisateur.</Text>

      <View style={{ gap: 10, marginBottom: 24 }}>
        <Input
          value={code}
          onChangeText={setCode}
          placeholder="Ex. DARET-8F2K1"
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel="Code d'invitation"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button
          title="Rechercher"
          onPress={handleSearch}
          disabled={!code.trim()}
          loading={searching}
          icon={searching ? undefined : <Search size={16} color="#fff" />}
          full
        />
      </View>

      {error && (
        <View style={{ marginBottom: 16 }}>
          <ErrorBox message={error} />
        </View>
      )}

      {found && !joined && (
        <Card style={{ padding: 22 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: 16 }}>{found.nom}</Text>
          <View style={{ gap: 8, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Wallet size={16} color={colors.blue} />
              <Text style={type.body}>
                {found.montant.toLocaleString("fr-FR")} MAD · {found.frequence.toLowerCase()}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Users size={16} color={colors.blue} />
              <Text style={type.body}>
                {found.membresActuels}/{found.nombreMembres} membres · {found.nombreMembres} tours
              </Text>
            </View>
          </View>

          {!canJoin && (
            <View
              style={{ backgroundColor: colors.amberBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 }}
            >
              <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.amberText }}>
                {isFull ? "Cette daret est complète." : "Cette daret n'accepte plus de nouveaux membres."}
              </Text>
            </View>
          )}

          <Button
            title="Rejoindre cette daret"
            onPress={handleJoin}
            disabled={!canJoin}
            loading={joining}
            full
          />
        </Card>
      )}

      {joined && found && (
        <View
          style={{
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "rgba(61,219,194,0.5)",
            backgroundColor: colors.greenBg,
            padding: 22,
            gap: 16,
          }}
        >
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.mintDark }}>
            Vous avez rejoint {found.nom}. Elle apparaît maintenant dans "Mes daret".
          </Text>
          <Button title="Voir mes daret" onPress={() => router.push("/darets")} variant="secondary" />
        </View>
      )}
    </Screen>
  );
}
