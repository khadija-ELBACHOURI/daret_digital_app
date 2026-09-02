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

type Role = "ADMIN" | "MEMBRE";

interface AuthContextValue {
  token: string | null;
  role: Role | null;
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

function roleHome(role: Role) {
  return role === "ADMIN" ? "/admin/dashboard" : "/membre/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = readPersisted();
    if (saved) {
      setToken(saved.token);
      setRole(saved.role);
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, motDePasse: string) {
    const auth = await loginUser({ email, motDePasse });
    persist(auth);
    setToken(auth.token);
    setRole(auth.role);
    router.push(roleHome(auth.role));
  }

  async function register(nom: string, email: string, motDePasse: string) {
    const auth = await registerUser({ nom, email, motDePasse });
    persist(auth);
    setToken(auth.token);
    setRole(auth.role);
    router.push(roleHome(auth.role));
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setRole(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ token, role, isLoading, login, register, logout }}
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
