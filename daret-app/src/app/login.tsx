import { useState } from "react";
import { View } from "react-native";
import { Lock, Mail } from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import AuthField from "@/components/AuthField";
import { Button, ErrorBox } from "@/components/Ui";
import { colors } from "@/lib/theme";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !motDePasse) {
      setError("Renseignez votre email et votre mot de passe.");
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email.trim(), motDePasse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell mode="login" title="Bon retour" subtitle="Connectez-vous pour retrouver vos darets.">
      <View style={{ marginTop: 24, gap: 14 }}>
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
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          value={motDePasse}
          onChange={setMotDePasse}
        />

        {error && <ErrorBox message={error} />}

        <Button
          title={isSubmitting ? "Connexion en cours..." : "Se connecter"}
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
