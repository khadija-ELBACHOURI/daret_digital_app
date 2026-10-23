"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Layers, Plus, UserPlus, Wallet } from "lucide-react";
import {
  getMyGroups,
  getMyProfile,
  getPaymentsForCycle,
  type MyGroupResponse,
  type PaymentResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  badge,
  btnPrimary,
  btnPrimarySm,
  btnSecondary,
  card,
  display,
  errorBox,
  pageTitle,
  sectionTitle,
  statusStyles,
  subtle,
} from "@/components/ui";

interface DueItem {
  group: MyGroupResponse;
  payment: PaymentResponse;
}

const money = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

export default function DashboardPage() {
  const { userId } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [groups, setGroups] = useState<MyGroupResponse[]>([]);
  const [due, setDue] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      try {
        const [profile, myGroups] = await Promise.all([getMyProfile().catch(() => null), getMyGroups()]);
        if (cancelled) return;
        setFirstname(profile?.firstname ?? "");
        setGroups(myGroups);

        // For each active daret, check whether my contribution for the current turn is still unpaid.
        const active = myGroups.filter((g) => g.statut === "ACTIVE");
        const checks = await Promise.all(
          active.map(async (g): Promise<DueItem | null> => {
            try {
              const payments = await getPaymentsForCycle(g.id, g.tourActuel);
              const mine = payments.find((p) => p.memberId === userId);
              if (mine && (mine.status === "PENDING" || mine.status === "LATE")) {
                return { group: g, payment: mine };
              }
            } catch {
              // a daret whose payments cannot be read is simply not listed as due
            }
            return null;
          })
        );
        if (!cancelled) setDue(checks.filter((c): c is DueItem => c !== null));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible de charger vos darets.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const active = groups.filter((g) => g.statut === "ACTIVE");
  const preparing = groups.filter((g) => g.statut === "EN_ATTENTE");
  const totalDue = due.reduce((sum, d) => sum + d.payment.amount, 0);
  const perTurn = active.reduce((sum, g) => sum + g.montant, 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Bonjour{firstname ? `, ${firstname}` : ""}</h1>
          <p className={`mt-1 text-sm ${subtle}`}>Voici où en sont vos darets.</p>
        </div>
        <Link href="/membre/daret/creer" className={btnPrimary}>
          <Plus className="h-4 w-4" />
          Nouvelle daret
        </Link>
      </div>

      {error && <p className={`mb-6 ${errorBox}`}>{error}</p>}
      {loading && !error && <p className={`text-sm ${subtle}`}>Chargement...</p>}

      {!loading && !error && groups.length === 0 && (
        <div className={`${card} p-8 text-center`}>
          <h2 className={`${sectionTitle} mb-2`}>Vous n&apos;avez pas encore de daret</h2>
          <p className={`mx-auto mb-6 max-w-sm text-sm ${subtle}`}>
            Créez un groupe pour vos proches, ou rejoignez-en un avec le code d&apos;invitation de l&apos;organisateur.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/membre/daret/creer" className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Créer une daret
            </Link>
            <Link href="/membre/daret/join" className={btnSecondary}>
              <UserPlus className="h-4 w-4" />
              Rejoindre
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Layers className="h-4 w-4" />}
              label="Darets actives"
              value={String(active.length)}
              hint={`${groups.length} au total`}
            />
            <StatCard
              icon={<Wallet className="h-4 w-4" />}
              label="À régler ce tour"
              value={due.length > 0 ? money(totalDue) : "Rien à payer"}
              hint={
                due.length > 0
                  ? `${due.length} cotisation${due.length > 1 ? "s" : ""} en attente`
                  : "Vos cotisations sont à jour"
              }
              highlight={due.length > 0}
            />
            <StatCard
              icon={<Coins className="h-4 w-4" />}
              label="Engagé par tour"
              value={money(perTurn)}
              hint="Somme de vos darets actives"
            />
          </div>

          {due.length > 0 && (
            <section className="mb-8">
              <h2 className={`${sectionTitle} mb-3`}>À régler</h2>
              <div className={`${card} divide-y divide-[#E3E7F3]`}>
                {due.map(({ group, payment }) => (
                  <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-semibold text-[#0E1442]">{group.nom}</p>
                      <p className={`text-sm ${subtle}`}>
                        Tour {Math.min(group.tourActuel + 1, group.nombreMembres)}/{group.nombreMembres} ·{" "}
                        {money(payment.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`${badge} ${
                          payment.status === "LATE"
                            ? "bg-[#FDECEA] text-[#B3261E]"
                            : statusStyles.EN_ATTENTE.className
                        }`}
                      >
                        {payment.status === "LATE" ? "En retard" : "À payer"}
                      </span>
                      <Link href={`/membre/daret/${group.id}#paiements`} className={btnPrimarySm}>
                        Payer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section className="mb-8">
              <h2 className={`${sectionTitle} mb-3`}>Mes darets actives</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {active.map((g) => {
                  const turn = Math.min(g.tourActuel + 1, g.nombreMembres);
                  const myTurn = g.position != null && g.position === g.tourActuel + 1;
                  return (
                    <Link
                      key={g.id}
                      href={`/membre/daret/${g.id}`}
                      className={`${card} block p-5 transition-colors hover:border-[#1B2A9B]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <span className={`${display} text-lg font-bold text-[#0E1442]`}>{g.nom}</span>
                        <span className={`${badge} shrink-0 ${statusStyles.ACTIVE.className}`}>
                          Tour {turn}/{g.nombreMembres}
                        </span>
                      </div>
                      <p className={`text-sm capitalize ${subtle}`}>
                        {money(g.montant)} · {g.frequence.toLowerCase()}
                      </p>

                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#E8EAF4]">
                        <div
                          className="h-2 rounded-full bg-[#1B2A9B]"
                          style={{ width: `${(g.tourActuel / g.nombreMembres) * 100}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className={subtle}>
                          {g.position != null ? `Ma position : #${g.position}` : "Position non attribuée"}
                        </span>
                        {myTurn && <span className={`${badge} bg-[#FFF3D1] text-[#8A5A00]`}>C&apos;est votre tour</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {preparing.length > 0 && (
            <section>
              <h2 className={`${sectionTitle} mb-3`}>En préparation</h2>
              <div className={`${card} divide-y divide-[#E3E7F3]`}>
                {preparing.map((g) => (
                  <Link
                    key={g.id}
                    href={`/membre/daret/${g.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#F4F6FB]"
                  >
                    <div>
                      <p className="font-semibold text-[#0E1442]">{g.nom}</p>
                      <p className={`text-sm ${subtle}`}>
                        {money(g.montant)} · {g.nombreMembres} places ·{" "}
                        {g.role === "ORGANISATEUR" ? "Vous organisez" : "Vous participez"}
                      </p>
                    </div>
                    <span className={`${badge} ${statusStyles.EN_ATTENTE.className}`}>
                      {statusStyles.EN_ATTENTE.label}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(18,27,107,0.04)] ${
        highlight ? "border-[#FFB81C] bg-[#FFF8E6]" : "border-[#E3E7F3] bg-white"
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#5B6190]">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            highlight ? "bg-[#FFB81C]/30 text-[#8A5A00]" : "bg-[#E6E9FB] text-[#1B2A9B]"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className={`${display} text-2xl font-extrabold text-[#0E1442]`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-[#5B6190]">{hint}</div>}
    </div>
  );
}