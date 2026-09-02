import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Wallet, Calendar, TrendingUp } from "lucide-react";
import { mockDarets, mockActivity, mockUser } from "@/lib/mock-data";

export default function DashboardPage() {
  const activeDarets = mockDarets.filter((d) => d.status === "active");
  const nextPayment = [...activeDarets].sort(
    (a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
  )[0];
  const totalCotise = activeDarets.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Bonjour, {mockUser.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-400">Voici un résumé de vos daret en cours.</p>
        </div>
        <Link
          href="/membre/daret/creer"
          className="flex items-center gap-2 rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184]"
        >
          <Plus className="h-4 w-4" />
          Nouvelle daret
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Daret actives" value={String(activeDarets.length)} />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Prochain paiement"
          value={
            nextPayment
              ? new Date(nextPayment.nextPaymentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
              : "—"
          }
          hint={nextPayment?.name}
        />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Total cotisé / mois" value={`${totalCotise.toLocaleString("fr-FR")} MAD`} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Mes daret actives</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeDarets.map((d) => (
            <Link
              key={d.id}
              href={`/membre/daret/${d.id}`}
              className="rounded-lg border border-[#1F2023] bg-[#101113] p-4 transition-colors hover:border-[#26282C]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-white">{d.name}</span>
                <span className="rounded-full bg-[#16241D] px-2 py-0.5 text-xs text-[#00D492]">
                  Tour {d.currentTurn}/{d.totalTurns}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {d.amount.toLocaleString("fr-FR")} MAD · {d.frequency} · position #{d.myPosition}
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-[#1F2023]">
                <div className="h-1.5 rounded-full bg-[#00D492]" style={{ width: `${(d.currentTurn / d.totalTurns) * 100}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Activité récente</h2>
        <div className="rounded-lg border border-[#1F2023] bg-[#101113]">
          {mockActivity.map((a, i) => (
            <div
              key={a.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i !== mockActivity.length - 1 ? "border-b border-[#1F2023]" : ""
              }`}
            >
              <span className="text-gray-300">{a.label}</span>
              <span className="text-gray-500">{new Date(a.date).toLocaleDateString("fr-FR")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-[#1F2023] bg-[#101113] p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}