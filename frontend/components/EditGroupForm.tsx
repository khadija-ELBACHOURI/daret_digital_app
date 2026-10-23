"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { updateGroup, type DaretGroup } from "@/lib/api";
import { btnPrimary, btnSecondary, card, errorBox, inputClass, labelClass, sectionTitle } from "@/components/ui";

interface EditGroupFormProps {
  group: DaretGroup;
  onSaved: () => void | Promise<unknown>;
  onCancel: () => void;
}

export default function EditGroupForm({ group, onSaved, onCancel }: EditGroupFormProps) {
  const [form, setForm] = useState({
    nom: group.nom,
    montant: String(group.montant),
    frequence: group.frequence.toLowerCase(),
    nombreMembres: String(group.nombreMembres),
    dateDebut: group.dateDebut.slice(0, 10), // "YYYY-MM-DD"
    description: group.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateGroup(group.id, {
        nom: form.nom,
        montant: Number(form.montant),
        frequence: form.frequence,
        nombreMembres: Number(form.nombreMembres),
        dateDebut: form.dateDebut,
        description: form.description,
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} mb-6 space-y-4 p-6`}>
      <h2 className={sectionTitle}>Modifier la daret</h2>

      <Field label="Nom de la daret">
        <input name="nom" value={form.nom} onChange={handleChange} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Montant par tour (MAD)">
          <input type="number" name="montant" value={form.montant} onChange={handleChange} required min={1} className={inputClass} />
        </Field>
        <Field label="Nombre de membres">
          <input
            type="number"
            name="nombreMembres"
            value={form.nombreMembres}
            onChange={handleChange}
            required
            min={2}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fréquence">
          <select name="frequence" value={form.frequence} onChange={handleChange} className={inputClass}>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuelle">Mensuelle</option>
          </select>
        </Field>
        <Field label="Date de début">
          <input type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} required className={inputClass} />
        </Field>
      </div>

      <Field label="Description (optionnel)">
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={btnSecondary}>
          Annuler
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}