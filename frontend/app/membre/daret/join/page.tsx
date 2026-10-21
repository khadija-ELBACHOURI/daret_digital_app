"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Loader2, Search, Users, Wallet } from "lucide-react";
import { getInvitePreview, joinByInvite, type InvitePreview } from "@/lib/api";

const inputClass =
  "w-full rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D492]";

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
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Reessayez.");
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
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Reessayez.");
    } finally {
      setJoining(false);
    }
  }

  const isFull = found ? found.membresActuels >= found.nombreMembres : false;
  const isClosed = found ? found.statut !== "EN_ATTENTE" : false;
  const canJoin = !isFull && !isClosed;

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-white">Rejoindre une daret</h1>
      <p className="mb-6 text-sm text-gray-400">Entrez le code d'invitation partagé par l'organisateur.</p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex. DARET-8F2K1"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={searching || !code.trim()}
          className="flex items-center gap-2 whitespace-nowrap rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Rechercher
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {found && !joined && (
        <div className="rounded-lg border border-[#1F2023] bg-[#101113] p-5">
          <h2 className="mb-3 text-lg font-medium text-white">{found.nom}</h2>
          <div className="mb-4 space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {found.montant.toLocaleString("fr-FR")} MAD · {found.frequence.toLowerCase()}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {found.membresActuels}/{found.nombreMembres} membres · {found.nombreMembres} tours
            </div>
          </div>

          {!canJoin && (
            <p className="mb-3 text-sm text-amber-400">
              {isFull ? "Cette daret est complète." : "Cette daret n'accepte plus de nouveaux membres."}
            </p>
          )}

          <button
            onClick={handleJoin}
            disabled={joining || !canJoin}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#00D492] px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {joining && <Loader2 className="h-4 w-4 animate-spin" />}
            Rejoindre cette daret
          </button>
        </div>
      )}

      {joined && found && (
        <div className="rounded-lg border border-[#1F2023] bg-[#0F1A15] p-5 text-sm text-[#00D492]">
          Vous avez rejoint {found.nom}. Elle apparaît maintenant dans "Mes daret".
        </div>
      )}
    </div>
  );
}