"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D492]";

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

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: remplacer par l'appel réel à lib/api.ts (POST /darets)
    setTimeout(() => {
      setSubmitting(false);
      router.push("/membre/daret");
    }, 800);
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-white">Créer une daret</h1>
      <p className="mb-6 text-sm text-gray-400">
        Définissez les règles du groupe. Vous pourrez inviter des membres une fois créée.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Nom de la daret">
          <input name="nom" value={form.nom} onChange={handleChange} required placeholder="Ex. Daret Bureau" className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[#00D492] px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-60"
        >
          {submitting ? "Création..." : "Créer la daret"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-300">{label}</span>
      {children}
    </label>
  );
}