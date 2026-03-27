import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Dates in the input are YYYY-DD-MM, convert to proper ISO
function parseDate(d: string): string {
  const [year, day, month] = d.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00Z`;
}

const data = {
  "series": [
    {
      "subject": "Cherki",
      "bet_type": "buteur",
      "target_gain": 6.27,
      "status": "gagnee",
      "bets": [
        { "date": "2025-12-03", "odds": 12.0, "stake": 0.57, "result": "perdu" },
        { "date": "2026-04-03", "odds": 6.5, "stake": 0.81, "result": "perdu" },
        { "date": "2025-21-02", "odds": 5.0, "stake": 0.69, "result": "perdu" },
        { "date": "2025-14-02", "odds": 2.35, "stake": 0.74, "result": "perdu" },
        { "date": "2025-20-01", "odds": 3.25, "stake": 1.92, "result": "gagne" }
      ]
    },
    {
      "subject": "Cherki",
      "bet_type": "buteur",
      "target_gain": 2.38,
      "status": "gagnee",
      "bets": [
        { "date": "2026-07-01", "odds": 3.5, "stake": 0.95, "result": "perdu" },
        { "date": "2026-01-01", "odds": 3.7, "stake": 0.37, "result": "perdu" },
        { "date": "2025-14-12", "odds": 2.15, "stake": 2.3, "result": "gagne" }
      ]
    },
    {
      "subject": "Cherki",
      "bet_type": "buteur",
      "target_gain": 1.01,
      "status": "en_cours",
      "bets": [
        { "date": "2025-14-12", "odds": 2.55, "stake": 0.65, "result": "perdu" }
      ]
    },
    {
      "subject": "Dembélé",
      "bet_type": "buteur",
      "target_gain": 0.99,
      "status": "gagnee",
      "bets": [
        { "date": "2025-11-03", "odds": 4.1, "stake": 0.32, "result": "gagne" }
      ]
    },
    {
      "subject": "Dembélé",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-13-02", "odds": 2.0, "stake": 1.0, "result": "gagne" }
      ]
    },
    {
      "subject": "Dembélé",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-10", "odds": 3.5, "stake": 0.4, "result": "gagne" }
      ]
    },
    {
      "subject": "Dembélé",
      "bet_type": "buteur",
      "target_gain": 4.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.94, "stake": 4.26, "result": "gagne" }
      ]
    },
    {
      "subject": "Dembélé",
      "bet_type": "buteur",
      "target_gain": 2.9,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.45, "stake": 2.0, "result": "perdu" }
      ]
    },
    {
      "subject": "Marseille",
      "bet_type": "victoire",
      "target_gain": 20.79,
      "status": "gagnee",
      "bets": [
        { "date": "2026-08-03", "odds": 2.33, "stake": 15.63, "result": "gagne" }
      ]
    },
    {
      "subject": "Marseille",
      "bet_type": "victoire",
      "target_gain": 7.65,
      "status": "gagnee",
      "bets": [
        { "date": "2026-04-03", "odds": 1.63, "stake": 12.14, "result": "perdu" },
        { "date": "2025-21-02", "odds": 1.9, "stake": 3.5, "result": "perdu" },
        { "date": "2025-14-02", "odds": 1.87, "stake": 1.15, "result": "perdu" },
        { "date": "2025-21-11", "odds": 1.91, "stake": 0.55, "result": "gagne" }
      ]
    },
    {
      "subject": "Marseille",
      "bet_type": "victoire",
      "target_gain": 0.5,
      "status": "gagnee",
      "bets": [
        { "date": "2026-02-11", "odds": 1.55, "stake": 0.91, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 3.47,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-02", "odds": 1.67, "stake": 5.18, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-02", "odds": 1.68, "stake": 1.47, "result": "perdu" },
        { "date": "2025-14-12", "odds": 1.58, "stake": 1.72, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2026-04-12", "odds": 1.7, "stake": 1.43, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 22.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-26-11", "odds": 1.6, "stake": 36.67, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 3.82,
      "status": "gagnee",
      "bets": [
        { "date": "2025-23-11", "odds": 1.32, "stake": 11.94, "result": "perdu" },
        { "date": "2025-09-11", "odds": 1.55, "stake": 1.82, "result": "perdu" },
        { "date": "2025-26-10", "odds": 1.88, "stake": 2.73, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-22-10", "odds": 3.5, "stake": 0.4, "result": "perdu" },
        { "date": "2025-18-09", "odds": 1.55, "stake": 6.0, "result": "gagne" }
      ]
    },
    {
      "subject": "Real",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.78, "stake": 1.28, "result": "perdu" }
      ]
    },
    {
      "subject": "Kvaratskhelia",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-02", "odds": 2.03, "stake": 0.97, "result": "gagne" }
      ]
    },
    {
      "subject": "Kvaratskhelia",
      "bet_type": "buteur",
      "target_gain": 2.67,
      "status": "gagnee",
      "bets": [
        { "date": "2025-20-01", "odds": 2.72, "stake": 1.55, "result": "gagne" }
      ]
    },
    {
      "subject": "Kvaratskhelia",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-17-01", "odds": 2.52, "stake": 0.66, "result": "perdu" },
        { "date": "2025-09-11", "odds": 2.68, "stake": 0.6, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 8.05,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-02", "odds": 1.4, "stake": 20.13, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 3.22,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-02", "odds": 1.84, "stake": 3.83, "result": "perdu" },
        { "date": "2025-13-02", "odds": 1.82, "stake": 1.22, "result": "perdu" },
        { "date": "2025-24-01", "odds": 1.28, "stake": 11.61, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-01", "odds": 1.8, "stake": 1.25, "result": "perdu" },
        { "date": "2025-14-12", "odds": 1.23, "stake": 11.87, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-14-12", "odds": 1.82, "stake": 1.22, "result": "perdu" },
        { "date": "2025-09-11", "odds": 1.78, "stake": 1.28, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2026-01-11", "odds": 2.25, "stake": 0.8, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 7.7,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-10", "odds": 1.55, "stake": 14.0, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 3.05,
      "status": "gagnee",
      "bets": [
        { "date": "2025-17-10", "odds": 1.66, "stake": 4.62, "result": "perdu" },
        { "date": "2026-05-10", "odds": 1.95, "stake": 1.05, "result": "perdu" },
        { "date": "2026-01-10", "odds": 3.5, "stake": 0.4, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 5.07,
      "status": "gagnee",
      "bets": [
        { "date": "2025-27-09", "odds": 1.39, "stake": 13.0, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-22-09", "odds": 1.75, "stake": 1.33, "result": "perdu" },
        { "date": "2025-22-09", "odds": 2.35, "stake": 0.74, "result": "perdu" },
        { "date": "2025-18-09", "odds": 1.64, "stake": 1.56, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 5.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.94, "stake": 5.32, "result": "gagne" }
      ]
    },
    {
      "subject": "PSG",
      "bet_type": "victoire",
      "target_gain": 2.7,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.9, "stake": 3.0, "result": "perdu" }
      ]
    },
    {
      "subject": "Doué",
      "bet_type": "buteur",
      "target_gain": 2.8,
      "status": "gagnee",
      "bets": [
        { "date": "2025-17-02", "odds": 2.52, "stake": 1.84, "result": "gagne" }
      ]
    },
    {
      "subject": "Doué",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-13-02", "odds": 2.25, "stake": 0.8, "result": "perdu" }
      ]
    },
    {
      "subject": "J. Alvarez",
      "bet_type": "buteur",
      "target_gain": 96.28,
      "status": "gagnee",
      "bets": [
        { "date": "2025-12-02", "odds": 2.5, "stake": 64.19, "result": "gagne" }
      ]
    },
    {
      "subject": "J. Alvarez",
      "bet_type": "buteur",
      "target_gain": 49.6,
      "status": "gagnee",
      "bets": [
        { "date": "2025-12-02", "odds": 2.08, "stake": 45.93, "result": "perdu" },
        { "date": "2025-31-01", "odds": 2.7, "stake": 18.09, "result": "perdu" },
        { "date": "2025-31-01", "odds": 2.22, "stake": 13.52, "result": "perdu" },
        { "date": "2025-25-01", "odds": 1.99, "stake": 7.91, "result": "perdu" },
        { "date": "2025-21-01", "odds": 2.5, "stake": 2.83, "result": "perdu" },
        { "date": "2025-20-01", "odds": 2.16, "stake": 1.62, "result": "perdu" },
        { "date": "2025-17-01", "odds": 2.98, "stake": 0.38, "result": "perdu" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 41.24,
      "status": "gagnee",
      "bets": [
        { "date": "2025-31-01", "odds": 1.96, "stake": 42.96, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 11.7,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-01", "odds": 1.41, "stake": 28.54, "result": "perdu" },
        { "date": "2025-20-01", "odds": 1.41, "stake": 7.59, "result": "perdu" },
        { "date": "2025-18-01", "odds": 1.9, "stake": 1.11, "result": "perdu" },
        { "date": "2026-07-01", "odds": 1.48, "stake": 23.92, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 3.72,
      "status": "gagnee",
      "bets": [
        { "date": "2026-07-01", "odds": 1.55, "stake": 6.76, "result": "perdu" },
        { "date": "2026-01-01", "odds": 1.58, "stake": 1.72, "result": "perdu" },
        { "date": "2026-02-12", "odds": 1.64, "stake": 65.23, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 12.45,
      "status": "gagnee",
      "bets": [
        { "date": "2025-29-11", "odds": 1.44, "stake": 28.3, "result": "perdu" },
        { "date": "2025-25-11", "odds": 1.41, "stake": 8.12, "result": "perdu" },
        { "date": "2025-22-11", "odds": 1.75, "stake": 1.33, "result": "perdu" },
        { "date": "2026-02-11", "odds": 1.96, "stake": 4.85, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 2.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-26-10", "odds": 1.75, "stake": 2.66, "result": "perdu" },
        { "date": "2025-21-10", "odds": 1.6, "stake": 1.66, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2026-05-10", "odds": 1.75, "stake": 1.33, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2026-01-10", "odds": 1.55, "stake": 1.81, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-27-09", "odds": 2.2, "stake": 0.83, "result": "gagne" }
      ]
    },
    {
      "subject": "Haaland",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.78, "stake": 1.28, "result": "gagne" }
      ]
    },
    {
      "subject": "Olise",
      "bet_type": "buteur",
      "target_gain": 21.61,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-12", "odds": 2.35, "stake": 16.01, "result": "gagne" }
      ]
    },
    {
      "subject": "Olise",
      "bet_type": "buteur",
      "target_gain": 10.15,
      "status": "gagnee",
      "bets": [
        { "date": "2025-14-12", "odds": 1.97, "stake": 10.46, "result": "perdu" },
        { "date": "2025-09-12", "odds": 2.37, "stake": 3.86, "result": "perdu" },
        { "date": "2026-06-12", "odds": 2.62, "stake": 1.64, "result": "perdu" },
        { "date": "2026-03-12", "odds": 2.55, "stake": 0.65, "result": "perdu" },
        { "date": "2025-22-11", "odds": 2.45, "stake": 0.69, "result": "gagne" }
      ]
    },
    {
      "subject": "Olise",
      "bet_type": "buteur",
      "target_gain": 2.7,
      "status": "gagnee",
      "bets": [
        { "date": "2025-13-11", "odds": 2.6, "stake": 1.69, "result": "gagne" }
      ]
    },
    {
      "subject": "Olise",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2026-08-11", "odds": 2.41, "stake": 0.71, "result": "perdu" },
        { "date": "2025-30-10", "odds": 2.29, "stake": 2.1, "result": "gagne" }
      ]
    },
    {
      "subject": "Olise",
      "bet_type": "buteur",
      "target_gain": 0.99,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-10", "odds": 2.4, "stake": 0.71, "result": "perdu" },
        { "date": "2025-30-09", "odds": 2.4, "stake": 1.79, "result": "gagne" }
      ]
    },
    {
      "subject": "Olise",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-27-09", "odds": 3.0, "stake": 0.5, "result": "perdu" },
        { "date": "2025-18-09", "odds": 2.58, "stake": 0.63, "result": "gagne" }
      ]
    },
    {
      "subject": "Bayern",
      "bet_type": "defaite",
      "target_gain": 2.31,
      "status": "gagnee",
      "bets": [
        { "date": "2026-08-11", "odds": 4.3, "stake": 0.7, "result": "gagne" }
      ]
    },
    {
      "subject": "Bayern",
      "bet_type": "defaite",
      "target_gain": 0.99,
      "status": "gagnee",
      "bets": [
        { "date": "2026-02-11", "odds": 4.3, "stake": 0.3, "result": "perdu" }
      ]
    },
    {
      "subject": "Gyokeres",
      "bet_type": "buteur",
      "target_gain": 2.92,
      "status": "gagnee",
      "bets": [
        { "date": "2025-20-12", "odds": 2.58, "stake": 1.85, "result": "gagne" }
      ]
    },
    {
      "subject": "Gyokeres",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-14-12", "odds": 2.08, "stake": 0.93, "result": "perdu" },
        { "date": "2026-01-11", "odds": 1.97, "stake": 0.52, "result": "gagne" }
      ]
    },
    {
      "subject": "Gyokeres",
      "bet_type": "buteur",
      "target_gain": 11.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-10", "odds": 2.1, "stake": 10.0, "result": "gagne" }
      ]
    },
    {
      "subject": "Gyokeres",
      "bet_type": "buteur",
      "target_gain": 5.53,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-10", "odds": 2.08, "stake": 5.12, "result": "perdu" },
        { "date": "2026-04-10", "odds": 1.81, "stake": 2.78, "result": "perdu" },
        { "date": "2026-01-10", "odds": 1.8, "stake": 1.25, "result": "perdu" },
        { "date": "2025-18-09", "odds": 1.89, "stake": 1.12, "result": "gagne" }
      ]
    },
    {
      "subject": "Guirassy",
      "bet_type": "buteur",
      "target_gain": 9.95,
      "status": "gagnee",
      "bets": [
        { "date": "2025-31-10", "odds": 2.4, "stake": 7.11, "result": "gagne" }
      ]
    },
    {
      "subject": "Guirassy",
      "bet_type": "buteur",
      "target_gain": 3.18,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-10", "odds": 1.55, "stake": 5.78, "result": "perdu" },
        { "date": "2025-21-10", "odds": 1.85, "stake": 1.18, "result": "perdu" },
        { "date": "2026-01-10", "odds": 1.9, "stake": 1.11, "result": "gagne" }
      ]
    },
    {
      "subject": "Manchester City",
      "bet_type": "victoire",
      "target_gain": 50.32,
      "status": "gagnee",
      "bets": [
        { "date": "2026-06-12", "odds": 1.6, "stake": 83.87, "result": "gagne" }
      ]
    },
    {
      "subject": "Manchester City",
      "bet_type": "victoire",
      "target_gain": 28.59,
      "status": "gagnee",
      "bets": [
        { "date": "2026-02-12", "odds": 2.38, "stake": 20.72, "result": "perdu" },
        { "date": "2025-29-11", "odds": 1.59, "stake": 17.36, "result": "perdu" },
        { "date": "2025-25-11", "odds": 1.5, "stake": 6.16, "result": "perdu" },
        { "date": "2025-22-11", "odds": 1.93, "stake": 1.08, "result": "perdu" },
        { "date": "2025-18-09", "odds": 1.63, "stake": 4.7, "result": "gagne" }
      ]
    },
    {
      "subject": "Manchester City",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.04, "stake": 0.96, "result": "perdu" }
      ]
    },
    {
      "subject": "L. Martinez",
      "bet_type": "buteur",
      "target_gain": 4.97,
      "status": "gagnee",
      "bets": [
        { "date": "2025-30-11", "odds": 1.95, "stake": 5.23, "result": "gagne" }
      ]
    },
    {
      "subject": "L. Martinez",
      "bet_type": "buteur",
      "target_gain": 2.69,
      "status": "gagnee",
      "bets": [
        { "date": "2025-26-11", "odds": 3.1, "stake": 1.28, "result": "perdu" },
        { "date": "2025-23-11", "odds": 2.45, "stake": 0.69, "result": "perdu" },
        { "date": "2025-09-11", "odds": 2.15, "stake": 2.53, "result": "gagne" }
      ]
    },
    {
      "subject": "L. Martinez",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2026-02-11", "odds": 2.1, "stake": 0.91, "result": "perdu" }
      ]
    },
    {
      "subject": "Manchester United",
      "bet_type": "victoire",
      "target_gain": 7.59,
      "status": "gagnee",
      "bets": [
        { "date": "2025-30-11", "odds": 2.68, "stake": 4.52, "result": "gagne" }
      ]
    },
    {
      "subject": "Manchester United",
      "bet_type": "victoire",
      "target_gain": 3.28,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-11", "odds": 1.86, "stake": 3.81, "result": "perdu" },
        { "date": "2026-08-11", "odds": 2.24, "stake": 1.24, "result": "perdu" },
        { "date": "2026-01-11", "odds": 1.93, "stake": 0.54, "result": "perdu" }
      ]
    },
    {
      "subject": "Lyon",
      "bet_type": "victoire",
      "target_gain": 2.93,
      "status": "gagnee",
      "bets": [
        { "date": "2025-27-11", "odds": 1.65, "stake": 4.51, "result": "gagne" }
      ]
    },
    {
      "subject": "Lyon",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-23-11", "odds": 2.08, "stake": 0.93, "result": "perdu" }
      ]
    },
    {
      "subject": "Arsenal",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-23-11", "odds": 2.25, "stake": 0.8, "result": "gagne" }
      ]
    },
    {
      "subject": "Greenwood",
      "bet_type": "buteur",
      "target_gain": 0.99,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-11", "odds": 2.4, "stake": 0.71, "result": "gagne" }
      ]
    },
    {
      "subject": "Greenwood",
      "bet_type": "buteur",
      "target_gain": 2.72,
      "status": "gagnee",
      "bets": [
        { "date": "2026-08-11", "odds": 2.02, "stake": 2.67, "result": "gagne" }
      ]
    },
    {
      "subject": "Greenwood",
      "bet_type": "buteur",
      "target_gain": 1.01,
      "status": "gagnee",
      "bets": [
        { "date": "2026-06-11", "odds": 2.4, "stake": 0.72, "result": "perdu" }
      ]
    },
    {
      "subject": "Lewandowski",
      "bet_type": "buteur",
      "target_gain": 4.79,
      "status": "gagnee",
      "bets": [
        { "date": "2025-09-11", "odds": 2.04, "stake": 4.61, "result": "gagne" }
      ]
    },
    {
      "subject": "Lewandowski",
      "bet_type": "buteur",
      "target_gain": 3.04,
      "status": "gagnee",
      "bets": [
        { "date": "2026-02-11", "odds": 5.0, "stake": 0.76, "result": "perdu" },
        { "date": "2026-05-10", "odds": 1.97, "stake": 1.03, "result": "perdu" },
        { "date": "2025-28-09", "odds": 1.76, "stake": 1.32, "result": "gagne" }
      ]
    },
    {
      "subject": "Lewandowski",
      "bet_type": "buteur",
      "target_gain": 3.14,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-09", "odds": 1.93, "stake": 3.38, "result": "gagne" }
      ]
    },
    {
      "subject": "Lewandowski",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-22-09", "odds": 1.88, "stake": 1.14, "result": "perdu" }
      ]
    },
    {
      "subject": "Barcola",
      "bet_type": "buteur",
      "target_gain": 17.55,
      "status": "gagnee",
      "bets": [
        { "date": "2025-17-10", "odds": 2.09, "stake": 16.1, "result": "gagne" }
      ]
    },
    {
      "subject": "Barcola",
      "bet_type": "buteur",
      "target_gain": 9.93,
      "status": "gagnee",
      "bets": [
        { "date": "2026-05-10", "odds": 2.5, "stake": 6.62, "result": "perdu" },
        { "date": "2026-01-10", "odds": 3.5, "stake": 2.55, "result": "perdu" },
        { "date": "2025-27-09", "odds": 1.83, "stake": 2.94, "result": "perdu" },
        { "date": "2025-18-09", "odds": 3.3, "stake": 0.44, "result": "perdu" },
        { "date": "2025-18-09", "odds": 2.5, "stake": 0.67, "result": "gagne" }
      ]
    },
    {
      "subject": "Liverpool",
      "bet_type": "victoire",
      "target_gain": 0.5,
      "status": "gagnee",
      "bets": [
        { "date": "2026-02-11", "odds": 1.56, "stake": 0.9, "result": "gagne" }
      ]
    },
    {
      "subject": "Liverpool",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.1, "stake": 0.91, "result": "gagne" }
      ]
    },
    {
      "subject": "Hakimi",
      "bet_type": "buteur",
      "target_gain": 38.75,
      "status": "gagnee",
      "bets": [
        { "date": "2025-25-10", "odds": 8.75, "stake": 5.0, "result": "gagne" }
      ]
    },
    {
      "subject": "Hakimi",
      "bet_type": "buteur",
      "target_gain": 52.34,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-10", "odds": 6.25, "stake": 9.97, "result": "perdu" },
        { "date": "2026-05-10", "odds": 9.0, "stake": 3.03, "result": "perdu" },
        { "date": "2026-05-10", "odds": 5.36, "stake": 5.73, "result": "perdu" },
        { "date": "2026-01-10", "odds": 6.25, "stake": 3.72, "result": "perdu" },
        { "date": "2025-27-09", "odds": 3.8, "stake": 4.88, "result": "perdu" },
        { "date": "2025-22-09", "odds": 6.15, "stake": 2.06, "result": "perdu" },
        { "date": "2025-18-09", "odds": 4.6, "stake": 2.09, "result": "perdu" },
        { "date": "2025-18-09", "odds": 4.3, "stake": 1.52, "result": "perdu" },
        { "date": "2025-18-09", "odds": 4.3, "stake": 1.0, "result": "perdu" },
        { "date": "2025-18-09", "odds": 3.55, "stake": 1.0, "result": "perdu" }
      ]
    },
    {
      "subject": "Yamal",
      "bet_type": "buteur",
      "target_gain": 22.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-10", "odds": 2.1, "stake": 20.0, "result": "gagne" }
      ]
    },
    {
      "subject": "Yamal",
      "bet_type": "buteur",
      "target_gain": 10.11,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-10", "odds": 1.92, "stake": 10.99, "result": "perdu" },
        { "date": "2026-01-10", "odds": 2.82, "stake": 3.23, "result": "perdu" },
        { "date": "2025-28-09", "odds": 2.23, "stake": 2.19, "result": "perdu" },
        { "date": "2025-18-09", "odds": 2.45, "stake": 0.69, "result": "perdu" },
        { "date": "2025-18-09", "odds": 2.13, "stake": 2.65, "result": "gagne" }
      ]
    },
    {
      "subject": "Yamal",
      "bet_type": "buteur",
      "target_gain": 1.3,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.3, "stake": 1.0, "result": "perdu" }
      ]
    },
    {
      "subject": "Lens",
      "bet_type": "victoire",
      "target_gain": 1.02,
      "status": "gagnee",
      "bets": [
        { "date": "2025-19-10", "odds": 1.72, "stake": 1.41, "result": "gagne" }
      ]
    },
    {
      "subject": "Rashford",
      "bet_type": "buteur",
      "target_gain": 2.71,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 3.3, "stake": 1.18, "result": "gagne" }
      ]
    },
    {
      "subject": "Rashford",
      "bet_type": "buteur",
      "target_gain": 1.02,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.41, "stake": 0.72, "result": "perdu" }
      ]
    },
    {
      "subject": "Alcaraz",
      "bet_type": "victoire",
      "target_gain": 2.6,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.86, "stake": 1.4, "result": "gagne" }
      ]
    },
    {
      "subject": "Alcaraz",
      "bet_type": "victoire",
      "target_gain": 1.3,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.62, "stake": 0.8, "result": "perdu" },
        { "date": "2025-18-09", "odds": 2.62, "stake": 0.3, "result": "perdu" }
      ]
    },
    {
      "subject": "Belgique",
      "bet_type": "victoire",
      "target_gain": 0.5,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.0, "stake": 0.5, "result": "gagne" }
      ]
    },
    {
      "subject": "France",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.83, "stake": 1.2, "result": "gagne" }
      ]
    },
    {
      "subject": "France",
      "bet_type": "victoire",
      "target_gain": 0.94,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 1.63, "stake": 1.5, "result": "gagne" }
      ]
    },
    {
      "subject": "US Open",
      "bet_type": "victoire",
      "target_gain": 0.74,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 4.1, "stake": 0.24, "result": "gagne" }
      ]
    },
    {
      "subject": "US Open",
      "bet_type": "victoire",
      "target_gain": 2.56,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.25, "stake": 2.05, "result": "gagne" }
      ]
    },
    {
      "subject": "US Open",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.78, "stake": 0.56, "result": "perdu" }
      ]
    },
    {
      "subject": "Karl",
      "bet_type": "buteur",
      "target_gain": 4.1,
      "status": "abandonnee",
      "bets": [
        { "date": "2025-14-03", "odds": 2.8, "stake": 2.28, "result": "perdu" },
        { "date": "2026-08-03", "odds": 2.22, "stake": 1.51, "result": "perdu" },
        { "date": "2025-14-02", "odds": 3.2, "stake": 0.34, "result": "perdu" }
      ]
    },
    {
      "subject": "Mbappé",
      "bet_type": "buteur",
      "target_gain": 1.01,
      "status": "gagnee",
      "bets": [
        { "date": "2025-21-02", "odds": 2.5, "stake": 0.67, "result": "perdu" },
        { "date": "2025-26-11", "odds": 1.58, "stake": 16.4, "result": "gagne" }
      ]
    },
    {
      "subject": "Mbappé",
      "bet_type": "buteur",
      "target_gain": 2.91,
      "status": "gagnee",
      "bets": [
        { "date": "2025-23-11", "odds": 1.52, "stake": 5.6, "result": "perdu" },
        { "date": "2025-09-11", "odds": 2.1, "stake": 0.91, "result": "perdu" },
        { "date": "2025-26-10", "odds": 1.64, "stake": 4.0, "result": "gagne" }
      ]
    },
    {
      "subject": "Mbappé",
      "bet_type": "buteur",
      "target_gain": 1.0,
      "status": "gagnee",
      "bets": [
        { "date": "2025-23-10", "odds": 3.0, "stake": 0.5, "result": "perdu" },
        { "date": "2025-19-10", "odds": 1.73, "stake": 1.37, "result": "gagne" }
      ]
    },
    {
      "subject": "Mbappé",
      "bet_type": "buteur",
      "target_gain": 1.05,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 3.1, "stake": 0.5, "result": "gagne" }
      ]
    },
    {
      "subject": "Mbappé",
      "bet_type": "buteur",
      "target_gain": 2.5,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.7, "stake": 1.47, "result": "gagne" }
      ]
    },
    {
      "subject": "Mbappé",
      "bet_type": "buteur",
      "target_gain": 1.05,
      "status": "gagnee",
      "bets": [
        { "date": "2025-18-09", "odds": 3.1, "stake": 0.5, "result": "perdu" },
        { "date": "2025-18-09", "odds": 1.61, "stake": 1.64, "result": "gagne" }
      ]
    },
    {
      "subject": "Panichelli",
      "bet_type": "buteur",
      "target_gain": 12.41,
      "status": "abandonnee",
      "bets": [
        { "date": "2025-21-12", "odds": 1.8, "stake": 15.51, "result": "perdu" },
        { "date": "2025-20-12", "odds": 1.8, "stake": 6.34, "result": "perdu" },
        { "date": "2025-14-12", "odds": 2.37, "stake": 1.72, "result": "perdu" },
        { "date": "2025-14-12", "odds": 5.5, "stake": 0.35, "result": "perdu" }
      ]
    },
    {
      "subject": "Salah",
      "bet_type": "buteur",
      "target_gain": 7.0,
      "status": "abandonnee",
      "bets": [
        { "date": "2026-04-12", "odds": 1.99, "stake": 7.07, "result": "perdu" },
        { "date": "2025-26-11", "odds": 1.78, "stake": 3.37, "result": "perdu" },
        { "date": "2025-22-11", "odds": 2.6, "stake": 0.63, "result": "perdu" }
      ]
    },
    {
      "subject": "Ajorque",
      "bet_type": "buteur",
      "target_gain": 3.69,
      "status": "abandonnee",
      "bets": [
        { "date": "2026-05-12", "odds": 2.95, "stake": 1.89, "result": "perdu" },
        { "date": "2026-02-12", "odds": 3.1, "stake": 0.95, "result": "perdu" },
        { "date": "2025-23-11", "odds": 2.52, "stake": 0.49, "result": "perdu" }
      ]
    },
    {
      "subject": "Giroud",
      "bet_type": "buteur",
      "target_gain": 8.74,
      "status": "gagnee",
      "bets": [
        { "date": "2025-09-11", "odds": 2.65, "stake": 5.3, "result": "perdu" },
        { "date": "2026-02-11", "odds": 2.4, "stake": 4.45, "result": "perdu" },
        { "date": "2025-29-10", "odds": 8.0, "stake": 0.8, "result": "perdu" },
        { "date": "2025-24-10", "odds": 2.55, "stake": 1.75, "result": "perdu" },
        { "date": "2025-19-10", "odds": 2.4, "stake": 0.71, "result": "perdu" },
        { "date": "2025-18-09", "odds": 3.4, "stake": 0.42, "result": "gagne" }
      ]
    },
    {
      "subject": "Newcastle",
      "bet_type": "victoire",
      "target_gain": 1.0,
      "status": "abandonnee",
      "bets": [
        { "date": "2025-18-09", "odds": 2.08, "stake": 0.93, "result": "perdu" }
      ]
    },
    {
      "subject": "Gakpo",
      "bet_type": "buteur",
      "target_gain": 4.51,
      "status": "abandonnee",
      "bets": [
        { "date": "2025-20-09", "odds": 3.35, "stake": 1.92, "result": "perdu" },
        { "date": "2025-18-09", "odds": 3.45, "stake": 1.02, "result": "perdu" },
        { "date": "2025-18-09", "odds": 3.0, "stake": 0.5, "result": "perdu" }
      ]
    },
    {
      "subject": "Djokovic",
      "bet_type": "victoire",
      "target_gain": 5.22,
      "status": "abandonnee",
      "bets": [
        { "date": "2026-07-10", "odds": 6.8, "stake": 0.9, "result": "perdu" },
        { "date": "2026-07-10", "odds": 3.85, "stake": 1.1, "result": "perdu" },
        { "date": "2026-07-10", "odds": 4.1, "stake": 0.62, "result": "perdu" },
        { "date": "2026-07-10", "odds": 5.6, "stake": 0.26, "result": "perdu" },
        { "date": "2026-07-10", "odds": 4.2, "stake": 0.16, "result": "perdu" }
      ]
    }
  ]
};

async function seed() {
  console.log("Looking up user rranquet@gmail.com...");

  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error("Error listing users:", userError);
    return;
  }

  const user = users.users.find((u) => u.email === "rranquet@gmail.com");
  if (!user) {
    console.error("User rranquet@gmail.com not found!");
    return;
  }

  const userId = user.id;
  console.log(`Found user: ${userId}`);

  let seriesCount = 0;
  let betsCount = 0;

  for (const s of data.series) {
    const firstBetDate = s.bets.length > 0 ? parseDate(s.bets[s.bets.length - 1].date) : new Date().toISOString();

    const { data: seriesRow, error: seriesError } = await supabase
      .from("series")
      .insert({
        user_id: userId,
        subject: s.subject,
        bet_type: s.bet_type,
        target_gain: s.target_gain,
        status: s.status,
        created_at: firstBetDate,
      })
      .select()
      .single();

    if (seriesError) {
      console.error(`Error inserting series "${s.subject}":`, seriesError.message);
      continue;
    }

    seriesCount++;

    // Bets are listed newest first in the data, reverse for chronological order
    const betsInOrder = [...s.bets].reverse();

    for (let i = 0; i < betsInOrder.length; i++) {
      const b = betsInOrder[i];
      const potentialNet =
        b.stake * b.odds -
        b.stake -
        betsInOrder.slice(0, i).reduce((sum, prev) => sum + prev.stake, 0);

      const { error: betError } = await supabase.from("bets").insert({
        series_id: seriesRow.id,
        bet_number: i + 1,
        odds: b.odds,
        stake: b.stake,
        potential_net: Math.round(potentialNet * 100) / 100,
        result: b.result,
        created_at: parseDate(b.date),
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
