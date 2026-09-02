"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { TurnRing } from "@/components/TurnRing";

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
    <div className="flex min-h-screen bg-[#0F2A35]">
      {/* Left: signature panel, hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0B222B] p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#C9A227]" />
          <span className="font-serif text-lg tracking-wide text-[#F2E8D5]">
            Daret Digital
          </span>
        </div>

        <div className="mx-auto h-64 w-64">
          <TurnRing activeIndex={2} />
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-[#F2E8D5]/60">
          Chaque tour compte. Suivez les cotisations, l&apos;ordre de passage
          et l&apos;historique de votre daret, sans dispute ni feuille de
          calcul perdue.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-serif text-3xl text-[#F2E8D5]">
            Bon retour parmi nous
          </h1>
          <p className="mt-2 text-sm text-[#F2E8D5]/60">
            Connectez-vous pour retrouver vos groupes de daret.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wide text-[#F2E8D5]/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#F2E8D5]/15 bg-[#0B222B] px-4 py-2.5 text-[#F2E8D5] placeholder:text-[#F2E8D5]/30 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wide text-[#F2E8D5]/70"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#F2E8D5]/15 bg-[#0B222B] px-4 py-2.5 text-[#F2E8D5] placeholder:text-[#F2E8D5]/30 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                placeholder="********"
              />
            </div>

            {error && (
              <p className="rounded-md border border-[#B5533C]/40 bg-[#B5533C]/10 px-3 py-2 text-sm text-[#E8A08F]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#C9A227] px-4 py-2.5 font-medium text-[#0F2A35] transition hover:bg-[#DBB63A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#F2E8D5]/60">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-[#C9A227] hover:underline">
              Creer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
