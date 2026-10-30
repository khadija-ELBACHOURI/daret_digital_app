import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { loginUser, registerUser, setAuthToken, AuthResponse } from "./api";

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  register: (nom: string, email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "daret_auth";

async function persist(auth: AuthResponse) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(auth));
}

async function readPersisted(): Promise<AuthResponse | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    readPersisted().then((saved) => {
      if (saved) {
        setAuthToken(saved.token);
        setToken(saved.token);
        setUserId(saved.userId);
        setEmail(saved.email);
      }
      setIsLoading(false);
    });
  }, []);

  async function applyAuth(auth: AuthResponse) {
    await persist(auth);
    setAuthToken(auth.token);
    setToken(auth.token);
    setUserId(auth.userId);
    setEmail(auth.email);
    router.replace("/dashboard");
  }

  async function login(email: string, motDePasse: string) {
    const auth = await loginUser({ email, motDePasse });
    await applyAuth(auth);
  }

  async function register(nom: string, email: string, motDePasse: string) {
    const auth = await registerUser({ nom, email, motDePasse });
    await applyAuth(auth);
  }

  function logout() {
    SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
    setAuthToken(null);
    setToken(null);
    setUserId(null);
    setEmail(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ token, userId, email, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
