import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Dates are DD/MM, year determined by month: 05-12 = 2025, 01-04 = 2026
function toISO(ddmm: string): string {
  const [day, month] = ddmm.split("/").map(Number);
  const year = month >= 5 ? 2025 : 2026;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00Z`;
}

type BetData = { date: string; odds: number; stake: number; result: "gagne" | "perdu" };
type SeriesData = {
  subject: string;
  bet_type: "victoire" | "defaite" | "buteur";
  status: "gagnee" | "abandonnee" | "en_cours";
  bets: BetData[];
};

const allSeries: SeriesData[] = [
  // === CHERKI - Buteur ===
  { subject: "Cherki", bet_type: "buteur", status: "gagnee", bets: [
    { date: "14/12", odds: 2.55, stake: 0.65, result: "perdu" },
    { date: "14/12", odds: 2.15, stake: 2.30, result: "gagne" },
  ]},
  { subject: "Cherki", bet_type: "buteur", status: "gagnee", bets: [
    { date: "01/01", odds: 3.70, stake: 0.37, result: "perdu" },
    { date: "07/01", odds: 3.50, stake: 0.95, result: "perdu" },
    { date: "20/01", odds: 3.25, stake: 1.92, result: "gagne" },
  ]},
  { subject: "Cherki", bet_type: "buteur", status: "en_cours", bets: [
    { date: "14/02", odds: 2.35, stake: 0.74, result: "perdu" },
    { date: "21/02", odds: 5.00, stake: 0.69, result: "perdu" },
    { date: "04/03", odds: 6.50, stake: 0.81, result: "perdu" },
    { date: "12/03", odds: 12.00, stake: 0.57, result: "perdu" },
  ]},

  // === DEMBÉLÉ - Buteur ===
  { subject: "Dembélé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 2.45, stake: 2.00, result: "perdu" },
    { date: "18/09", odds: 1.94, stake: 4.26, result: "gagne" },
  ]},
  { subject: "Dembélé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "21/10", odds: 3.50, stake: 0.40, result: "gagne" },
  ]},
  { subject: "Dembélé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "13/02", odds: 2.00, stake: 1.00, result: "gagne" },
  ]},
  { subject: "Dembélé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "11/03", odds: 4.10, stake: 0.32, result: "gagne" },
  ]},

  // === MARSEILLE - Victoire ===
  { subject: "Marseille", bet_type: "victoire", status: "gagnee", bets: [
    { date: "02/11", odds: 1.55, stake: 0.91, result: "gagne" },
  ]},
  { subject: "Marseille", bet_type: "victoire", status: "gagnee", bets: [
    { date: "21/11", odds: 1.91, stake: 0.55, result: "gagne" },
  ]},
  { subject: "Marseille", bet_type: "victoire", status: "gagnee", bets: [
    { date: "14/02", odds: 1.87, stake: 1.15, result: "perdu" },
    { date: "21/02", odds: 1.90, stake: 3.50, result: "perdu" },
    { date: "04/03", odds: 1.63, stake: 12.14, result: "perdu" },
    { date: "08/03", odds: 2.33, stake: 15.63, result: "gagne" },
  ]},

  // === REAL - Victoire ===
  { subject: "Real", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 1.78, stake: 1.28, result: "perdu" },
    { date: "18/09", odds: 1.55, stake: 6.00, result: "gagne" },
  ]},
  { subject: "Real", bet_type: "victoire", status: "gagnee", bets: [
    { date: "22/10", odds: 3.50, stake: 0.40, result: "perdu" },
    { date: "26/10", odds: 1.88, stake: 2.73, result: "gagne" },
  ]},
  { subject: "Real", bet_type: "victoire", status: "gagnee", bets: [
    { date: "09/11", odds: 1.55, stake: 1.82, result: "perdu" },
    { date: "23/11", odds: 1.32, stake: 11.94, result: "perdu" },
    { date: "26/11", odds: 1.60, stake: 36.67, result: "gagne" },
  ]},
  { subject: "Real", bet_type: "victoire", status: "gagnee", bets: [
    { date: "04/12", odds: 1.70, stake: 1.43, result: "gagne" },
  ]},
  { subject: "Real", bet_type: "victoire", status: "gagnee", bets: [
    { date: "14/12", odds: 1.58, stake: 1.72, result: "gagne" },
  ]},
  { subject: "Real", bet_type: "victoire", status: "gagnee", bets: [
    { date: "21/02", odds: 1.68, stake: 1.47, result: "perdu" },
    { date: "25/02", odds: 1.67, stake: 5.18, result: "gagne" },
  ]},

  // === KVARATSKHELIA - Buteur ===
  { subject: "Kvaratskhelia", bet_type: "buteur", status: "gagnee", bets: [
    { date: "09/11", odds: 2.68, stake: 0.60, result: "gagne" },
  ]},
  { subject: "Kvaratskhelia", bet_type: "buteur", status: "gagnee", bets: [
    { date: "17/01", odds: 2.52, stake: 0.66, result: "perdu" },
    { date: "20/01", odds: 2.72, stake: 1.55, result: "gagne" },
  ]},
  { subject: "Kvaratskhelia", bet_type: "buteur", status: "gagnee", bets: [
    { date: "25/02", odds: 2.03, stake: 0.97, result: "gagne" },
  ]},

  // === PSG - Victoire ===
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 1.90, stake: 3.00, result: "perdu" },
    { date: "18/09", odds: 1.94, stake: 5.32, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 1.64, stake: 1.56, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "22/09", odds: 1.75, stake: 1.33, result: "perdu" },
    { date: "22/09", odds: 2.35, stake: 0.74, result: "perdu" },
    { date: "27/09", odds: 1.39, stake: 13.00, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "01/10", odds: 3.50, stake: 0.40, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "05/10", odds: 1.95, stake: 1.05, result: "perdu" },
    { date: "17/10", odds: 1.66, stake: 4.62, result: "perdu" },
    { date: "21/10", odds: 1.55, stake: 14.00, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "01/11", odds: 2.25, stake: 0.80, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "09/11", odds: 1.78, stake: 1.28, result: "perdu" },
    { date: "14/12", odds: 1.82, stake: 1.22, result: "gagne" },

  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "14/12", odds: 1.23, stake: 11.87, result: "perdu" },
    { date: "21/01", odds: 1.80, stake: 1.25, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "24/01", odds: 1.28, stake: 11.61, result: "perdu" },
    { date: "13/02", odds: 1.82, stake: 1.22, result: "perdu" },
    { date: "18/02", odds: 1.84, stake: 3.83, result: "gagne" },
  ]},
  { subject: "PSG", bet_type: "victoire", status: "gagnee", bets: [
    { date: "21/02", odds: 1.40, stake: 20.13, result: "gagne" },
  ]},

  // === DOUÉ - Buteur ===
  { subject: "Doué", bet_type: "buteur", status: "gagnee", bets: [
    { date: "13/02", odds: 2.25, stake: 0.80, result: "perdu" },
    { date: "17/02", odds: 2.52, stake: 1.84, result: "gagne" },
  ]},

  // === J. ALVAREZ - Buteur ===
  { subject: "J. Alvarez", bet_type: "buteur", status: "gagnee", bets: [
    { date: "17/01", odds: 2.98, stake: 0.38, result: "perdu" },
    { date: "20/01", odds: 2.16, stake: 1.62, result: "perdu" },
    { date: "21/01", odds: 2.50, stake: 2.83, result: "perdu" },
    { date: "25/01", odds: 1.99, stake: 7.91, result: "perdu" },
    { date: "31/01", odds: 2.22, stake: 13.52, result: "perdu" },
    { date: "31/01", odds: 2.70, stake: 18.09, result: "perdu" },
    { date: "12/02", odds: 2.08, stake: 45.93, result: "perdu" },
    { date: "12/02", odds: 2.50, stake: 64.19, result: "gagne" },
  ]},

  // === HAALAND - Buteur ===
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 1.78, stake: 1.28, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "27/09", odds: 2.20, stake: 0.83, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "01/10", odds: 1.55, stake: 1.81, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "05/10", odds: 1.75, stake: 1.33, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "21/10", odds: 1.60, stake: 1.66, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "26/10", odds: 1.75, stake: 2.66, result: "perdu" },
    { date: "02/11", odds: 1.96, stake: 4.85, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "22/11", odds: 1.75, stake: 1.33, result: "perdu" },
    { date: "25/11", odds: 1.41, stake: 8.12, result: "perdu" },
    { date: "29/11", odds: 1.44, stake: 28.30, result: "perdu" },
    { date: "02/12", odds: 1.64, stake: 65.23, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "01/01", odds: 1.58, stake: 1.72, result: "perdu" },
    { date: "07/01", odds: 1.55, stake: 6.76, result: "perdu" },
    { date: "07/01", odds: 1.48, stake: 23.92, result: "gagne" },
  ]},
  { subject: "Haaland", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/01", odds: 1.90, stake: 1.11, result: "perdu" },
    { date: "20/01", odds: 1.41, stake: 7.59, result: "perdu" },
    { date: "25/01", odds: 1.41, stake: 28.54, result: "perdu" },
    { date: "31/01", odds: 1.96, stake: 42.96, result: "gagne" },
  ]},

  // === OLISE - Buteur ===
  { subject: "Olise", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 2.58, stake: 0.63, result: "gagne" },
  ]},
  { subject: "Olise", bet_type: "buteur", status: "gagnee", bets: [
    { date: "27/09", odds: 3.00, stake: 0.50, result: "perdu" },
    { date: "30/09", odds: 2.40, stake: 1.79, result: "gagne" },
  ]},
  { subject: "Olise", bet_type: "buteur", status: "gagnee", bets: [
    { date: "25/10", odds: 2.40, stake: 0.71, result: "perdu" },
    { date: "30/10", odds: 2.29, stake: 2.10, result: "gagne" },
  ]},
  { subject: "Olise", bet_type: "buteur", status: "gagnee", bets: [
    { date: "08/11", odds: 2.41, stake: 0.71, result: "perdu" },
    { date: "13/11", odds: 2.60, stake: 1.69, result: "gagne" },
  ]},
  { subject: "Olise", bet_type: "buteur", status: "gagnee", bets: [
    { date: "22/11", odds: 2.45, stake: 0.69, result: "gagne" },
  ]},
  { subject: "Olise", bet_type: "buteur", status: "gagnee", bets: [
    { date: "03/12", odds: 2.55, stake: 0.65, result: "perdu" },
    { date: "06/12", odds: 2.62, stake: 1.64, result: "perdu" },
    { date: "09/12", odds: 2.37, stake: 3.86, result: "perdu" },
    { date: "14/12", odds: 1.97, stake: 10.46, result: "perdu" },
    { date: "21/12", odds: 2.35, stake: 16.01, result: "gagne" },
  ]},

  // === BAYERN - Défaite ===
  { subject: "Bayern", bet_type: "defaite", status: "gagnee", bets: [
    { date: "02/11", odds: 4.30, stake: 0.30, result: "perdu" },
    { date: "08/11", odds: 4.30, stake: 0.70, result: "gagne" },
  ]},

  // === GYOKERES - Buteur ===
  { subject: "Gyokeres", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 1.89, stake: 1.12, result: "gagne" },
  ]},
  { subject: "Gyokeres", bet_type: "buteur", status: "gagnee", bets: [
    { date: "01/10", odds: 1.80, stake: 1.25, result: "perdu" },
    { date: "04/10", odds: 1.81, stake: 2.78, result: "perdu" },
    { date: "18/10", odds: 2.08, stake: 5.12, result: "perdu" },
    { date: "21/10", odds: 2.10, stake: 10.00, result: "gagne" },
  ]},
  { subject: "Gyokeres", bet_type: "buteur", status: "gagnee", bets: [
    { date: "01/11", odds: 1.97, stake: 0.52, result: "gagne" },
  ]},
  { subject: "Gyokeres", bet_type: "buteur", status: "gagnee", bets: [
    { date: "14/12", odds: 2.08, stake: 0.93, result: "perdu" },
    { date: "20/12", odds: 2.58, stake: 1.85, result: "gagne" },
  ]},

  // === GUIRASSY - Buteur ===
  { subject: "Guirassy", bet_type: "buteur", status: "gagnee", bets: [
    { date: "01/10", odds: 1.90, stake: 1.11, result: "gagne" },
  ]},
  { subject: "Guirassy", bet_type: "buteur", status: "gagnee", bets: [
    { date: "21/10", odds: 1.85, stake: 1.18, result: "perdu" },
    { date: "25/10", odds: 1.55, stake: 5.78, result: "perdu" },
    { date: "31/10", odds: 2.40, stake: 7.11, result: "gagne" },
  ]},

  // === MANCHESTER CITY - Victoire ===
  { subject: "Manchester City", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 2.04, stake: 0.96, result: "perdu" },
    { date: "18/09", odds: 1.63, stake: 4.70, result: "gagne" },
  ]},
  { subject: "Manchester City", bet_type: "victoire", status: "gagnee", bets: [
    { date: "22/11", odds: 1.93, stake: 1.08, result: "perdu" },
    { date: "25/11", odds: 1.50, stake: 6.16, result: "perdu" },
    { date: "29/11", odds: 1.59, stake: 17.36, result: "perdu" },
    { date: "02/12", odds: 2.38, stake: 20.72, result: "perdu" },
    { date: "06/12", odds: 1.60, stake: 83.87, result: "gagne" },
  ]},

  // === L. MARTINEZ - Buteur ===
  { subject: "L. Martinez", bet_type: "buteur", status: "gagnee", bets: [
    { date: "02/11", odds: 2.10, stake: 0.91, result: "perdu" },
    { date: "09/11", odds: 2.15, stake: 2.53, result: "gagne" },
  ]},
  { subject: "L. Martinez", bet_type: "buteur", status: "gagnee", bets: [
    { date: "23/11", odds: 2.45, stake: 0.69, result: "perdu" },
    { date: "26/11", odds: 3.10, stake: 1.28, result: "perdu" },
    { date: "30/11", odds: 1.95, stake: 5.23, result: "gagne" },
  ]},

  // === MANCHESTER UNITED - Victoire ===
  { subject: "Manchester United", bet_type: "victoire", status: "gagnee", bets: [
    { date: "01/11", odds: 1.93, stake: 0.54, result: "perdu" },
    { date: "08/11", odds: 2.24, stake: 1.24, result: "perdu" },
    { date: "25/11", odds: 1.86, stake: 3.81, result: "perdu" },
    { date: "30/11", odds: 2.68, stake: 4.52, result: "gagne" },
  ]},

  // === LYON - Victoire ===
  { subject: "Lyon", bet_type: "victoire", status: "gagnee", bets: [
    { date: "23/11", odds: 2.08, stake: 0.93, result: "perdu" },
    { date: "27/11", odds: 1.65, stake: 4.51, result: "gagne" },
  ]},

  // === ARSENAL - Victoire ===
  { subject: "Arsenal", bet_type: "victoire", status: "gagnee", bets: [
    { date: "23/11", odds: 2.25, stake: 0.80, result: "gagne" },
  ]},

  // === GREENWOOD - Buteur ===
  { subject: "Greenwood", bet_type: "buteur", status: "gagnee", bets: [
    { date: "06/11", odds: 2.40, stake: 0.72, result: "perdu" },
    { date: "08/11", odds: 2.02, stake: 2.67, result: "gagne" },
  ]},
  { subject: "Greenwood", bet_type: "buteur", status: "gagnee", bets: [
    { date: "21/11", odds: 2.40, stake: 0.71, result: "gagne" },
  ]},

  // === LEWANDOWSKI - Buteur ===
  { subject: "Lewandowski", bet_type: "buteur", status: "gagnee", bets: [
    { date: "22/09", odds: 1.88, stake: 1.14, result: "perdu" },
    { date: "25/09", odds: 1.93, stake: 3.38, result: "gagne" },
  ]},
  { subject: "Lewandowski", bet_type: "buteur", status: "gagnee", bets: [
    { date: "28/09", odds: 1.76, stake: 1.32, result: "gagne" },
  ]},
  { subject: "Lewandowski", bet_type: "buteur", status: "gagnee", bets: [
    { date: "05/10", odds: 1.97, stake: 1.03, result: "perdu" },
    { date: "02/11", odds: 5.00, stake: 0.76, result: "perdu" },
    { date: "09/11", odds: 2.04, stake: 4.61, result: "gagne" },
  ]},

  // === BARCOLA - Buteur ===
  { subject: "Barcola", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 2.50, stake: 0.67, result: "gagne" },
  ]},
  { subject: "Barcola", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 3.30, stake: 0.44, result: "perdu" },
    { date: "27/09", odds: 1.83, stake: 2.94, result: "perdu" },
    { date: "01/10", odds: 3.50, stake: 2.55, result: "perdu" },
    { date: "05/10", odds: 2.50, stake: 6.62, result: "perdu" },
    { date: "17/10", odds: 2.09, stake: 18.10, result: "gagne" },
  ]},

  // === LIVERPOOL - Victoire ===
  { subject: "Liverpool", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 2.10, stake: 0.91, result: "gagne" },
  ]},
  { subject: "Liverpool", bet_type: "victoire", status: "gagnee", bets: [
    { date: "02/11", odds: 1.56, stake: 0.90, result: "gagne" },
  ]},

  // === HAKIMI - Buteur ===
  { subject: "Hakimi", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 3.55, stake: 1.00, result: "perdu" },
    { date: "18/09", odds: 4.30, stake: 1.00, result: "perdu" },
    { date: "18/09", odds: 4.30, stake: 1.52, result: "perdu" },
    { date: "18/09", odds: 4.60, stake: 2.09, result: "perdu" },
    { date: "22/09", odds: 6.15, stake: 2.06, result: "perdu" },
    { date: "27/09", odds: 3.80, stake: 4.88, result: "perdu" },
    { date: "01/10", odds: 6.25, stake: 3.72, result: "perdu" },
    { date: "05/10", odds: 5.36, stake: 5.73, result: "perdu" },
    { date: "05/10", odds: 9.00, stake: 3.03, result: "perdu" },
    { date: "21/10", odds: 6.25, stake: 9.97, result: "perdu" },
    { date: "25/10", odds: 8.75, stake: 5.00, result: "gagne" },
  ]},

  // === YAMAL - Buteur ===
  { subject: "Yamal", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 2.30, stake: 1.00, result: "perdu" },
    { date: "18/09", odds: 2.13, stake: 2.65, result: "gagne" },
  ]},
  { subject: "Yamal", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 2.45, stake: 0.69, result: "perdu" },
    { date: "28/09", odds: 2.23, stake: 2.19, result: "perdu" },
    { date: "01/10", odds: 2.82, stake: 3.23, result: "perdu" },
    { date: "18/10", odds: 1.92, stake: 10.99, result: "perdu" },
    { date: "21/10", odds: 2.10, stake: 20.00, result: "gagne" },
  ]},

  // === LENS - Victoire ===
  { subject: "Lens", bet_type: "victoire", status: "gagnee", bets: [
    { date: "19/10", odds: 1.72, stake: 1.41, result: "gagne" },
  ]},

  // === RASHFORD - Buteur ===
  { subject: "Rashford", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 2.41, stake: 0.72, result: "perdu" },
    { date: "18/09", odds: 3.30, stake: 1.18, result: "gagne" },
  ]},

  // === ALCARAZ - Victoire ===
  { subject: "Alcaraz", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 2.62, stake: 0.30, result: "perdu" },
    { date: "18/09", odds: 2.62, stake: 0.80, result: "perdu" },
    { date: "18/09", odds: 2.86, stake: 1.40, result: "gagne" },
  ]},

  // === BELGIQUE - Victoire ===
  { subject: "Belgique", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 2.00, stake: 0.50, result: "gagne" },
  ]},

  // === FRANCE - Victoire ===
  { subject: "France", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 1.63, stake: 1.50, result: "gagne" },
  ]},
  { subject: "France", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 1.83, stake: 1.20, result: "gagne" },
  ]},

  // === US OPEN - Victoire ===
  { subject: "US Open", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 2.78, stake: 0.56, result: "perdu" },
    { date: "18/09", odds: 2.25, stake: 2.05, result: "gagne" },
  ]},
  { subject: "US Open", bet_type: "victoire", status: "gagnee", bets: [
    { date: "18/09", odds: 4.10, stake: 0.24, result: "gagne" },
  ]},

  // === KARL - Buteur (abandonnée) ===
  { subject: "Karl", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "14/02", odds: 3.20, stake: 0.34, result: "perdu" },
    { date: "08/03", odds: 2.22, stake: 1.51, result: "perdu" },
    { date: "14/03", odds: 2.80, stake: 2.28, result: "perdu" },
  ]},

  // === MBAPPÉ - Buteur ===
  { subject: "Mbappé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 1.61, stake: 1.64, result: "gagne" },
  ]},
  { subject: "Mbappé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 3.10, stake: 0.50, result: "perdu" },
    { date: "18/09", odds: 2.70, stake: 1.47, result: "gagne" },
  ]},
  { subject: "Mbappé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 3.10, stake: 0.50, result: "gagne" },
  ]},
  { subject: "Mbappé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "19/10", odds: 1.73, stake: 1.37, result: "gagne" },
  ]},
  { subject: "Mbappé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "23/10", odds: 3.00, stake: 0.50, result: "perdu" },
    { date: "26/10", odds: 1.64, stake: 4.00, result: "gagne" },
  ]},
  { subject: "Mbappé", bet_type: "buteur", status: "gagnee", bets: [
    { date: "09/11", odds: 2.10, stake: 0.91, result: "perdu" },
    { date: "23/11", odds: 1.52, stake: 5.60, result: "perdu" },
    { date: "26/11", odds: 1.58, stake: 16.40, result: "gagne" },
  ]},
  { subject: "Mbappé", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "21/02", odds: 2.50, stake: 0.67, result: "perdu" },
  ]},

  // === PANICHELLI - Buteur (abandonnée) ===
  { subject: "Panichelli", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "14/12", odds: 5.50, stake: 0.35, result: "perdu" },
    { date: "14/12", odds: 2.37, stake: 1.72, result: "perdu" },
    { date: "20/12", odds: 1.80, stake: 8.34, result: "perdu" },
    { date: "21/12", odds: 1.80, stake: 15.51, result: "perdu" },
  ]},

  // === SALAH - Buteur (abandonnée) ===
  { subject: "Salah", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "22/11", odds: 2.60, stake: 0.63, result: "perdu" },
    { date: "26/11", odds: 1.78, stake: 3.37, result: "perdu" },
    { date: "04/12", odds: 1.99, stake: 7.07, result: "perdu" },
  ]},

  // === AJORQUE - Buteur (abandonnée) ===
  { subject: "Ajorque", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "23/11", odds: 2.52, stake: 0.49, result: "perdu" },
    { date: "02/12", odds: 3.10, stake: 0.95, result: "perdu" },
    { date: "05/12", odds: 2.95, stake: 1.89, result: "perdu" },
  ]},

  // === GIROUD - Buteur ===
  { subject: "Giroud", bet_type: "buteur", status: "gagnee", bets: [
    { date: "18/09", odds: 3.40, stake: 0.42, result: "gagne" },
  ]},
  { subject: "Giroud", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "19/10", odds: 2.40, stake: 0.71, result: "perdu" },
    { date: "24/10", odds: 2.55, stake: 1.75, result: "perdu" },
    { date: "29/10", odds: 8.00, stake: 0.80, result: "perdu" },
    { date: "02/11", odds: 2.40, stake: 4.45, result: "perdu" },
    { date: "09/11", odds: 2.65, stake: 5.30, result: "perdu" },
  ]},

  // === NEWCASTLE - Victoire (abandonnée) ===
  { subject: "Newcastle", bet_type: "victoire", status: "abandonnee", bets: [
    { date: "18/09", odds: 2.08, stake: 0.93, result: "perdu" },
  ]},

  // === GAKPO - Buteur (abandonnée) ===
  { subject: "Gakpo", bet_type: "buteur", status: "abandonnee", bets: [
    { date: "18/09", odds: 3.00, stake: 0.50, result: "perdu" },
    { date: "18/09", odds: 3.45, stake: 1.02, result: "perdu" },
    { date: "20/09", odds: 3.35, stake: 1.92, result: "perdu" },
  ]},

  // === DJOKOVIC - Victoire (abandonnée) ===
  { subject: "Djokovic", bet_type: "victoire", status: "abandonnee", bets: [
    { date: "07/10", odds: 4.20, stake: 0.16, result: "perdu" },
    { date: "07/10", odds: 5.60, stake: 0.26, result: "perdu" },
    { date: "07/10", odds: 4.10, stake: 0.62, result: "perdu" },
    { date: "07/10", odds: 3.85, stake: 1.10, result: "perdu" },
    { date: "07/10", odds: 6.80, stake: 0.90, result: "perdu" },
  ]},
];

async function seed() {
  console.log("Looking up user rranquet@gmail.com...");

  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) { console.error("Error:", userError); return; }

  const user = users.users.find((u) => u.email === "rranquet@gmail.com");
  if (!user) { console.error("User not found!"); return; }

  const userId = user.id;
  console.log(`Found user: ${userId}`);
  console.log(`Importing ${allSeries.length} series...`);

  let seriesCount = 0;
  let betsCount = 0;

  for (const s of allSeries) {
    // target_gain = stake_1 * (odds_1 - 1) for the first bet
    const firstBet = s.bets[0];
    const targetGain = Math.round(firstBet.stake * (firstBet.odds - 1) * 100) / 100;
    const createdAt = toISO(firstBet.date);

    const { data: seriesRow, error: seriesError } = await supabase
      .from("series")
      .insert({
        user_id: userId,
        subject: s.subject,
        bet_type: s.bet_type,
        target_gain: targetGain,
        status: s.status,
        created_at: createdAt,
      })
      .select()
      .single();

    if (seriesError) {
      console.error(`Error inserting series "${s.subject}":`, seriesError.message);
      continue;
    }

    seriesCount++;

    for (let i = 0; i < s.bets.length; i++) {
      const b = s.bets[i];
      const sumPrevStakes = s.bets.slice(0, i).reduce((sum, prev) => sum + prev.stake, 0);
      const potentialNet = Math.round((b.stake * b.odds - b.stake - sumPrevStakes) * 100) / 100;

      const { error: betError } = await supabase.from("bets").insert({
        series_id: seriesRow.id,
        bet_number: i + 1,
        odds: b.odds,
        stake: b.stake,
        potential_net: potentialNet,
        result: b.result,
        created_at: toISO(b.date),
      });

      if (betError) {
        console.error(`Error inserting bet #${i + 1} for "${s.subject}":`, betError.message);
      } else {
        betsCount++;
      }
    }
  }

  console.log(`\nDone! Inserted ${seriesCount} series and ${betsCount} bets.`);
}

seed().catch(console.error);
