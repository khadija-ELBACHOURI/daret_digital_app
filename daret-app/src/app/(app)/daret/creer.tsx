import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { createDaret } from "@/lib/api";
import { Button, Card, DateField, ErrorBox, Field, Input, Screen, Select, toDateString } from "@/components/Ui";
import { type } from "@/lib/theme";

const FREQUENCES = [
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuelle", label: "Mensuelle" },
];

export default function CreerDaretPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    montant: "",
    frequence: "mensuelle",
    nombreMembres: "",
    dateDebut: toDateString(new Date()),
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    setError(null);

    if (!form.nom.trim()) return setError("Donnez un nom à la daret.");
    if (!(Number(form.montant) >= 1)) return setError("Le montant par tour doit être d'au moins 1 MAD.");
    if (!(Number(form.nombreMembres) >= 2)) return setError("Une daret compte au moins 2 membres.");

    setSubmitting(true);
    try {
      const group = await createDaret({
        nom: form.nom.trim(),
        montant: Number(form.montant),
        frequence: form.frequence,
        nombreMembres: Number(form.nombreMembres),
        dateDebut: form.dateDebut,
        description: form.description || undefined,
      });
      router.replace(`/daret/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={[]}>
      <Text style={[type.pageTitle, { marginBottom: 4 }]}>Créer une daret</Text>
      <Text style={[type.small, { marginBottom: 24 }]}>
        Définissez les règles du groupe. Vous pourrez inviter des membres une fois la daret créée.
      </Text>

      <Card style={{ padding: 20, gap: 18 }}>
        <Field label="Nom de la daret">
          <Input value={form.nom} onChangeText={set("nom")} placeholder="Ex. Daret Bureau" />
        </Field>

        <Field label="Montant par tour (MAD)">
          <Input value={form.montant} onChangeText={set("montant")} keyboardType="numeric" placeholder="1000" />
        </Field>

        <Field label="Nombre de membres">
          <Input
            value={form.nombreMembres}
            onChangeText={set("nombreMembres")}
            keyboardType="number-pad"
            placeholder="8"
          />
        </Field>

        <Field label="Fréquence">
          <Select value={form.frequence} options={FREQUENCES} onChange={set("frequence")} />
        </Field>

        <Field label="Date de début">
          <DateField value={form.dateDebut} onChange={set("dateDebut")} />
        </Field>

        <Field label="Description (optionnel)">
          <Input
            value={form.description}
            onChangeText={set("description")}
            multiline
            numberOfLines={3}
            placeholder="Quelques précisions pour les membres..."
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </Field>

        {error && <ErrorBox message={error} />}

        <View>
          <Button
            title={submitting ? "Création..." : "Créer la daret"}
            onPress={handleSubmit}
            disabled={submitting}
            size="lg"
            full
          />
        </View>
      </Card>
    </Screen>
  );
}
