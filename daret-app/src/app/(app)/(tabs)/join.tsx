import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, KeyRound, Plus, Search, ShieldCheck, Users, Wallet } from "lucide-react-native";
import { getInvitePreview, joinByInvite, type InvitePreview } from "@/lib/api";
import { Button, Card, ErrorBox, Input, Screen } from "@/components/Ui";
import { colors, fonts, type } from "@/lib/theme";

const STEPS = [
  { icon: KeyRound, title: "Entrez le code", text: "Demandez-le à l'organisateur de la daret." },
  { icon: Search, title: "Vérifiez les détails", text: "Montant, fréquence et nombre de membres." },
  { icon: CheckCircle2, title: "Rejoignez", text: "La daret apparaît dans votre liste." },
];

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.greenBg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

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

  const fill = found ? Math.min(100, Math.round((found.membresActuels / found.nombreMembres) * 100)) : 0;
  const spotsLeft = found ? Math.max(0, found.nombreMembres - found.membresActuels) : 0;
  const pot = found ? found.montant * found.nombreMembres : 0;

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

      {/* Empty state: how it works + trust note + create CTA */}
      {!found && !joined && !searching && (
        <View style={{ gap: 14 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink }}>Comment ça marche</Text>

          <Card style={{ padding: 18, gap: 16 }}>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <View key={title} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <IconBubble>
                  <Icon size={18} color={colors.blue} />
                </IconBubble>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.ink }}>
                    {i + 1}. {title}
                  </Text>
                  <Text style={type.small}>{text}</Text>
                </View>
              </View>
            ))}
          </Card>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              backgroundColor: colors.greenBg,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <ShieldCheck size={22} color={colors.mintDark} />
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.mintDark }}>
              Vous voyez toutes les conditions avant de rejoindre. Rien n'est engagé tant que vous n'avez pas confirmé.
            </Text>
          </View>

          <View style={{ alignItems: "center", gap: 8, marginTop: 8 }}>
            <Text style={type.small}>Pas de code ? Lancez votre propre daret.</Text>
            <Button
              title="Créer une daret"
              onPress={() => router.push("/darets")}
              variant="secondary"
              icon={<Plus size={16} color={colors.blue} />}
            />
          </View>
        </View>
      )}

      {found && !joined && (
        <Card style={{ padding: 22 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: 16 }}>{found.nom}</Text>

          <View style={{ gap: 8, marginBottom: 18 }}>
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

          {/* Members progress */}
          <View style={{ marginBottom: 18 }}>
            <View
              style={{ height: 8, borderRadius: 4, backgroundColor: colors.greenBg, overflow: "hidden", marginBottom: 6 }}
            >
              <View style={{ width: `${fill}%`, height: "100%", backgroundColor: colors.blue, borderRadius: 4 }} />
            </View>
            <Text style={type.small}>
              {spotsLeft > 0
                ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""}`
                : "Toutes les places sont prises"}
            </Text>
          </View>

          {/* Payout highlight */}
          <View style={{ backgroundColor: colors.greenBg, borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.mintDark }}>Cagnotte reçue à votre tour</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.mintDark }}>
              {pot.toLocaleString("fr-FR")} MAD
            </Text>
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
            alignItems: "center",
          }}
        >
          <CheckCircle2 size={44} color={colors.mintDark} />
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.mintDark, textAlign: "center" }}>
            Bienvenue dans la daret !
          </Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.mintDark, textAlign: "center" }}>
            Vous avez rejoint {found.nom}. Elle apparaît maintenant dans "Mes daret".
          </Text>
          <Button title="Voir mes daret" onPress={() => router.push("/darets")} variant="secondary" />
        </View>
      )}
    </Screen>
  );
}