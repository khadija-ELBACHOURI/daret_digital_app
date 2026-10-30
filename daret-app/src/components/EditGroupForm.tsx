import { useState } from "react";
import { Text, View } from "react-native";
import { updateGroup, type DaretGroup } from "@/lib/api";
import { Button, Card, DateField, ErrorBox, Field, Input, Select } from "@/components/Ui";
import { type } from "@/lib/theme";

interface EditGroupFormProps {
  group: DaretGroup;
  onSaved: () => void | Promise<unknown>;
  onCancel: () => void;
}

const FREQUENCES = [
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuelle", label: "Mensuelle" },
];

export default function EditGroupForm({ group, onSaved, onCancel }: EditGroupFormProps) {
  const [form, setForm] = useState({
    nom: group.nom,
    montant: String(group.montant),
    frequence: group.frequence.toLowerCase(),
    nombreMembres: String(group.nombreMembres),
    dateDebut: group.dateDebut.slice(0, 10), // "YYYY-MM-DD"
    description: group.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      await updateGroup(group.id, {
        nom: form.nom,
        montant: Number(form.montant),
        frequence: form.frequence,
        nombreMembres: Number(form.nombreMembres),
        dateDebut: form.dateDebut,
        description: form.description,
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ padding: 20, marginBottom: 24, gap: 16 }}>
      <Text style={type.sectionTitle}>Modifier la daret</Text>

      <Field label="Nom de la daret">
        <Input value={form.nom} onChangeText={set("nom")} />
      </Field>

      <Field label="Montant par tour (MAD)">
        <Input value={form.montant} onChangeText={set("montant")} keyboardType="numeric" />
      </Field>

      <Field label="Nombre de membres">
        <Input value={form.nombreMembres} onChangeText={set("nombreMembres")} keyboardType="number-pad" />
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
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
      </Field>

      {error && <ErrorBox message={error} />}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title={saving ? "Enregistrement..." : "Enregistrer"} onPress={handleSubmit} disabled={saving} />
        <Button title="Annuler" onPress={onCancel} disabled={saving} variant="secondary" />
      </View>
    </Card>
  );
}
