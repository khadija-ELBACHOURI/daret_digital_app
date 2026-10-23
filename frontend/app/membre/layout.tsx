import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";

// app/membre/layout.tsx
export default function MembreLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#F4F6FB]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-10 sm:py-10">{children}</main>
      </div>
    </AuthGuard>
  );
}