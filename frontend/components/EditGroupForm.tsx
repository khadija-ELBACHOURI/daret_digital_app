"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { updateGroup, type DaretGroup } from "@/lib/api";

const inputClass =
  "w-full rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D492] disabled:opacity-50";

type Props = {
  group: DaretGroup;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
};

export default function EditGroupForm({ group, onSaved, onCancel }: Props) {
  const [nom, setNom] = useState(group.nom);
  const [montant, setMontant] = useState(String(group.montant));
  const [frequence, setFrequence] = useState(group.frequence);
  const [nombreMembres, setNombreMembres] = useState(String(group.nombreMembres));
  const [dateDebut, setDateDebut] = useState(group.dateDebut ?? "");
  const [description, setDescription] = useState(group.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Structure fields are only editable before the daret starts.
  const locked = group.statut !== "EN_ATTENTE";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateGroup(group.id, {
        nom,
        montant: Number(montant),
        frequence,
        nombreMembres: Number(nombreMembres),
        dateDebut,
        description,
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-[#1F2023] bg-[#101113] p-5">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
        Modifier la daret
      </h2>

      {locked && (
        <p className="mb-4 text-xs text-[#E5B800]">
          Le montant, la fréquence, le nombre de places et la date de début ne sont plus modifiables
          car la daret a déjà démarré.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-400">Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-400">Montant par tour (MAD)</label>
          <input
            type="number"
            min="1"
            step="any"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            disabled={locked}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-400">Fréquence</label>
          <select
            value={frequence}
            onChange={(e) => setFrequence(e.target.value)}
            disabled={locked}
            className={inputClass}
          >
            <option value="HEBDOMADAIRE">Hebdomadaire</option>
            <option value="MENSUELLE">Mensuelle</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-400">Nombre de places</label>
          <input
            type="number"
            min="2"
            value={nombreMembres}
            onChange={(e) => setNombreMembres(e.target.value)}
            disabled={locked}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-400">Date de début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            disabled={locked}
            className={inputClass}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[#26282C] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}