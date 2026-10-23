"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { btnPrimary, display, errorBox, inputClass, labelClass } from "@/components/ui";

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
    <AuthShell
      headline={
        <>
          À chacun
          <br />
          son tour.
        </>
      }
      tagline="Cotisations, ordre de passage et versements de votre daret, au même endroit."
    >
      <h1 className={`${display} text-4xl font-extrabold text-[#0E1442]`}>Connexion</h1>
      <p className="mt-2 text-[15px] text-[#5B6190]">Retrouvez vos darets et votre prochain tour.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            autoComplete="current-password"
            placeholder="Votre mot de passe"
          />
        </div>

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3.5 text-base`}>
          {isSubmitting ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#5B6190]">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#1B2A9B] underline decoration-[#FFB81C] decoration-2 underline-offset-4 hover:decoration-[#1B2A9B]"
        >
          Créer un compte
        </Link>
      </p>
    </AuthShell>
  );
}