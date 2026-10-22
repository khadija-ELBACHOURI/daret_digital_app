"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, changeMyPassword } from "@/lib/api";

const inputClass =
  "w-full rounded-md border border-[#26282C] bg-[#101113] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D492] disabled:opacity-50";

const emptyProfile = { firstname: "", lastname: "", email: "", phone: "", iban: "" };

export default function ProfilPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [savingPassword, setSavingPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((u) =>
        setProfile({
          firstname: u.firstname ?? "",
          lastname: u.lastname ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          iban: u.iban ?? "",
        })
      )
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const u = await updateMyProfile(profile);
      setProfile({
        firstname: u.firstname ?? "",
        lastname: u.lastname ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        iban: u.iban ?? "",
      });
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (passwords.next.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setSavedPassword(true);
      setTimeout(() => setSavedPassword(false), 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erreur lors de la modification.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Chargement...</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-400">{loadError}</p>;
  }

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-white">Profil</h1>
        <p className="mb-6 text-sm text-gray-400">Vos informations personnelles.</p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom">
              <input
                value={profile.firstname}
                onChange={(e) => setProfile((p) => ({ ...p, firstname: e.target.value }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Nom">
              <input
                value={profile.lastname}
                onChange={(e) => setProfile((p) => ({ ...p, lastname: e.target.value }))}
                className={inputClass}
                required
              />
            </Field>
          </div>
          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              className={inputClass}
              disabled
            />
          </Field>
          <Field label="Téléphone">
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="IBAN (pour recevoir vos tours)">
            <input
              value={profile.iban}
              onChange={(e) => setProfile((p) => ({ ...p, iban: e.target.value }))}
              className={inputClass}
            />
          </Field>

          {profileError && <p className="text-sm text-red-400">{profileError}</p>}

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
          >
            {savingProfile ? "Enregistrement..." : savedProfile ? "Enregistré ✓" : "Enregistrer"}
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
              required
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className={inputClass}
              required
            />
          </Field>

          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-md border border-[#26282C] px-4 py-2 text-sm text-white transition-colors hover:border-[#00D492] disabled:opacity-50"
          >
            {savingPassword
              ? "Mise à jour..."
              : savedPassword
                ? "Mot de passe modifié ✓"
                : "Mettre à jour"}
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