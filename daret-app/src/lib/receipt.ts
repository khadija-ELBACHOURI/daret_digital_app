import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { PaymentResponse } from "@/lib/api";

interface ReceiptInput {
  payment: PaymentResponse;
  groupName?: string;
  totalTurns: number;
}

function formatAmount(amount: number): string {
  const [int, dec] = amount.toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} MAD`;
}

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function formatDateTime(iso: string | null): string {
  if (!iso) return "Non renseignée";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function downloadReceipt({ payment, groupName, totalTurns }: ReceiptInput): Promise<void> {
  const receiptNumber = payment.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const rows: [string, string][] = [
    ["Membre", payment.memberName],
    ["Daret", groupName ?? "-"],
    ["Tour", `${payment.cycle + 1} / ${totalTurns}`],
    ["Date du paiement", formatDateTime(payment.paidAt)],
    ["Statut", "Validé"],
    ["Référence", payment.id],
  ];

  const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: Helvetica, Arial, sans-serif; color: #0E1442; margin: 0; }
      .header { background: #1B2A9B; color: #fff; padding: 32px 40px; display: flex; justify-content: space-between; }
      .header h1 { margin: 0; font-size: 28px; }
      .header p { margin: 6px 0 0; font-size: 16px; }
      .body { padding: 40px; }
      .label { font-size: 14px; color: #5B6190; }
      .amount { font-size: 40px; font-weight: bold; margin: 6px 0 36px; }
      .row { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #E3E7F3; font-size: 15px; }
      .row span:first-child { color: #5B6190; }
      .row span:last-child { font-weight: bold; text-align: right; max-width: 60%; word-break: break-all; }
      .footer { margin-top: 48px; font-size: 12px; color: #5B6190; }
    </style>
  </head>
  <body>
    <div class="header">
      <div><h1>Daret Digital</h1><p>Reçu de paiement</p></div>
      <div>N° ${esc(receiptNumber)}</div>
    </div>
    <div class="body">
      <div class="label">Montant réglé</div>
      <div class="amount">${esc(formatAmount(payment.amount))}</div>
      ${rows.map(([l, v]) => `<div class="row"><span>${esc(l)}</span><span>${esc(v)}</span></div>`).join("")}
      <div class="footer">Document généré le ${esc(formatDateTime(new Date().toISOString()))}</div>
    </div>
  </body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Reçu ${receiptNumber}`,
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error("Partage indisponible sur cet appareil.");
  }
}
