"use client";

import { useState, FormEvent } from "react";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthShell, { authButton } from "@/components/AuthShell";
import AuthField from "@/components/AuthField";
import { errorBox } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

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
      await register(nom, email, motDePasse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell mode="register" title="Créer un compte" subtitle="Rejoignez Daret Digital en quelques instants.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
        <AuthField
          id="nom"
          label="Nom complet"
          icon={<User className="h-5 w-5" />}
          autoComplete="name"
          placeholder="Prénom Nom"
          value={nom}
          onChange={setNom}
        />
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
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={motDePasse}
          onChange={setMotDePasse}
        />
        <AuthField
          id="confirmation"
          type="password"
          label="Confirmer le mot de passe"
          icon={<Lock className="h-5 w-5" />}
          autoComplete="new-password"
          value={confirmation}
          onChange={setConfirmation}
        />

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={`${authButton} mt-2`}>
          {isSubmitting ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>
    </AuthShell>
  );
}