import { google } from "googleapis";

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars"
    );
  }

  return {
    client_email: email,
    // Vercel/most env stores escape newlines as \n
    private_key: key.replace(/\\n/g, "\n"),
  };
}

export function getAuth() {
  const credentials = getCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}
