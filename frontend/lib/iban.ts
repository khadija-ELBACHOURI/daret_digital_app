// IBAN helpers. The checks run silently: nothing is shown until the field is left or the form is sent.

const LENGTHS: Record<string, number> = {
  MA: 28,
  FR: 27,
  BE: 16,
  ES: 24,
  DE: 22,
  IT: 27,
  NL: 18,
  PT: 25,
  GB: 22,
  CH: 21,
  LU: 20,
  TN: 24,
  DZ: 26,
};

/** Uppercase, letters and digits only: "ma64 0011-..." -> "MA640011..." */
export function normalizeIban(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Groups of 4 for display: "MA64 0011 0000 ..." */
export function formatIban(raw: string): string {
  return normalizeIban(raw)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const value = code >= 65 ? code - 55 : code - 48; // A=10 ... Z=35, digits as is
    remainder = value < 10 ? (remainder * 10 + value) % 97 : (remainder * 100 + value) % 97;
  }
  return remainder;
}

/** null when the field is empty or valid, otherwise a short message for the user. */
export function ibanProblem(raw: string): string | null {
  const iban = normalizeIban(raw);
  if (iban === "") return null;

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) {
    return "Format invalide : 2 lettres pour le pays, 2 chiffres, puis le numéro de compte.";
  }

  const expected = LENGTHS[iban.slice(0, 2)];
  if (expected && iban.length !== expected) {
    const diff = Math.abs(expected - iban.length);
    const plural = diff > 1 ? "s" : "";
    return iban.length < expected
      ? `Il manque ${diff} caractère${plural} (${expected} attendus pour ce pays).`
      : `Il y a ${diff} caractère${plural} en trop (${expected} attendus pour ce pays).`;
  }

  if (mod97(iban) !== 1) {
    return "Numéro invalide : vérifiez qu'il n'y a pas de faute de frappe.";
  }

  return null;
}

export function isValidIban(raw: string): boolean {
  return normalizeIban(raw) !== "" && ibanProblem(raw) === null;
}