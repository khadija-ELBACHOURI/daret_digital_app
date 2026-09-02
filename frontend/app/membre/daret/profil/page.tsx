"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { mockUser } from "@/lib/mock-data";

const inputClass =
  "w-full rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D492]";

export default function ProfilPage() {
  const [profile, setProfile] = useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    iban: mockUser.iban,
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);

  function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: remplacer par l'appel réel à lib/api.ts (PATCH /users/me)
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: remplacer par l'appel réel à lib/api.ts (PATCH /users/me/password)
    setSavedPassword(true);
    setPasswords({ current: "", next: "", confirm: "" });
    setTimeout(() => setSavedPassword(false), 2000);
  }

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-white">Profil</h1>
        <p className="mb-6 text-sm text-gray-400">Vos informations personnelles.</p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Field label="Nom complet">
            <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Téléphone">
            <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="IBAN (pour recevoir vos tours)">
            <input value={profile.iban} onChange={(e) => setProfile((p) => ({ ...p, iban: e.target.value }))} className={inputClass} />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184]"
          >
            {savedProfile ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="border-t border-[#1F2023] pt-8">
        <h2 className="mb-1 text-lg font-medium text-white">Mot de passe</h2>
        <p className="mb-6 text-sm text-gray-400">Modifiez votre mot de passe.</p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Field label="Mot de passe actuel">
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            className="rounded-md border border-[#26282C] px-4 py-2 text-sm text-white transition-colors hover:border-[#00D492]"
          >
            {savedPassword ? "Mot de passe modifié ✓" : "Mettre à jour"}
          </button>
        </form>
      </div>
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