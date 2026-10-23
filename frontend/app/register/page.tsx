"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { btnPrimary, display, errorBox, inputClass, labelClass } from "@/components/ui";

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
    <AuthShell
      startIndex={5}
      headline={
        <>
          Rejoignez
          <br />
          le cercle.
        </>
      }
      tagline="Créez votre compte pour organiser une daret entre proches, ou rejoindre un groupe existant en quelques minutes."
    >
      <h1 className={`${display} text-4xl font-extrabold text-[#0E1442]`}>Créer un compte</h1>
      <p className="mt-2 text-[15px] text-[#5B6190]">Rejoignez Daret Digital en quelques instants.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="nom" className={labelClass}>
            Nom complet
          </label>
          <input
            id="nom"
            type="text"
            required
            autoComplete="name"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={inputClass}
            placeholder="Prénom Nom"
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <PasswordInput
            id="password"
            value={motDePasse}
            onChange={setMotDePasse}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
          />
        </div>

        <div>
          <label htmlFor="confirmation" className={labelClass}>
            Confirmer le mot de passe
          </label>
          <PasswordInput
            id="confirmation"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3.5 text-base`}>
          {isSubmitting ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#5B6190]">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#1B2A9B] underline decoration-[#FFB81C] decoration-2 underline-offset-4 hover:decoration-[#1B2A9B]"
        >
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}