import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { CheckCircle2, LogOut } from "lucide-react-native";
import { getMyProfile, updateMyProfile, changeMyPassword } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";
import { formatIban, ibanProblem, normalizeIban } from "@/lib/iban";
import { Button, Card, ErrorBox, Field, Input, Screen } from "@/components/Ui";
import { colors, type } from "@/lib/theme";

const emptyProfile = { firstname: "", lastname: "", email: "", phone: "", iban: "" };

export default function ProfilPage() {
  const { logout } = useAuth();
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

  async function handleProfileSubmit() {
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

  async function handlePasswordSubmit() {
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
    return (
      <Screen>
        <Text style={type.small}>Chargement...</Text>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <ErrorBox message={loadError} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[type.pageTitle, { marginBottom: 4 }]}>Profil</Text>
      <Text style={[type.small, { marginBottom: 24 }]}>Vos informations personnelles.</Text>

      <Card style={{ padding: 20, gap: 16, marginBottom: 32 }}>
        <Field label="Prénom">
          <Input value={profile.firstname} onChangeText={(v) => setProfile((p) => ({ ...p, firstname: v }))} />
        </Field>
        <Field label="Nom">
          <Input value={profile.lastname} onChangeText={(v) => setProfile((p) => ({ ...p, lastname: v }))} />
        </Field>
        <Field label="Email">
          <Input value={profile.email} editable={false} />
        </Field>
        <Field label="Téléphone">
          <Input
            value={profile.phone}
            onChangeText={(v) => setProfile((p) => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
          />
        </Field>
        <Field label="IBAN (pour recevoir vos tours)">
          <View>
            <Input
              mono
              value={profile.iban}
              onChangeText={(v) => setProfile((p) => ({ ...p, iban: formatIban(v) }))}
              onBlur={() => setIbanTouched(true)}
              maxLength={42}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="MA00 0000 0000 0000 0000 0000 0000"
              style={[{ paddingRight: 44 }, showIbanError && { borderColor: colors.danger }]}
            />
            {ibanFilled && ibanMessage === null && (
              <View style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}>
                <CheckCircle2 size={20} color="#1FB89F" />
              </View>
            )}
          </View>
          {showIbanError && <Text style={[type.errorText, { marginTop: 6 }]}>{ibanMessage}</Text>}
        </Field>

        {profileError && <ErrorBox message={profileError} />}

        <Button
          title={savingProfile ? "Enregistrement..." : savedProfile ? "Enregistré ✓" : "Enregistrer"}
          onPress={handleProfileSubmit}
          disabled={savingProfile}
        />
      </Card>

      <Text style={[type.sectionTitle, { marginBottom: 4 }]}>Mot de passe</Text>
      <Text style={[type.small, { marginBottom: 16 }]}>Modifiez votre mot de passe.</Text>

      <Card style={{ padding: 20, gap: 16, marginBottom: 32 }}>
        <Field label="Mot de passe actuel">
          <PasswordInput
            value={passwords.current}
            onChange={(v) => setPasswords((p) => ({ ...p, current: v }))}
            autoComplete="current-password"
          />
        </Field>
        <Field label="Nouveau mot de passe">
          <PasswordInput
            value={passwords.next}
            onChange={(v) => setPasswords((p) => ({ ...p, next: v }))}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
          />
        </Field>
        <Field label="Confirmer le nouveau mot de passe">
          <PasswordInput
            value={passwords.confirm}
            onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
            autoComplete="new-password"
          />
        </Field>

        {passwordError && <ErrorBox message={passwordError} />}

        <Button
          title={savingPassword ? "Mise à jour..." : savedPassword ? "Mot de passe modifié ✓" : "Mettre à jour"}
          onPress={handlePasswordSubmit}
          disabled={savingPassword}
          variant="secondary"
        />
      </Card>

      <Button
        title="Se déconnecter"
        onPress={logout}
        variant="dangerOutline"
        icon={<LogOut size={16} color={colors.dangerDark} />}
        full
      />
    </Screen>
  );
}
