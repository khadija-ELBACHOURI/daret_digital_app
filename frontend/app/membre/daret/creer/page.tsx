"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDaret } from "@/lib/api";
import { btnPrimary, card, errorBox, inputClass, labelClass, pageTitle, subtle } from "@/components/ui";

export default function CreerDaretPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    montant: "",
    frequence: "mensuelle",
    nombreMembres: "",
    dateDebut: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const group = await createDaret({
        nom: form.nom,
        montant: Number(form.montant),
        frequence: form.frequence,
        nombreMembres: Number(form.nombreMembres),
        dateDebut: form.dateDebut,
        description: form.description || undefined,
      });
      router.push(`/membre/daret/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className={`${pageTitle} mb-1`}>Créer une daret</h1>
      <p className={`mb-6 text-sm ${subtle}`}>
        Définissez les règles du groupe. Vous pourrez inviter des membres une fois la daret créée.
      </p>

      <form onSubmit={handleSubmit} className={`${card} space-y-5 p-6`}>
        <Field label="Nom de la daret">
          <input name="nom" value={form.nom} onChange={handleChange} required placeholder="Ex. Daret Bureau" className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Montant par tour (MAD)">
            <input
              type="number"
              name="montant"
              value={form.montant}
              onChange={handleChange}
              required
              min={1}
              placeholder="1000"
              className={inputClass}
            />
          </Field>
          <Field label="Nombre de membres">
            <input
              type="number"
              name="nombreMembres"
              value={form.nombreMembres}
              onChange={handleChange}
              required
              min={2}
              placeholder="8"
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
            placeholder="Quelques précisions pour les membres..."
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && <p role="alert" className={errorBox}>{error}</p>}

        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? "Création..." : "Créer la daret"}
        </button>
      </form>
    </div>
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