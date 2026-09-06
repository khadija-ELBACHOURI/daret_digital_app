const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const STORAGE_KEY = "daret_auth";

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export type DaretStatus = "EN_ATTENTE" | "ACTIVE" | "TERMINEE";

export interface DaretGroup {
  id: string;
  nom: string;
  montant: number;
  frequence: string;
  nombreMembres: number;
  dateDebut: string;
  description?: string;
  statut: DaretStatus;
  tourActuel: number;
}
export interface ApiError {
  message: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Une erreur est survenue. Reessayez.";
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {
      if (res.status === 401) {
        message = "Session expiree, veuillez vous reconnecter.";
      } else if (res.status === 403) {
        message = "Acces refuse pour cette action.";
      }
    }
    throw new Error(message);
  }
  return res.json();
}

function getToken(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    return parsed.token ?? null;
  } catch {
    return null;
  }
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
  return handleResponse<AuthResponse>(res);
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
  return handleResponse<AuthResponse>(res);
}

export async function createDaret(payload: {
  nom: string;
  montant: number;
  frequence: string;
  nombreMembres: number;
  dateDebut: string;
  description?: string;
}): Promise<DaretGroup> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<DaretGroup>(res);
}

export async function getGroup(groupId: string): Promise<DaretGroup> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<DaretGroup>(res);
}

export interface MyGroupResponse {
  id: string;
  nom: string;
  montant: number;
  frequence: string;
  nombreMembres: number;
  dateDebut: string;
  statut: "EN_ATTENTE" | "ACTIVE" | "TERMINEE";
  tourActuel: number;
  position: number | null;
  role: "ORGANISATEUR" | "MEMBRE";
}

export async function getMyGroups(): Promise<MyGroupResponse[]> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/groups/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse<MyGroupResponse[]>(res);
}

export interface MemberResponse {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "ORGANISATEUR" | "MEMBRE";
  position: number | null;
}

export async function getGroupMembers(groupId: string): Promise<MemberResponse[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<MemberResponse[]>(res);
}

export async function addMember(groupId: string, email: string): Promise<void> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Erreur lors de l'ajout du membre");
  }
}

export async function assignPosition(
  groupId: string,
  userId: string,
  position: number
): Promise<MemberResponse> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/groups/${groupId}/members/${userId}/position`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ position }),
  });

  return handleResponse<MemberResponse>(res);
}

export async function updateGroupStatus(
  groupId: string,
  statut: DaretStatus
): Promise<DaretGroup> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/groups/${groupId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ statut }),
  });

  return handleResponse<DaretGroup>(res);
}
