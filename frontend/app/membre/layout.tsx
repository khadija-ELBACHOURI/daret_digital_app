import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function MembreLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#0A0B0D]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}