"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, AuthResponse } from "./api";

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

function persist(auth: AuthResponse) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function readPersisted(): AuthResponse | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
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
    const saved = readPersisted();
    if (saved) {
      setToken(saved.token);
      setUserId(saved.userId);
      setEmail(saved.email);
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, motDePasse: string) {
    const auth = await loginUser({ email, motDePasse });
    persist(auth);
    setToken(auth.token);
    setUserId(auth.userId);
    setEmail(auth.email);
    router.push("/membre/daret"); // page unique : liste des darets de l'utilisateur
  }

  async function register(nom: string, email: string, motDePasse: string) {
    const auth = await registerUser({ nom, email, motDePasse });
    persist(auth);
    setToken(auth.token);
    setUserId(auth.userId);
    setEmail(auth.email);
    router.push("/membre/daret");
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUserId(null);
    setEmail(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ token, userId, email, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}