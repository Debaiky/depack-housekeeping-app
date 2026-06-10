import { getSheetsClient } from "./google";
import { NA, type RatingValue } from "./areas";

const SHEET_ID = () => {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEET_ID env var");
  return id;
};

export const SHEETS = {
  USERS: "Users",
  EVALUATIONS: "Evaluations",
  DAILY_SUMMARY: "DailySummary",
} as const;

export type UserRow = {
  rowNumber: number; // 1-indexed sheet row, for updates
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
};

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.USERS}!A2:D`,
  });

  const rows = res.data.values || [];
  const normalizedEmail = email.trim().toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowEmail = (row[0] || "").trim().toLowerCase();
    if (rowEmail === normalizedEmail) {
      return {
        rowNumber: i + 2,
        email: row[0] || "",
        passwordHash: row[1] || "",
        name: row[2] || "",
        createdAt: row[3] || "",
      };
    }
  }

  return null;
}

export async function setUserPassword(rowNumber: number, passwordHash: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.USERS}!B${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[passwordHash]],
    },
  });

  // Also stamp createdAt if empty
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.USERS}!D${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[new Date().toISOString()]],
    },
  });
}

export type EvaluationRow = {
  date: string;
  timestamp: string;
  userEmail: string;
  areaId: string;
  areaLabel: string;
  rating: RatingValue;
  photoUrl: string;
  ratingType: "area" | "machine";
  responsiblePerson: string;
};

export async function appendEvaluationRows(rows: EvaluationRow[]) {
  if (rows.length === 0) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.EVALUATIONS}!A:I`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows.map((r) => [
        r.date,
        r.timestamp,
        r.userEmail,
        r.areaId,
        r.areaLabel,
        r.rating,
        r.photoUrl,
        r.ratingType,
        r.responsiblePerson,
      ]),
    },
  });
}

export type PersonAverage = {
  person: string;
  avgScore: number;
  ratedCount: number;
};

export async function getMachineRatingsByPerson(): Promise<PersonAverage[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.EVALUATIONS}!A2:I`,
  });

  const rows = res.data.values || [];
  const totals = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const ratingType = row[7];
    const responsiblePerson = (row[8] || "").trim();
    const ratingRaw = row[5];

    if (ratingType !== "machine" || !responsiblePerson || ratingRaw === NA) continue;

    const rating = Number(ratingRaw);
    if (!Number.isFinite(rating)) continue;

    const entry = totals.get(responsiblePerson) || { sum: 0, count: 0 };
    entry.sum += rating;
    entry.count += 1;
    totals.set(responsiblePerson, entry);
  }

  return Array.from(totals.entries())
    .map(([person, { sum, count }]) => ({
      person,
      avgScore: sum / count,
      ratedCount: count,
    }))
    .sort((a, b) => a.avgScore - b.avgScore);
}

export type DailySummaryRowFull = {
  date: string;
  totalScore: number;
  avgScore: number;
  status: string;
  submittedBy: string;
  ratedCount: number;
};

export async function appendDailySummary(row: DailySummaryRowFull) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.DAILY_SUMMARY}!A:F`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[row.date, row.totalScore, row.avgScore, row.status, row.submittedBy, row.ratedCount]],
    },
  });
}

export async function getDailySummaries(): Promise<DailySummaryRowFull[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.DAILY_SUMMARY}!A2:F`,
  });

  const rows = res.data.values || [];
  return rows
    .filter((row) => row[0])
    .map((row) => ({
      date: row[0],
      totalScore: Number(row[1]),
      avgScore: Number(row[2]),
      status: row[3],
      submittedBy: row[4] || "",
      ratedCount: Number(row[5] || 0),
    }));
}

export async function getSubmissionForDate(date: string): Promise<DailySummaryRowFull | null> {
  const summaries = await getDailySummaries();
  return summaries.find((s) => s.date === date) || null;
}
