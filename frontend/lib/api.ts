const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AuthResponse {
  token: string;
  role: "ADMIN" | "MEMBRE";
}

export interface ApiError {
  message: string;
}

async function handleResponse(res: Response): Promise<AuthResponse> {
  if (!res.ok) {
    let message = "Une erreur est survenue. Reessayez.";
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {
      if (res.status === 401 || res.status === 403) {
        message = "Email ou mot de passe incorrect.";
      }
    }
    throw new Error(message);
  }
  return res.json();
}

export async function registerUser(payload: {
  nom: string;
  email: string;
  motDePasse: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function loginUser(payload: {
  email: string;
  motDePasse: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}


if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL n'est pas défini — vérifie ton .env.local");
}

export async function createDaret(payload: {
  nom: string;
  montant: number;
  frequence: string;
  nombreMembres: number;
  dateDebut: string;
  description?: string;
}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Erreur lors de la création de la daret");
  }

  return res.json();
}
