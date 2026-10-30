import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { AlertTriangle, CheckCircle2, Clock, Download, Gift, Wallet } from "lucide-react-native";
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
import { Badge, Button, Card, Divider } from "@/components/Ui";
import { colors, fonts, statusStyles, type } from "@/lib/theme";

type RowStatus = PaymentStatus | "NON_GENEREE";

const statusMeta: Record<RowStatus, { label: string; bg: string; fg: string }> = {
  NON_GENEREE: { label: "Non générée", bg: colors.greyBg, fg: colors.muted },
  PENDING: { label: "En attente", bg: statusStyles.EN_ATTENTE.bg, fg: statusStyles.EN_ATTENTE.fg },
  PAID: { label: "Payé, à valider", bg: colors.paleBlue, fg: colors.blue },
  VALIDATED: { label: "Validé", bg: statusStyles.ACTIVE.bg, fg: statusStyles.ACTIVE.fg },
  LATE: { label: "En retard", bg: colors.dangerBg, fg: colors.dangerDark },
};

// Set EXPO_PUBLIC_MANUAL_PAYMENTS=true in .env to also show the manual
// "J'ai payé" button (cash / transfer). Must match payments.manual-declaration-enabled
// on the backend, otherwise the backend rejects the call.
const MANUAL_PAYMENTS_ENABLED = process.env.EXPO_PUBLIC_MANUAL_PAYMENTS === "true";

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
  const [polling, setPolling] = useState(false);

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

  const sortedMembers = [...members].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

  const rows = sortedMembers.map((m) => {
    const payment = payments.find((p) => p.memberId === m.userId) ?? null;
    return { member: m, payment };
  });

  const myPayment = payments.find((p) => p.memberId === currentUserId) ?? null;
  const allValidated =
    payments.length === members.length && payments.length > 0 && payments.every((p) => p.status === "VALIDATED");
  const payoutConfirmed = payout?.status === "VERSE";

  // After the Stripe page is closed, the webhook can arrive a moment later,
  // so poll for a few seconds until the payment shows as validated.
  const myStatus = myPayment?.status;
  useEffect(() => {
    if (!polling) return;
    if (myStatus === "VALIDATED") {
      setPolling(false);
      return;
    }

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      loadPayments();
      loadPayout();
      if (attempts >= 10) {
        clearInterval(timer);
        setPolling(false);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [polling, myStatus, loadPayments, loadPayout]);

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
      await WebBrowser.openBrowserAsync(url); // resolves when the user closes the browser
      await loadPayments();
      setPolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
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
    <View>
      <View style={{ marginBottom: 12 }}>
        <Text style={type.sectionTitle}>Paiements</Text>
        <Text style={[type.small, { marginTop: 2 }]}>
          Tour {cycle + 1} / {totalTurns} · {amount.toLocaleString("fr-FR")} MAD par membre
        </Text>
      </View>

      {isOrganisateur && !loading && payments.length < members.length && (
        <Card style={{ padding: 16, marginBottom: 12, gap: 10 }}>
          <Text style={type.small}>
            {payments.length === 0
              ? "Aucun paiement généré pour ce tour."
              : `${members.length - payments.length} membre(s) sans paiement généré pour ce tour.`}
          </Text>
          <Button
            title={generating ? "Génération..." : "Générer les paiements"}
            onPress={handleGenerate}
            disabled={generating}
            size="sm"
          />
        </Card>
      )}

      {loading ? (
        <Card style={{ padding: 20 }}>
          <Text style={type.small}>Chargement...</Text>
        </Card>
      ) : (
        <Card>
          {rows.map(({ member, payment }, idx) => {
            const status: RowStatus = payment?.status ?? "NON_GENEREE";
            const meta = statusMeta[status];
            const isMe = member.userId === currentUserId;
            const canPay = isMe && (payment?.status === "PENDING" || payment?.status === "LATE");
            const canDownloadReceipt = payment?.status === "VALIDATED" && (isMe || isOrganisateur);
            const hasActions = (isOrganisateur && payment?.status === "PAID") || canDownloadReceipt || canPay;

            return (
              <View key={member.userId}>
                {idx > 0 && <Divider />}
                <View style={{ padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Text style={[type.bodyMedium, { flexShrink: 1 }]}>
                      {member.firstname} {member.lastname}
                    </Text>
                    <Badge label={meta.label} bg={meta.bg} fg={meta.fg} />
                  </View>

                  {hasActions && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {isOrganisateur && payment?.status === "PAID" && (
                        <Button
                          title={actioningId === payment.id ? "Validation..." : "Valider"}
                          onPress={() => handleValidate(payment.id)}
                          disabled={actioningId === payment.id}
                          size="sm"
                        />
                      )}

                      {canDownloadReceipt && payment && (
                        <Button
                          title={downloadingId === payment.id ? "Génération..." : "Reçu"}
                          onPress={() => handleDownloadReceipt(payment)}
                          disabled={downloadingId === payment.id}
                          variant="secondary"
                          size="sm"
                          icon={<Download size={14} color={colors.blue} />}
                        />
                      )}

                      {canPay && (
                        <Button
                          title={payingByCard ? "Redirection..." : "Payer par carte"}
                          onPress={handlePayByCard}
                          disabled={payingByCard}
                          size="sm"
                        />
                      )}

                      {canPay && MANUAL_PAYMENTS_ENABLED && (
                        <Button
                          title={actioningId === "me" ? "Envoi..." : "J'ai payé (espèces / virement)"}
                          onPress={handleDeclare}
                          disabled={actioningId === "me"}
                          variant="secondary"
                          size="sm"
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {error && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
          <AlertTriangle size={16} color={colors.dangerDark} />
          <Text style={[type.errorText, { flex: 1 }]}>{error}</Text>
        </View>
      )}

      {polling && myPayment?.status !== "VALIDATED" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
          <Clock size={16} color={colors.muted} />
          <Text style={type.small}>Confirmation du paiement en cours...</Text>
        </View>
      )}

      {myPayment?.status === "VALIDATED" && (
        <View style={{ marginTop: 12, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color={colors.mintDark} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.mintDark }}>
              Votre cotisation pour ce tour est validée.
            </Text>
          </View>
          <Button
            title={downloadingId === myPayment.id ? "Génération..." : "Télécharger le reçu"}
            onPress={() => handleDownloadReceipt(myPayment)}
            disabled={downloadingId === myPayment.id}
            variant="secondary"
            size="sm"
            icon={<Download size={14} color={colors.blue} />}
          />
        </View>
      )}

      {myPayment?.status === "PAID" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
          <Clock size={16} color={colors.muted} />
          <Text style={[type.small, { flex: 1 }]}>En attente de validation par l'organisateur.</Text>
        </View>
      )}

      {!loading && allValidated && payout && (
        <View
          style={{
            marginTop: 16,
            padding: 18,
            gap: 12,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "rgba(255,184,28,0.6)",
            backgroundColor: colors.amberSoft,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,184,28,0.3)",
              }}
            >
              <Gift size={16} color={colors.amberText} />
            </View>
            <Text style={[type.body, { flex: 1 }]}>
              Bénéficiaire de ce tour : <Text style={{ fontFamily: fonts.bold }}>{payout.beneficiaryName}</Text> ·{" "}
              {payout.amount.toLocaleString("fr-FR")} MAD
            </Text>
          </View>
          {payoutConfirmed ? (
            <View style={{ alignSelf: "flex-start" }}>
              <Badge label="Versé" bg={statusStyles.ACTIVE.bg} fg={statusStyles.ACTIVE.fg} />
            </View>
          ) : isOrganisateur ? (
            <Button
              title={confirmingPayout ? "Confirmation..." : "Confirmer le versement"}
              onPress={handleConfirmPayout}
              disabled={confirmingPayout}
              size="sm"
            />
          ) : (
            <View style={{ alignSelf: "flex-start" }}>
              <Badge label="En attente" bg={statusStyles.EN_ATTENTE.bg} fg={statusStyles.EN_ATTENTE.fg} />
            </View>
          )}
        </View>
      )}

      {isOrganisateur && (
        <Card style={{ marginTop: 16, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Wallet size={16} color={colors.muted} />
            <Text style={[type.small, { flex: 1 }]}>
              {!allValidated
                ? "En attente que tous les paiements soient validés."
                : !payoutConfirmed
                ? "En attente de la confirmation du versement au bénéficiaire."
                : "Tous les paiements sont validés et le versement est confirmé."}
            </Text>
          </View>
          <Button
            title={closing ? "Clôture..." : "Clôturer le tour"}
            onPress={handleCloseTurn}
            disabled={!allValidated || !payoutConfirmed || closing}
          />
        </Card>
      )}
    </View>
  );
}
