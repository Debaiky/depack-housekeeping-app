import { getSheetsClient } from "./google";
import { NA, type EvalCategory, type RatingValue } from "./areas";

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
  rowNumber: number;
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
  const normalized = email.trim().toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if ((row[0] || "").trim().toLowerCase() === normalized) {
      return { rowNumber: i + 2, email: row[0] || "", passwordHash: row[1] || "", name: row[2] || "", createdAt: row[3] || "" };
    }
  }
  return null;
}

export async function setUserPassword(rowNumber: number, passwordHash: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID(), range: `${SHEETS.USERS}!B${rowNumber}`, valueInputOption: "RAW", requestBody: { values: [[passwordHash]] } });
  await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID(), range: `${SHEETS.USERS}!D${rowNumber}`, valueInputOption: "RAW", requestBody: { values: [[new Date().toISOString()]] } });
}

// Column layout for Evaluations sheet:
// A=date B=timestamp C=userEmail D=areaId E=areaLabel F=rating
// G=photoUrl H=ratingType I=responsiblePerson J=note K=category
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
  note: string;
  category: EvalCategory;
};

export async function appendEvaluationRows(rows: EvaluationRow[]) {
  if (rows.length === 0) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.EVALUATIONS}!A:K`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows.map((r) => [
        r.date, r.timestamp, r.userEmail, r.areaId, r.areaLabel,
        r.rating, r.photoUrl, r.ratingType, r.responsiblePerson, r.note, r.category,
      ]),
    },
  });
}

export type PersonAverage = { person: string; avgScore: number; ratedCount: number };

export async function getMachineRatingsByPerson(): Promise<PersonAverage[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.EVALUATIONS}!A2:K` });
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
    .map(([person, { sum, count }]) => ({ person, avgScore: sum / count, ratedCount: count }))
    .sort((a, b) => a.avgScore - b.avgScore);
}

export type AreaEvaluationDetail = {
  date: string;
  userEmail: string;
  rating: RatingValue | null;
  photoUrl: string;
  ratingType: "area" | "machine";
  responsiblePerson: string;
  note: string;
  category: EvalCategory;
};

export async function getAreaEvaluationDetails(
  areaId: string, dateFrom: string, dateTo: string
): Promise<AreaEvaluationDetail[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.EVALUATIONS}!A2:K` });
  const rows = res.data.values || [];
  const details: AreaEvaluationDetail[] = [];
  for (const row of rows) {
    const date = row[0];
    if (!date || date < dateFrom || date > dateTo) continue;
    if (row[3] !== areaId) continue;
    const ratingRaw = row[5];
    const rating = ratingRaw === NA ? NA : Number.isFinite(Number(ratingRaw)) ? (Number(ratingRaw) as RatingValue) : null;
    details.push({
      date, userEmail: row[2] || "", rating, photoUrl: row[6] || "",
      ratingType: row[7] === "machine" ? "machine" : "area",
      responsiblePerson: (row[8] || "").trim(),
      note: (row[9] || "").trim(),
      category: (row[10] as EvalCategory) || "hygiene",
    });
  }
  return details.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export type AreaRatingSummary = {
  areaId: string;
  avgScore: number | null;       // overall avg across all categories
  ratedCount: number;
  hygieneAvg: number | null;
  safetyAvg: number | null;
  infraAvg: number | null;
  machineAvgScore: number | null; // hygiene machine avg
  machineRatedCount: number;
  responsiblePerson?: string;
  note?: string;
};

export async function getAreaRatingsForDateRange(
  dateFrom: string, dateTo: string
): Promise<Record<string, AreaRatingSummary>> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.EVALUATIONS}!A2:K` });
  const rows = res.data.values || [];
  const result: Record<string, AreaRatingSummary> = {};
  const latestNoteDate: Record<string, string> = {};
  // Accumulators for per-category averages
  const catSums: Record<string, { hygiene: number; hygieneN: number; safety: number; safetyN: number; infra: number; infraN: number; machine: number; machineN: number; total: number; totalN: number }> = {};

  for (const row of rows) {
    const date = row[0];
    if (!date || date < dateFrom || date > dateTo) continue;
    const areaId = row[3];
    const ratingRaw = row[5];
    const ratingType: "area" | "machine" = row[7] === "machine" ? "machine" : "area";
    const responsiblePerson = (row[8] || "").trim();
    const note = (row[9] || "").trim();
    const category: EvalCategory = (row[10] as EvalCategory) || "hygiene";

    if (!result[areaId]) {
      result[areaId] = { areaId, avgScore: null, ratedCount: 0, hygieneAvg: null, safetyAvg: null, infraAvg: null, machineAvgScore: null, machineRatedCount: 0 };
      catSums[areaId] = { hygiene: 0, hygieneN: 0, safety: 0, safetyN: 0, infra: 0, infraN: 0, machine: 0, machineN: 0, total: 0, totalN: 0 };
    }
    const entry = result[areaId];
    const acc = catSums[areaId];

    if (note && ratingType === "area" && (!latestNoteDate[areaId] || date > latestNoteDate[areaId])) {
      entry.note = note;
      latestNoteDate[areaId] = date;
    }
    if (responsiblePerson && ratingType === "machine") entry.responsiblePerson = responsiblePerson;

    if (ratingRaw === NA) continue;
    const rating = Number(ratingRaw);
    if (!Number.isFinite(rating)) continue;

    if (ratingType === "area") {
      acc.total += rating; acc.totalN += 1;
      if (category === "hygiene") { acc.hygiene += rating; acc.hygieneN += 1; }
      else if (category === "safety") { acc.safety += rating; acc.safetyN += 1; }
      else if (category === "infrastructure") { acc.infra += rating; acc.infraN += 1; }
    } else {
      // machine rows: only track hygiene machine avg for legacy map display
      if (category === "hygiene") { acc.machine += rating; acc.machineN += 1; }
    }
  }

  for (const areaId of Object.keys(result)) {
    const acc = catSums[areaId];
    const e = result[areaId];
    e.avgScore = acc.totalN > 0 ? acc.total / acc.totalN : null;
    e.ratedCount = acc.totalN;
    e.hygieneAvg = acc.hygieneN > 0 ? acc.hygiene / acc.hygieneN : null;
    e.safetyAvg = acc.safetyN > 0 ? acc.safety / acc.safetyN : null;
    e.infraAvg = acc.infraN > 0 ? acc.infra / acc.infraN : null;
    e.machineAvgScore = acc.machineN > 0 ? acc.machine / acc.machineN : null;
    e.machineRatedCount = acc.machineN;
  }

  return result;
}

export type AreaPerformance = { areaId: string; areaLabel: string; avgScore: number; ratedCount: number };

export async function getAreaPerformance(days: number): Promise<AreaPerformance[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.EVALUATIONS}!A2:K` });
  const rows = res.data.values || [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const totals = new Map<string, { sum: number; count: number; label: string }>();
  for (const row of rows) {
    const date = row[0];
    const areaId = row[3];
    const areaLabel = row[4];
    const ratingRaw = row[5];
    const ratingType = row[7];
    if (ratingType !== "area" || ratingRaw === NA || !date || date < cutoffStr) continue;
    const rating = Number(ratingRaw);
    if (!Number.isFinite(rating)) continue;
    const entry = totals.get(areaId) || { sum: 0, count: 0, label: areaLabel };
    entry.sum += rating; entry.count += 1;
    totals.set(areaId, entry);
  }
  return Array.from(totals.entries())
    .map(([areaId, { sum, count, label }]) => ({ areaId, areaLabel: label, avgScore: sum / count, ratedCount: count }))
    .sort((a, b) => a.avgScore - b.avgScore);
}

// DailySummary columns: A=date B=totalScore C=avgScore D=status E=submittedBy F=ratedCount G=hygieneAvg H=safetyAvg I=infraAvg
export type DailySummaryRowFull = {
  date: string;
  totalScore: number;
  avgScore: number;
  status: string;
  submittedBy: string;
  ratedCount: number;
  hygieneAvg?: number;
  safetyAvg?: number;
  infraAvg?: number;
};

export async function appendDailySummary(row: DailySummaryRowFull) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${SHEETS.DAILY_SUMMARY}!A:I`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        row.date, row.totalScore, row.avgScore, row.status, row.submittedBy, row.ratedCount,
        row.hygieneAvg ?? "", row.safetyAvg ?? "", row.infraAvg ?? "",
      ]],
    },
  });
}

export async function getDailySummaries(): Promise<DailySummaryRowFull[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.DAILY_SUMMARY}!A2:I` });
  const rows = res.data.values || [];
  return rows.filter((row) => row[0]).map((row) => ({
    date: row[0],
    totalScore: Number(row[1]),
    avgScore: Number(row[2]),
    status: row[3],
    submittedBy: row[4] || "",
    ratedCount: Number(row[5] || 0),
    hygieneAvg: row[6] ? Number(row[6]) : undefined,
    safetyAvg: row[7] ? Number(row[7]) : undefined,
    infraAvg: row[8] ? Number(row[8]) : undefined,
  }));
}

export async function getSubmissionForDate(date: string): Promise<DailySummaryRowFull | null> {
  const summaries = await getDailySummaries();
  return summaries.find((s) => s.date === date) || null;
}

export async function getSubmissionForUserAndDate(date: string, email: string): Promise<DailySummaryRowFull | null> {
  const summaries = await getDailySummaries();
  const normalized = email.trim().toLowerCase();
  return summaries.find((s) => s.date === date && s.submittedBy.trim().toLowerCase() === normalized) || null;
}

export type UserRatingSummary = { email: string; name: string; totalCount: number; weekCount: number; monthCount: number };

export async function getUserRatingSummaries(): Promise<UserRatingSummary[]> {
  const sheets = getSheetsClient();
  const [usersRes, summaryRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.USERS}!A2:C` }),
    sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.DAILY_SUMMARY}!A2:E` }),
  ]);
  const userRows = usersRes.data.values || [];
  const summaryRows = summaryRes.data.values || [];

  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const dayOfWeek = (today.getDay() + 6) % 7;
  const weekStartDate = new Date(today);
  weekStartDate.setDate(today.getDate() - dayOfWeek);
  const weekStart = weekStartDate.toISOString().slice(0, 10);

  // Count distinct submissions (by date) per user from DailySummary
  const counts = new Map<string, { total: number; week: number; month: number }>();
  for (const row of summaryRows) {
    const date = row[0];
    const email = (row[4] || "").trim().toLowerCase();
    if (!email || !date) continue;
    const entry = counts.get(email) || { total: 0, week: 0, month: 0 };
    entry.total += 1;
    if (date >= weekStart) entry.week += 1;
    if (date >= monthStart) entry.month += 1;
    counts.set(email, entry);
  }

  return userRows.filter((row) => row[0]).map((row) => {
    const email = (row[0] || "").trim().toLowerCase();
    const c = counts.get(email) || { total: 0, week: 0, month: 0 };
    return { email: row[0], name: row[2] || "", totalCount: c.total, weekCount: c.week, monthCount: c.month };
  });
}

export type UserDayRating = { date: string; totalScore: number; avgScore: number; ratedCount: number };

export async function getUserDailyRatings(email: string): Promise<UserDayRating[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: `${SHEETS.DAILY_SUMMARY}!A2:F` });
  const rows = res.data.values || [];
  const normalized = email.trim().toLowerCase();
  return rows
    .filter((row) => row[0] && (row[4] || "").trim().toLowerCase() === normalized)
    .map((row) => ({ date: row[0], totalScore: Number(row[1]), avgScore: Number(row[2]), ratedCount: Number(row[5] || 0) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
