"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, Plus, Search, ShieldCheck, Users, Wallet } from "lucide-react";
import { getInvitePreview, joinByInvite, type InvitePreview } from "@/lib/api";
import {
  btnPrimary,
  btnSecondary,
  card,
  display,
  errorBox,
  inputClass,
  pageTitle,
  subtle,
} from "@/components/ui";

const STEPS = [
  { icon: KeyRound, title: "Entrez le code", text: "Demandez-le à l'organisateur de la daret." },
  { icon: Search, title: "Vérifiez les détails", text: "Montant, fréquence et nombre de membres." },
  { icon: CheckCircle2, title: "Rejoignez", text: "La daret apparaît dans votre liste." },
];

export default function RejoindreDaretPage() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<InvitePreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);
    setFound(null);
    setJoined(false);

    try {
      setFound(await getInvitePreview(trimmed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSearching(false);
    }
  }

  async function handleJoin() {
    if (!found) return;

    setJoining(true);
    setError(null);

    try {
      await joinByInvite(code);
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setJoining(false);
    }
  }

  const isFull = found ? found.membresActuels >= found.nombreMembres : false;
  const isClosed = found ? found.statut !== "EN_ATTENTE" : false;
  const canJoin = !isFull && !isClosed;

  const fill = found ? Math.min(100, Math.round((found.membresActuels / found.nombreMembres) * 100)) : 0;
  const spotsLeft = found ? Math.max(0, found.nombreMembres - found.membresActuels) : 0;
  const pot = found ? found.montant * found.nombreMembres : 0;

  return (
    <div className="max-w-lg">
      <h1 className={`${pageTitle} mb-1`}>Rejoindre une daret</h1>
      <p className={`mb-6 text-sm ${subtle}`}>Entrez le code d&apos;invitation partagé par l&apos;organisateur.</p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex. DARET-8F2K1"
          aria-label="Code d'invitation"
          className={inputClass}
        />
        <button type="submit" disabled={searching || !code.trim()} className={`${btnPrimary} whitespace-nowrap`}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Rechercher
        </button>
      </form>

      {error && <p role="alert" className={`mb-4 ${errorBox}`}>{error}</p>}

      {/* Empty state: how it works, trust note, create CTA */}
      {!found && !joined && !searching && (
        <div className="space-y-4">
          <h2 className={`${display} text-lg font-bold text-[#0E1442]`}>Comment ça marche</h2>

          <div className={`${card} space-y-5 p-5`}>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDF7F2]">
                  <Icon className="h-5 w-5 text-[#1B2A9B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0E1442]">
                    {i + 1}. {title}
                  </p>
                  <p className={`text-sm ${subtle}`}>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#DDF7F2] p-4 text-sm text-[#0B7A69]">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <p>Vous voyez toutes les conditions avant de rejoindre. Rien n&apos;est engagé tant que vous n&apos;avez pas confirmé.</p>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <p className={`text-sm ${subtle}`}>Pas de code ? Lancez votre propre daret.</p>
            <Link href="/membre/daret" className={btnSecondary}>
              <Plus className="h-4 w-4" />
              Créer une daret
            </Link>
          </div>
        </div>
      )}

      {found && !joined && (
        <div className={`${card} p-6`}>
          <h2 className={`${display} mb-4 text-xl font-bold text-[#0E1442]`}>{found.nom}</h2>

          <div className="mb-5 space-y-2 text-sm text-[#0E1442]">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#1B2A9B]" />
              {found.montant.toLocaleString("fr-FR")} MAD · {found.frequence.toLowerCase()}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#1B2A9B]" />
              {found.membresActuels}/{found.nombreMembres} membres · {found.nombreMembres} tours
            </div>
          </div>

          {/* Members progress */}
          <div className="mb-5">
            <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-[#DDF7F2]">
              <div className="h-full rounded-full bg-[#1B2A9B] transition-all" style={{ width: `${fill}%` }} />
            </div>
            <p className={`text-xs ${subtle}`}>
              {spotsLeft > 0
                ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""}`
                : "Toutes les places sont prises"}
            </p>
          </div>

          {/* Payout highlight */}
          <div className="mb-5 rounded-xl bg-[#DDF7F2] p-4">
            <p className="text-xs text-[#0B7A69]">Cagnotte reçue à votre tour</p>
            <p className={`${display} text-2xl font-bold text-[#0B7A69]`}>{pot.toLocaleString("fr-FR")} MAD</p>
          </div>

          {!canJoin && (
            <p className="mb-4 rounded-xl bg-[#FFF3D1] px-4 py-3 text-sm text-[#8A5A00]">
              {isFull ? "Cette daret est complète." : "Cette daret n'accepte plus de nouveaux membres."}
            </p>
          )}

          <button onClick={handleJoin} disabled={joining || !canJoin} className={`${btnPrimary} w-full`}>
            {joining && <Loader2 className="h-4 w-4 animate-spin" />}
            Rejoindre cette daret
          </button>
        </div>
      )}

      {joined && found && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-[#3DDBC2]/50 bg-[#DDF7F2] p-6 text-center">
          <CheckCircle2 className="h-11 w-11 text-[#0B7A69]" />
          <h2 className={`${display} text-xl font-bold text-[#0B7A69]`}>Bienvenue dans la daret !</h2>
          <p className="text-sm font-medium text-[#0B7A69]">
            Vous avez rejoint {found.nom}. Elle apparaît maintenant dans &quot;Mes daret&quot;.
          </p>
          <Link href="/membre/daret" className={btnSecondary}>
            Voir mes daret
          </Link>
        </div>
      )}
    </div>
  );
}