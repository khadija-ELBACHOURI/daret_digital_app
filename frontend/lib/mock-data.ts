export type DaretStatus = "active" | "en_attente" | "terminee";

export interface Member {
  id: string;
  name: string;
  initials: string;
  turnOrder: number;
  hasPaid: boolean;
  isCurrentUser?: boolean;
}

export interface Daret {
  id: string;
  name: string;
  amount: number; // MAD per tour
  frequency: "hebdomadaire" | "mensuelle";
  currentTurn: number;
  totalTurns: number;
  nextPaymentDate: string; // ISO date
  status: DaretStatus;
  myPosition: number;
  members: Member[];
}

export const mockUser = {
  name: "Khadija Bennani",
  email: "khadija.bennani@example.com",
  phone: "+212 6 12 34 56 78",
  iban: "MA64 0011 0000 0123 4567 8901 23",
  initials: "KB",
};

export const mockDarets: Daret[] = [
  {
    id: "daret-ramadan",
    name: "Daret Ramadan",
    amount: 1000,
    frequency: "mensuelle",
    currentTurn: 3,
    totalTurns: 8,
    nextPaymentDate: "2026-09-05",
    status: "active",
    myPosition: 5,
    members: [
      { id: "m1", name: "Youssef Amrani", initials: "YA", turnOrder: 1, hasPaid: true },
      { id: "m2", name: "Salma Idrissi", initials: "SI", turnOrder: 2, hasPaid: true },
      { id: "m3", name: "Omar Fassi", initials: "OF", turnOrder: 3, hasPaid: true },
      { id: "m4", name: "Nadia Chraibi", initials: "NC", turnOrder: 4, hasPaid: false },
      { id: "m5", name: "Khadija Bennani", initials: "KB", turnOrder: 5, hasPaid: false, isCurrentUser: true },
      { id: "m6", name: "Hicham Tazi", initials: "HT", turnOrder: 6, hasPaid: false },
      { id: "m7", name: "Imane Berrada", initials: "IB", turnOrder: 7, hasPaid: false },
      { id: "m8", name: "Karim Slaoui", initials: "KS", turnOrder: 8, hasPaid: false },
    ],
  },
  {
    id: "daret-bureau",
    name: "Daret Bureau",
    amount: 500,
    frequency: "mensuelle",
    currentTurn: 1,
    totalTurns: 6,
    nextPaymentDate: "2026-09-10",
    status: "active",
    myPosition: 2,
    members: [
      { id: "b1", name: "Rania Kabbaj", initials: "RK", turnOrder: 1, hasPaid: true },
      { id: "b2", name: "Khadija Bennani", initials: "KB", turnOrder: 2, hasPaid: false, isCurrentUser: true },
      { id: "b3", name: "Anas Belkadi", initials: "AB", turnOrder: 3, hasPaid: false },
      { id: "b4", name: "Sara El Ouali", initials: "SE", turnOrder: 4, hasPaid: false },
      { id: "b5", name: "Yassine Roudani", initials: "YR", turnOrder: 5, hasPaid: false },
      { id: "b6", name: "Meriem Hajji", initials: "MH", turnOrder: 6, hasPaid: false },
    ],
  },
  {
    id: "daret-famille",
    name: "Daret Famille",
    amount: 2000,
    frequency: "hebdomadaire",
    currentTurn: 10,
    totalTurns: 10,
    nextPaymentDate: "2026-08-15",
    status: "terminee",
    myPosition: 10,
    members: Array.from({ length: 10 }).map((_, i) => ({
      id: `f${i + 1}`,
      name: i === 9 ? "Khadija Bennani" : `Membre ${i + 1}`,
      initials: i === 9 ? "KB" : `M${i + 1}`,
      turnOrder: i + 1,
      hasPaid: true,
      isCurrentUser: i === 9,
    })),
  },
];

export const mockActivity = [
  { id: "a1", label: "Omar Fassi a reçu le tour de Daret Ramadan", date: "2026-08-28" },
  { id: "a2", label: "Vous avez rejoint Daret Bureau", date: "2026-08-20" },
  { id: "a3", label: "Rania Kabbaj a payé sa cotisation", date: "2026-08-18" },
];