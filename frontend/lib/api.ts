const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
 
// ---------- Payments ----------
 
export type PaymentStatus = "PENDING" | "PAID" | "VALIDATED" | "LATE";
 
export interface PaymentResponse {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  cycle: number;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
}
 
export async function getPaymentsForCycle(
  groupId: string,
  cycle: number
): Promise<PaymentResponse[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payments?cycle=${cycle}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PaymentResponse[]>(res);
}
 
// Manual declaration (cash / transfer). Rejected by the backend when
// payments.manual-declaration-enabled=false.
export async function declareMyPayment(
  groupId: string,
  proofUrl?: string
): Promise<PaymentResponse> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payments/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ proofUrl: proofUrl ?? null }),
  });
  return handleResponse<PaymentResponse>(res);
}
 
// Starts a Stripe Checkout session and returns the hosted page URL.
export async function createCheckout(groupId: string): Promise<{ url: string }> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payments/me/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ url: string }>(res);
}
 
export async function validatePayment(
  groupId: string,
  paymentId: string
): Promise<PaymentResponse> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payments/${paymentId}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PaymentResponse>(res);
}
 
export interface GroupTurnState {
  id: string;
  tourActuel: number;
  statut: DaretStatus;
}
 
export async function closeTurn(groupId: string): Promise<GroupTurnState> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payments/turn/close`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<GroupTurnState>(res);
}
 
export async function generatePayments(groupId: string): Promise<PaymentResponse[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payments/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PaymentResponse[]>(res);
}
 
// ---------- Payouts ----------
 
export type PayoutStatus = "EN_ATTENTE" | "VERSE";
 
export interface PayoutResponse {
  id: string;
  groupId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  cycle: number;
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
}
 
export async function getCurrentPayout(groupId: string): Promise<PayoutResponse> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payouts/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PayoutResponse>(res);
}
 
export async function confirmCurrentPayout(groupId: string): Promise<PayoutResponse> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payouts/current/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PayoutResponse>(res);
}
 
export async function getPayoutHistory(groupId: string): Promise<PayoutResponse[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/groups/${groupId}/payouts/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PayoutResponse[]>(res);
}
 