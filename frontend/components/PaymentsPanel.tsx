"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Wallet, Gift } from "lucide-react";
import {
  closeTurn,
  confirmCurrentPayout,
  declareMyPayment,
  generatePayments,
  getCurrentPayout,
  getPaymentsForCycle,
  validatePayment,
  MemberResponse,
  PaymentResponse,
  PaymentStatus,
  PayoutResponse,
} from "@/lib/api";

type RowStatus = PaymentStatus | "NON_GENEREE";

const statusMeta: Record<RowStatus, { label: string; className: string }> = {
  NON_GENEREE: { label: "Non générée", className: "bg-[#1F2023] text-gray-500" },
  PENDING: { label: "En attente", className: "bg-[#2A2410] text-[#E5B800]" },
  PAID: { label: "Payé, à valider", className: "bg-[#132A2E] text-[#38BDF8]" },
  VALIDATED: { label: "Validé", className: "bg-[#16241D] text-[#00D492]" },
  LATE: { label: "En retard", className: "bg-[#2A1414] text-red-400" },
};

interface PaymentsPanelProps {
  groupId: string;
  cycle: number;
  totalTurns: number;
  amount: number;
  members: MemberResponse[];
  currentUserId: string | null;
  isOrganisateur: boolean;
  onTurnClosed: () => void;
}

export default function PaymentsPanel({
  groupId,
  cycle,
  totalTurns,
  amount,
  members,
  currentUserId,
  isOrganisateur,
  onTurnClosed,
}: PaymentsPanelProps) {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [payout, setPayout] = useState<PayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmingPayout, setConfirmingPayout] = useState(false);

  const loadPayments = useCallback(() => {
    return getPaymentsForCycle(groupId, cycle)
      .then(setPayments)
      .catch((err) =>
        setError(
          err instanceof Error
            ? `Impossible de charger les paiements: ${err.message}`
            : "Impossible de charger les paiements de ce tour."
        )
      );
  }, [groupId, cycle]);

  const loadPayout = useCallback(() => {
    return getCurrentPayout(groupId)
      .then(setPayout)
      .catch(() => setPayout(null)); // silencieux, ex: position pas encore assignée
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadPayments(), loadPayout()]).finally(() => setLoading(false));
  }, [loadPayments, loadPayout]);

  const sortedMembers = [...members].sort(
    (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)
  );

  const rows = sortedMembers.map((m) => {
    const payment = payments.find((p) => p.memberId === m.userId) ?? null;
    return { member: m, payment };
  });

  const myPayment = payments.find((p) => p.memberId === currentUserId) ?? null;
  const allValidated =
    payments.length === members.length &&
    payments.length > 0 &&
    payments.every((p) => p.status === "VALIDATED");
  const payoutConfirmed = payout?.status === "VERSE";

  async function handleDeclare() {
    setError(null);
    setActioningId("me");
    try {
      await declareMyPayment(groupId);
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActioningId(null);
    }
  }

  async function handleValidate(paymentId: string) {
    setError(null);
    setActioningId(paymentId);
    try {
      await validatePayment(groupId, paymentId);
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActioningId(null);
    }
  }

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      await generatePayments(groupId);
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirmPayout() {
    setError(null);
    setConfirmingPayout(true);
    try {
      const updated = await confirmCurrentPayout(groupId);
      setPayout(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setConfirmingPayout(false);
    }
  }

  async function handleCloseTurn() {
    setError(null);
    setClosing(true);
    try {
      await closeTurn(groupId);
      onTurnClosed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Paiements
        </h2>
        <span className="text-xs text-gray-500">
          Tour {cycle + 1} / {totalTurns} · {amount.toLocaleString("fr-FR")} MAD par membre
        </span>
      </div>

      {isOrganisateur && !loading && payments.length < members.length && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#26282C] bg-[#101113] p-4">
          <span className="text-sm text-gray-400">
            {payments.length === 0
              ? "Aucun paiement généré pour ce tour."
              : `${members.length - payments.length} membre(s) sans paiement généré pour ce tour.`}
          </span>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-md bg-[#00D492] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
          >
            {generating ? "Génération..." : "Générer les paiements"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-[#1F2023] bg-[#101113] p-4 text-sm text-gray-400">
          Chargement...
        </div>
      ) : (
        <div className="rounded-lg border border-[#1F2023] bg-[#101113]">
          {rows.map(({ member, payment }, i) => {
            const status: RowStatus = payment?.status ?? "NON_GENEREE";
            const meta = statusMeta[status];
            const isMe = member.userId === currentUserId;

            return (
              <div
                key={member.userId}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i !== rows.length - 1 ? "border-b border-[#1F2023]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">
                    {member.firstname} {member.lastname}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>

                {isOrganisateur && payment?.status === "PAID" && (
                  <button
                    onClick={() => handleValidate(payment.id)}
                    disabled={actioningId === payment.id}
                    className="rounded-md bg-[#00D492] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
                  >
                    {actioningId === payment.id ? "Validation..." : "Valider"}
                  </button>
                )}

                {isMe && payment?.status === "PENDING" && (
                  <button
                    onClick={handleDeclare}
                    disabled={actioningId === "me"}
                    className="rounded-md bg-[#00D492] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
                  >
                    {actioningId === "me" ? "Envoi..." : "J'ai payé"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {myPayment?.status === "VALIDATED" && (
        <p className="mt-2 flex items-center gap-1 text-sm text-[#00D492]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Votre cotisation pour ce tour est validée.
        </p>
      )}

      {myPayment?.status === "PAID" && (
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          En attente de validation par l&apos;organisateur.
        </p>
      )}

      {!loading && allValidated && payout && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#1F2023] bg-[#101113] p-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Gift className="h-4 w-4 text-[#00D492]" />
            <span>
              Bénéficiaire de ce tour : <strong>{payout.beneficiaryName}</strong> ·{" "}
              {payout.amount.toLocaleString("fr-FR")} MAD
            </span>
          </div>
          {payoutConfirmed ? (
            <span className="rounded-full bg-[#16241D] px-2 py-0.5 text-xs text-[#00D492]">
              Versé
            </span>
          ) : isOrganisateur ? (
            <button
              onClick={handleConfirmPayout}
              disabled={confirmingPayout}
              className="rounded-md bg-[#00D492] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#00c184] disabled:opacity-50"
            >
              {confirmingPayout ? "Confirmation..." : "Confirmer le versement"}
            </button>
          ) : (
            <span className="rounded-full bg-[#2A2410] px-2 py-0.5 text-xs text-[#E5B800]">
              En attente
            </span>
          )}
        </div>
      )}

      {isOrganisateur && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#1F2023] bg-[#101113] p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Wallet className="h-4 w-4" />
            {!allValidated
              ? "En attente que tous les paiements soient validés."
              : !payoutConfirmed
              ? "En attente de la confirmation du versement au bénéficiaire."
              : "Tous les paiements sont validés et le versement est confirmé."}
          </div>
          <button
            onClick={handleCloseTurn}
            disabled={!allValidated || !payoutConfirmed || closing}
            className="rounded-md bg-[#00D492] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#00c184] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {closing ? "Clôture..." : "Clôturer le tour"}
          </button>
        </div>
      )}
    </div>
  );
}