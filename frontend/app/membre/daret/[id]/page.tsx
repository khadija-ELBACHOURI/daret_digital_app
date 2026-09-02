import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Wallet, Calendar, Users } from "lucide-react";
import { mockDarets } from "@/lib/mock-data";

export default function DaretDetailPage({ params }: { params: { id: string } }) {
  const daret = mockDarets.find((d) => d.id === params.id);
  if (!daret) notFound();

  return (
    <div className="max-w-4xl">
      <div id="apercu" className="mb-6">
        <h1 className="text-2xl font-semibold text-white">{daret.name}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {daret.members.length} membres · tour {daret.currentTurn} sur {daret.totalTurns}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard icon={<Wallet className="h-4 w-4" />} label="Montant / tour" value={`${daret.amount.toLocaleString("fr-FR")} MAD`} />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="Prochain paiement"
          value={new Date(daret.nextPaymentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
        />
        <InfoCard icon={<Users className="h-4 w-4" />} label="Ma position" value={`#${daret.myPosition}`} />
      </div>

      <div id="membres" className="mb-8 scroll-mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Ordre de passage</h2>
        <div className="rounded-lg border border-[#1F2023] bg-[#101113]">
          {daret.members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i !== daret.members.length - 1 ? "border-b border-[#1F2023]" : ""
              } ${m.turnOrder === daret.currentTurn ? "bg-[#0F1A15]" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F2023] text-xs text-gray-300">
                  {m.turnOrder}
                </div>
                <span className={m.isCurrentUser ? "font-medium text-white" : "text-gray-300"}>
                  {m.name} {m.isCurrentUser && <span className="text-xs text-gray-500">(vous)</span>}
                </span>
                {m.turnOrder === daret.currentTurn && (
                  <span className="rounded-full bg-[#16241D] px-2 py-0.5 text-xs text-[#00D492]">Tour actuel</span>
                )}
              </div>
              <span className={`text-xs ${m.hasPaid ? "text-[#00D492]" : "text-gray-500"}`}>
                {m.hasPaid ? "Payé" : "En attente"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div id="paiements" className="mb-8 scroll-mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Paiements du tour {daret.currentTurn}</h2>
        <div className="rounded-lg border border-[#1F2023] bg-[#101113]">
          {daret.members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i !== daret.members.length - 1 ? "border-b border-[#1F2023]" : ""
              }`}
            >
              <span className="text-gray-300">{m.name}</span>
              <span className={`text-xs ${m.hasPaid ? "text-[#00D492]" : "text-gray-500"}`}>
                {m.hasPaid ? `${daret.amount.toLocaleString("fr-FR")} MAD reçu` : "En attente"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div id="calendrier" className="scroll-mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Calendrier des tours</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: daret.totalTurns }).map((_, i) => {
            const turn = i + 1;
            const isPast = turn < daret.currentTurn;
            const isCurrent = turn === daret.currentTurn;
            return (
              <div
                key={turn}
                className={`rounded-md border px-3 py-2 text-xs ${
                  isCurrent
                    ? "border-[#00D492] bg-[#0F1A15] text-[#00D492]"
                    : isPast
                    ? "border-[#1F2023] bg-[#101113] text-gray-500"
                    : "border-[#1F2023] bg-[#0A0B0D] text-gray-400"
                }`}
              >
                Tour {turn}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1F2023] bg-[#101113] p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}