"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F2A35]">
        <p className="text-sm text-[#F2E8D5]/70">Verification en cours...</p>
      </div>
    );
  }

  return <>{children}</>;
}