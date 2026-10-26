import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";

// app/membre/layout.tsx
// One shared content width for every member page: centered, up to 6xl, so wide screens do not leave
// an empty strip on the right. Narrow pages (forms) keep their own max-width inside it.
export default function MembreLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#F4F6FB]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}