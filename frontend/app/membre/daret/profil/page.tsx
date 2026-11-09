"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2, Landmark, Lock, ShieldCheck, Phone } from "lucide-react";
import { getMyProfile, updateMyProfile, changeMyPassword } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import { formatIban, ibanProblem, normalizeIban } from "@/lib/iban";
import {
  btnPrimary,
  btnSecondary,
  card,
  display,
  errorBox,
  inputClass,
  labelClass,
  pageTitle,
  sectionTitle,
  subtle,
} from "@/components/ui";

const emptyProfile = { firstname: "", lastname: "", email: "", phone: "", iban: "" };
type Profile = typeof emptyProfile;

function toProfile(u: Partial<Record<keyof Profile, string | null>>): Profile {
  return {
    firstname: u.firstname ?? "",
    lastname: u.lastname ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    iban: formatIban(u.iban ?? ""),
  };
}

// 0 to 4
function passwordScore(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score++;
  return score;
}

const STRENGTH_LABELS = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];
const STRENGTH_COLORS = ["#D9483B", "#D9483B", "#FFB81C", "#1FB89F", "#0B7A69"];

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [savedSnapshot, setSavedSnapshot] = useState<Profile>(emptyProfile);
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
      .then((u) => {
        const p = toProfile(u);
        setProfile(p);
        setSavedSnapshot(p);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const ibanMessage = ibanProblem(profile.iban);
  const ibanFilled = normalizeIban(profile.iban) !== "";
  const showIbanError = ibanTouched && ibanMessage !== null;

  const dirty = JSON.stringify(profile) !== JSON.stringify(savedSnapshot);

  // Completion: name, phone and a valid IBAN
  const checklist = [
    { label: "Nom complet", done: !!profile.firstname.trim() && !!profile.lastname.trim() },
    { label: "Téléphone", done: !!profile.phone.trim() },
    { label: "IBAN", done: ibanFilled && ibanMessage === null },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const completion = Math.round((doneCount / checklist.length) * 100);

  const initials = `${profile.firstname[0] ?? ""}${profile.lastname[0] ?? ""}`.toUpperCase() || "?";

  const score = passwordScore(passwords.next);

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
      const p = toProfile(u);
      setProfile(p);
      setSavedSnapshot(p);
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

        {/* Identity header with completion */}
        <div className={`${card} mb-4 p-5`}>
          <div className="flex items-center gap-4">
            <div
              className={`${display} flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1B2A9B] text-xl font-extrabold text-white`}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className={`${display} truncate text-lg font-bold text-[#0E1442]`}>
                {profile.firstname} {profile.lastname}
              </p>
              <p className={`truncate text-sm ${subtle}`}>{profile.email}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[#0E1442]">Profil complété à {completion}%</span>
              <span className={subtle}>
                {doneCount}/{checklist.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E6E9FB]">
              <div
                className="h-full rounded-full bg-[#1FB89F] transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {checklist.map((c) => (
                <li
                  key={c.label}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    c.done ? "bg-[#DDF7F2] text-[#0B7A69]" : "bg-[#FFF3D1] text-[#8A5A00]"
                  }`}
                >
                  {c.done && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  {c.label}
                </li>
              ))}
            </ul>
            {!checklist[2].done && (
              <p className={`mt-3 text-xs ${subtle}`}>
                Ajoutez votre IBAN pour que l&apos;organisateur puisse vous verser votre tour.
              </p>
            )}
          </div>
        </div>

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
            <span className={`mt-1.5 block text-xs ${subtle}`}>L&apos;email ne peut pas être modifié.</span>
          </Field>
          <Field label="Téléphone" icon={<Phone className="h-3.5 w-3.5" />}>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="06 00 00 00 00"
              className={inputClass}
            />
          </Field>
          <Field label="IBAN (pour recevoir vos tours)" icon={<Landmark className="h-3.5 w-3.5" />}>
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

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={savingProfile || !dirty} className={btnPrimary}>
              {savingProfile ? "Enregistrement..." : savedProfile ? "Enregistré ✓" : "Enregistrer"}
            </button>
            {dirty && !savingProfile && <span className="text-xs text-[#8A5A00]">Modifications non enregistrées</span>}
          </div>
        </form>
      </div>

      <div>
        <h2 className={`${sectionTitle} mb-1 flex items-center gap-2`}>
          <Lock className="h-4 w-4 text-[#1B2A9B]" aria-hidden="true" />
          Mot de passe
        </h2>
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
            {passwords.next && (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i <= score ? STRENGTH_COLORS[score] : "#E6E9FB" }}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-xs ${subtle}`}>Sécurité : {STRENGTH_LABELS[score]}</p>
              </div>
            )}
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
            {passwords.confirm && passwords.next === passwords.confirm && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0B7A69]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Les mots de passe correspondent
              </p>
            )}
          </div>

          {passwordError && <p role="alert" className={errorBox}>{passwordError}</p>}

          <button type="submit" disabled={savingPassword} className={btnSecondary}>
            {savingPassword ? "Mise à jour..." : savedPassword ? "Mot de passe modifié ✓" : "Mettre à jour"}
          </button>
        </form>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#DDF7F2] p-4 text-sm text-[#0B7A69]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>Votre IBAN n&apos;est visible que par l&apos;organisateur de vos daret, pour organiser les versements.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`${labelClass} flex items-center gap-1.5`}>
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}