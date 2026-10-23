"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Search, Users, Wallet } from "lucide-react";
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
        <div className="rounded-2xl border-2 border-[#3DDBC2]/50 bg-[#DDF7F2] p-6">
          <p className="mb-4 text-sm font-medium text-[#0B7A69]">
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