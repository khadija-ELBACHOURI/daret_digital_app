"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { btnSecondary, card, pageTitle, subtle } from "@/components/ui";

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F6FB] p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Espace organisateur</h1>
          <button onClick={logout} className={btnSecondary}>
            Se déconnecter
          </button>
        </div>
        <div className={`${card} mt-6 p-6`}>
          <p className={`text-sm ${subtle}`}>
            Ici viendront la création de groupes, la gestion des membres et la validation des paiements.
          </p>
        </div>
      </div>
    </div>
  );
}