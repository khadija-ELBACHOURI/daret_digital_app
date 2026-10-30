import { useState } from "react";
import { Text, View } from "react-native";
import { UserPlus } from "lucide-react-native";
import { addMember } from "@/lib/api";
import { Button, Card, Input } from "@/components/Ui";
import { type } from "@/lib/theme";

interface AddMemberFormProps {
  groupId: string;
  onMemberAdded: () => void | Promise<unknown>;
}

export default function AddMemberForm({ groupId, onMemberAdded }: AddMemberFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed) return;

    setError(null);
    setSubmitting(true);
    try {
      await addMember(groupId, trimmed);
      setEmail("");
      await onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={{ padding: 16, gap: 10 }}>
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="Email du membre à ajouter"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Email du membre à ajouter"
      />
      <Button
        title={submitting ? "Ajout..." : "Ajouter"}
        onPress={handleSubmit}
        disabled={submitting || !email.trim()}
        icon={<UserPlus size={16} color="#fff" />}
        full
      />
      {error && (
        <View>
          <Text style={type.errorText}>{error}</Text>
        </View>
      )}
    </Card>
  );
}
