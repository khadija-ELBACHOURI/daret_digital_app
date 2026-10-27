import type { PaymentResponse } from "@/lib/api";

interface ReceiptInput {
  payment: PaymentResponse;
  groupName?: string;
  totalTurns: number;
}

// toLocaleString("fr-FR") uses a narrow no-break space that the default PDF font
// cannot render, so the amount is formatted by hand.
function formatAmount(amount: number): string {
  const [int, dec] = amount.toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} MAD`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Non renseignée";
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date} à ${time}`;
}

export async function downloadReceipt({ payment, groupName, totalTurns }: ReceiptInput): Promise<void> {
  // Loaded on demand so jsPDF stays out of the initial bundle.
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const receiptNumber = payment.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  // Header band
  doc.setFillColor(27, 42, 155);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Daret Digital", margin, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Reçu de paiement", margin, 29);
  doc.setFontSize(10);
  doc.text(`N° ${receiptNumber}`, pageWidth - margin, 20, { align: "right" });

  // Amount block
  doc.setTextColor(14, 20, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Montant réglé", margin, 62);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(formatAmount(payment.amount), margin, 74);

  // Details
  const rows: [string, string][] = [
    ["Membre", payment.memberName],
    ["Daret", groupName ?? "-"],
    ["Tour", `${payment.cycle + 1} / ${totalTurns}`],
    ["Date du paiement", formatDateTime(payment.paidAt)],
    ["Statut", "Validé"],
    ["Référence", payment.id],
  ];

  let y = 94;
  doc.setDrawColor(227, 231, 243);
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(91, 97, 144);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(14, 20, 66);
    doc.text(value, pageWidth - margin, y, { align: "right", maxWidth: pageWidth - margin * 2 - 45 });

    doc.line(margin, y + 4, pageWidth - margin, y + 4);
    y += 13;
  });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(91, 97, 144);
  doc.text(`Document généré le ${formatDateTime(new Date().toISOString())}`, margin, 280);

  doc.save(`recu-${receiptNumber}.pdf`);
}