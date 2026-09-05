"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { addMember } from "@/lib/api";

export default function AddMemberForm({
  groupId,
  onMemberAdded,
}: {
  groupId: string;
  onMemberAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await addMember(groupId, email);
      setEmail("");
      onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemple.com"
        className="flex-1 rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#00D492] focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" />
        {loading ? "Ajout..." : "Ajouter"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}