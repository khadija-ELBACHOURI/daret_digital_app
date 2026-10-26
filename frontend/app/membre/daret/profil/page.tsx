"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getMyProfile, updateMyProfile, changeMyPassword } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import { formatIban, ibanProblem, normalizeIban } from "@/lib/iban";
import {
  btnPrimary,
  btnSecondary,
  card,
  errorBox,
  inputClass,
  labelClass,
  pageTitle,
  sectionTitle,
  subtle,
} from "@/components/ui";

const emptyProfile = { firstname: "", lastname: "", email: "", phone: "", iban: "" };

export default function ProfilPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [ibanTouched, setIbanTouched] = useState(false);

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
          iban: formatIban(u.iban ?? ""),
        })
      )
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const ibanMessage = ibanProblem(profile.iban);
  const ibanFilled = normalizeIban(profile.iban) !== "";
  const showIbanError = ibanTouched && ibanMessage !== null;

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);

    if (ibanMessage) {
      setIbanTouched(true);
      return;
    }

    setSavingProfile(true);
    try {
      const u = await updateMyProfile({ ...profile, iban: normalizeIban(profile.iban) });
      setProfile({
        firstname: u.firstname ?? "",
        lastname: u.lastname ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        iban: formatIban(u.iban ?? ""),
      });
      setIbanTouched(false);
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
    return <p className={`text-sm ${subtle}`}>Chargement...</p>;
  }

  if (loadError) {
    return <p className={errorBox}>{loadError}</p>;
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className={`${pageTitle} mb-1`}>Profil</h1>
        <p className={`mb-6 text-sm ${subtle}`}>Vos informations personnelles.</p>

        <form onSubmit={handleProfileSubmit} className={`${card} space-y-4 p-6`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <input type="email" value={profile.email} className={inputClass} disabled />
          </Field>
          <Field label="Téléphone">
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="IBAN (pour recevoir vos tours)">
            <div className="relative">
              <input
                value={profile.iban}
                onChange={(e) => setProfile((p) => ({ ...p, iban: formatIban(e.target.value) }))}
                onBlur={() => setIbanTouched(true)}
                maxLength={42}
                autoComplete="off"
                spellCheck={false}
                placeholder="MA00 0000 0000 0000 0000 0000 0000"
                aria-invalid={showIbanError}
                aria-describedby={showIbanError ? "iban-error" : undefined}
                className={`${inputClass} pr-11 font-mono tracking-wide ${showIbanError ? "!border-[#D9483B]" : ""}`}
              />
              {ibanFilled && ibanMessage === null && (
                <CheckCircle2
                  className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1FB89F]"
                  aria-hidden="true"
                />
              )}
            </div>
            {showIbanError && (
              <span id="iban-error" role="alert" className="mt-1.5 block text-sm text-[#B3261E]">
                {ibanMessage}
              </span>
            )}
          </Field>

          {profileError && <p role="alert" className={errorBox}>{profileError}</p>}

          <button type="submit" disabled={savingProfile} className={btnPrimary}>
            {savingProfile ? "Enregistrement..." : savedProfile ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </form>
      </div>

      <div>
        <h2 className={`${sectionTitle} mb-1`}>Mot de passe</h2>
        <p className={`mb-4 text-sm ${subtle}`}>Modifiez votre mot de passe.</p>

        <form onSubmit={handlePasswordSubmit} className={`${card} space-y-4 p-6`}>
          <div>
            <label htmlFor="pwd-current" className={labelClass}>
              Mot de passe actuel
            </label>
            <PasswordInput
              id="pwd-current"
              value={passwords.current}
              onChange={(v) => setPasswords((p) => ({ ...p, current: v }))}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="pwd-next" className={labelClass}>
              Nouveau mot de passe
            </label>
            <PasswordInput
              id="pwd-next"
              value={passwords.next}
              onChange={(v) => setPasswords((p) => ({ ...p, next: v }))}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
            />
          </div>
          <div>
            <label htmlFor="pwd-confirm" className={labelClass}>
              Confirmer le nouveau mot de passe
            </label>
            <PasswordInput
              id="pwd-confirm"
              value={passwords.confirm}
              onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
              autoComplete="new-password"
            />
          </div>

          {passwordError && <p role="alert" className={errorBox}>{passwordError}</p>}

          <button type="submit" disabled={savingPassword} className={btnSecondary}>
            {savingPassword ? "Mise à jour..." : savedPassword ? "Mot de passe modifié ✓" : "Mettre à jour"}
          </button>
        </form>
      </div>
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