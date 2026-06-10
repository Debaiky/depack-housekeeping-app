import { google } from "googleapis";

function getCredentials() {
  const encodedKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

  if (encodedKey) {
    const json = JSON.parse(
      Buffer.from(encodedKey, "base64").toString("utf-8")
    );
    return {
      client_email: json.client_email,
      private_key: json.private_key,
    };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 (or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) env vars"
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
