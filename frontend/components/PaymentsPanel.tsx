"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Wallet, Gift, Download } from "lucide-react";
import {
  closeTurn,
  confirmCurrentPayout,
  createCheckout,
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
import { downloadReceipt } from "@/lib/receipt";
import {
  badge,
  btnPrimary,
  btnPrimarySm,
  btnSecondarySm,
  card,
  errorText,
  sectionTitle,
  statusStyles,
  subtle,
} from "@/components/ui";

type RowStatus = PaymentStatus | "NON_GENEREE";

const statusMeta: Record<RowStatus, { label: string; className: string }> = {
  NON_GENEREE: { label: "Non générée", className: "bg-[#E8EAF4] text-[#5B6190]" },
  PENDING: { label: "En attente", className: statusStyles.EN_ATTENTE.className },
  PAID: { label: "Payé, à valider", className: "bg-[#E6E9FB] text-[#1B2A9B]" },
  VALIDATED: { label: "Validé", className: statusStyles.ACTIVE.className },
  LATE: { label: "En retard", className: "bg-[#FDECEA] text-[#B3261E]" },
};

// Set NEXT_PUBLIC_MANUAL_PAYMENTS=true in .env.local to also show the manual
// "J'ai payé" button (cash / transfer). Must match payments.manual-declaration-enabled
// on the backend, otherwise the backend rejects the call.
const MANUAL_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_MANUAL_PAYMENTS === "true";

interface PaymentsPanelProps {
  groupId: string;
  groupName?: string;
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
  groupName,
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
  const [payingByCard, setPayingByCard] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [returnedFromStripe, setReturnedFromStripe] = useState<"success" | "cancelled" | null>(null);

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
      .catch(() => setPayout(null)); // silent, e.g. position not assigned yet
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadPayments(), loadPayout()]).finally(() => setLoading(false));
  }, [loadPayments, loadPayout]);

  // Detect the redirect back from Stripe (?payment=success or ?payment=cancelled).
  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("payment");
    if (result === "success" || result === "cancelled") {
      setReturnedFromStripe(result);
    }
  }, []);

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

  // After a successful Stripe payment the webhook can arrive a moment after the
  // redirect, so poll for a few seconds until the payment shows as validated.
  const myStatus = myPayment?.status;
  useEffect(() => {
    if (returnedFromStripe !== "success" || myStatus === "VALIDATED") return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      loadPayments();
      loadPayout();
      if (attempts >= 10) clearInterval(timer);
    }, 2000);

    return () => clearInterval(timer);
  }, [returnedFromStripe, myStatus, loadPayments, loadPayout]);

  async function handleDownloadReceipt(payment: PaymentResponse) {
    setError(null);
    setDownloadingId(payment.id);
    try {
      await downloadReceipt({ payment, groupName, totalTurns });
    } catch {
      setError("Impossible de générer le reçu. Réessayez.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePayByCard() {
    setError(null);
    setPayingByCard(true);
    try {
      const { url } = await createCheckout(groupId);
      window.location.href = url; // leave the app for the Stripe page
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setPayingByCard(false);
    }
  }

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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className={sectionTitle}>Paiements</h2>
        <span className={`text-sm ${subtle}`}>
          Tour {cycle + 1} / {totalTurns} · {amount.toLocaleString("fr-FR")} MAD par membre
        </span>
      </div>

      {isOrganisateur && !loading && payments.length < members.length && (
        <div className={`${card} mb-3 flex flex-wrap items-center justify-between gap-3 p-4`}>
          <span className={`text-sm ${subtle}`}>
            {payments.length === 0
              ? "Aucun paiement généré pour ce tour."
              : `${members.length - payments.length} membre(s) sans paiement généré pour ce tour.`}
          </span>
          <button onClick={handleGenerate} disabled={generating} className={btnPrimarySm}>
            {generating ? "Génération..." : "Générer les paiements"}
          </button>
        </div>
      )}

      {loading ? (
        <div className={`${card} p-5 text-sm ${subtle}`}>Chargement...</div>
      ) : (
        <div className={`${card} divide-y divide-[#E3E7F3]`}>
          {rows.map(({ member, payment }) => {
            const status: RowStatus = payment?.status ?? "NON_GENEREE";
            const meta = statusMeta[status];
            const isMe = member.userId === currentUserId;
            const canPay = isMe && (payment?.status === "PENDING" || payment?.status === "LATE");
            const canDownloadReceipt = payment?.status === "VALIDATED" && (isMe || isOrganisateur);

            return (
              <div
                key={member.userId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[#0E1442]">
                    {member.firstname} {member.lastname}
                  </span>
                  <span className={`${badge} ${meta.className}`}>{meta.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isOrganisateur && payment?.status === "PAID" && (
                    <button
                      onClick={() => handleValidate(payment.id)}
                      disabled={actioningId === payment.id}
                      className={btnPrimarySm}
                    >
                      {actioningId === payment.id ? "Validation..." : "Valider"}
                    </button>
                  )}

                  {canDownloadReceipt && payment && (
                    <button
                      onClick={() => handleDownloadReceipt(payment)}
                      disabled={downloadingId === payment.id}
                      className={btnSecondarySm}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingId === payment.id ? "Génération..." : "Reçu"}
                    </button>
                  )}

                  {canPay && (
                    <button onClick={handlePayByCard} disabled={payingByCard} className={btnPrimarySm}>
                      {payingByCard ? "Redirection..." : "Payer par carte"}
                    </button>
                  )}

                  {canPay && MANUAL_PAYMENTS_ENABLED && (
                    <button onClick={handleDeclare} disabled={actioningId === "me"} className={btnSecondarySm}>
                      {actioningId === "me" ? "Envoi..." : "J'ai payé (espèces / virement)"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className={`mt-3 flex items-center gap-1.5 ${errorText}`}>
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      )}

      {returnedFromStripe === "cancelled" && myPayment?.status !== "VALIDATED" && (
        <p className={`mt-3 flex items-center gap-1.5 text-sm ${subtle}`}>
          <AlertTriangle className="h-4 w-4" />
          Paiement annulé. Vous pouvez réessayer.
        </p>
      )}

      {returnedFromStripe === "success" && myPayment?.status !== "VALIDATED" && (
        <p className={`mt-3 flex items-center gap-1.5 text-sm ${subtle}`}>
          <Clock className="h-4 w-4" />
          Paiement reçu, confirmation en cours...
        </p>
      )}

      {myPayment?.status === "VALIDATED" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[#0B7A69]">
            <CheckCircle2 className="h-4 w-4" />
            Votre cotisation pour ce tour est validée.
          </p>
          <button
            onClick={() => handleDownloadReceipt(myPayment)}
            disabled={downloadingId === myPayment.id}
            className={btnSecondarySm}
          >
            <Download className="h-3.5 w-3.5" />
            {downloadingId === myPayment.id ? "Génération..." : "Télécharger le reçu"}
          </button>
        </div>
      )}

      {myPayment?.status === "PAID" && (
        <p className={`mt-3 flex items-center gap-1.5 text-sm ${subtle}`}>
          <Clock className="h-4 w-4" />
          En attente de validation par l&apos;organisateur.
        </p>
      )}

      {!loading && allValidated && payout && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#FFB81C]/60 bg-[#FFF8E6] p-5">
          <div className="flex items-center gap-3 text-sm text-[#0E1442]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFB81C]/30 text-[#8A5A00]">
              <Gift className="h-4 w-4" />
            </span>
            <span>
              Bénéficiaire de ce tour : <strong>{payout.beneficiaryName}</strong> ·{" "}
              {payout.amount.toLocaleString("fr-FR")} MAD
            </span>
          </div>
          {payoutConfirmed ? (
            <span className={`${badge} ${statusStyles.ACTIVE.className}`}>Versé</span>
          ) : isOrganisateur ? (
            <button onClick={handleConfirmPayout} disabled={confirmingPayout} className={btnPrimarySm}>
              {confirmingPayout ? "Confirmation..." : "Confirmer le versement"}
            </button>
          ) : (
            <span className={`${badge} ${statusStyles.EN_ATTENTE.className}`}>En attente</span>
          )}
        </div>
      )}

      {isOrganisateur && (
        <div className={`${card} mt-4 flex flex-wrap items-center justify-between gap-3 p-5`}>
          <div className={`flex items-center gap-2 text-sm ${subtle}`}>
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
            className={btnPrimary}
          >
            {closing ? "Clôture..." : "Clôturer le tour"}
          </button>
        </div>
      )}
    </div>
  );
}