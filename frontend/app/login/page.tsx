"use client";

import { useState, FormEvent } from "react";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthShell, { authButton } from "@/components/AuthShell";
import AuthField from "@/components/AuthField";
import { errorBox } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, motDePasse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell mode="login" title="Bon retour" subtitle="Connectez-vous pour retrouver vos darets.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
        <AuthField
          id="email"
          type="email"
          label="Adresse email"
          icon={<Mail className="h-5 w-5" />}
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          id="password"
          type="password"
          label="Mot de passe"
          icon={<Lock className="h-5 w-5" />}
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          value={motDePasse}
          onChange={setMotDePasse}
        />

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={`${authButton} mt-2`}>
          {isSubmitting ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </AuthShell>
  );
}