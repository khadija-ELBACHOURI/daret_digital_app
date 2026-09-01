"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"ADMIN" | "MEMBRE">;
  children: React.ReactNode;
}) {
  const { token, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (role && !allowedRoles.includes(role)) {
      router.replace(role === "ADMIN" ? "/admin/dashboard" : "/membre/dashboard");
    }
  }, [isLoading, token, role, allowedRoles, router]);

  if (isLoading || !token || (role && !allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F2A35]">
        <p className="text-sm text-[#F2E8D5]/70">Verification en cours...</p>
      </div>
    );
  }

  return <>{children}</>;
}
