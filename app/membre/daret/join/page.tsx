"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Search, Users, Wallet } from "lucide-react";
import { mockDarets, type Daret } from "@/lib/mock-data";

const inputClass =
  "w-full rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D492]";

export default function RejoindreDaretPage() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Daret | null>(null);
  const [searched, setSearched] = useState(false);
  const [joined, setJoined] = useState(false);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearched(true);
    setJoined(false);
    // Mock : n'importe quel code non vide renvoie une daret d'exemple.
    // TODO: remplacer par un appel réel à lib/api.ts (GET /darets/invite/:code)
    setFound(code.trim() ? mockDarets[1] : null);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-white">Rejoindre une daret</h1>
      <p className="mb-6 text-sm text-gray-400">Entrez le code d'invitation partagé par l'organisateur.</p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex. DARET-8F2K1" className={inputClass} />
        <button
          type="submit"
          className="flex items-center gap-2 whitespace-nowrap rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184]"
        >
          <Search className="h-4 w-4" />
          Rechercher
        </button>
      </form>

      {searched && !found && (
        <p className="text-sm text-gray-500">Aucune daret trouvée pour ce code. Vérifiez le code et réessayez.</p>
      )}

      {found && !joined && (
        <div className="rounded-lg border border-[#1F2023] bg-[#101113] p-5">
          <h2 className="mb-3 text-lg font-medium text-white">{found.name}</h2>
          <div className="mb-4 space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {found.amount.toLocaleString("fr-FR")} MAD · {found.frequency}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {found.members.length} membres · {found.totalTurns} tours
            </div>
          </div>
          <button
            onClick={() => setJoined(true)}
            className="w-full rounded-md bg-[#00D492] px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#00c184]"
          >
            Rejoindre cette daret
          </button>
        </div>
      )}

      {joined && found && (
        <div className="rounded-lg border border-[#1F2023] bg-[#0F1A15] p-5 text-sm text-[#00D492]">
          Vous avez rejoint {found.name}. Elle apparaît maintenant dans "Mes daret".
        </div>
      )}
    </div>
  );
}