import { useState } from "react";
import { View } from "react-native";
import { Lock, Mail, User } from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import AuthField from "@/components/AuthField";
import { Button, ErrorBox } from "@/components/Ui";
import { colors } from "@/lib/theme";

export default function RegisterPage() {
  const { register } = useAuth();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!nom.trim() || !email.trim()) {
      setError("Renseignez votre nom et votre email.");
      return;
    }
    if (motDePasse.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(nom.trim(), email.trim(), motDePasse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell mode="register" title="Créer un compte" subtitle="Rejoignez Daret Digital en quelques instants.">
      <View style={{ marginTop: 24, gap: 14 }}>
        <AuthField
          label="Nom complet"
          icon={<User size={20} color={colors.muted} />}
          autoComplete="name"
          placeholder="Prénom Nom"
          value={nom}
          onChange={setNom}
        />
        <AuthField
          type="email"
          label="Adresse email"
          icon={<Mail size={20} color={colors.muted} />}
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          type="password"
          label="Mot de passe"
          icon={<Lock size={20} color={colors.muted} />}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={motDePasse}
          onChange={setMotDePasse}
        />
        <AuthField
          type="password"
          label="Confirmer le mot de passe"
          icon={<Lock size={20} color={colors.muted} />}
          autoComplete="new-password"
          value={confirmation}
          onChange={setConfirmation}
        />

        {error && <ErrorBox message={error} />}

        <Button
          title={isSubmitting ? "Création en cours..." : "Créer mon compte"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          full
          style={{ marginTop: 4 }}
        />
      </View>
    </AuthShell>
  );
}
