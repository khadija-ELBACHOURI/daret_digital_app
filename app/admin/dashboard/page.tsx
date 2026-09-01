"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F2A35] p-8 text-[#F2E8D5]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl">Espace organisateur</h1>
          <button
            onClick={logout}
            className="rounded-md border border-[#F2E8D5]/20 px-4 py-2 text-sm hover:bg-[#F2E8D5]/10"
          >
            Se deconnecter
          </button>
        </div>
        <p className="mt-4 text-sm text-[#F2E8D5]/60">
          Connecte en tant qu&apos;ADMIN. Ici viendront la creation de groupes,
          la gestion des membres et la validation des paiements.
        </p>
      </div>
    </div>
  );
}
