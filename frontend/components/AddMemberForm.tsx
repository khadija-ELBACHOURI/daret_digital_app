"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { addMember } from "@/lib/api";
import { btnPrimary, card, errorText, inputClass } from "@/components/ui";

interface AddMemberFormProps {
  groupId: string;
  onMemberAdded: () => void | Promise<unknown>;
}

export default function AddMemberForm({ groupId, onMemberAdded }: AddMemberFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setError(null);
    setSubmitting(true);
    try {
      await addMember(groupId, trimmed);
      setEmail("");
      await onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} p-4`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email du membre à ajouter"
          aria-label="Email du membre à ajouter"
          required
          className={inputClass}
        />
        <button type="submit" disabled={submitting || !email.trim()} className={`${btnPrimary} whitespace-nowrap`}>
          <UserPlus className="h-4 w-4" />
          {submitting ? "Ajout..." : "Ajouter"}
        </button>
      </div>
      {error && (
        <p role="alert" className={`mt-2 ${errorText}`}>
          {error}
        </p>
      )}
    </form>
  );
}