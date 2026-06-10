import { Readable } from "stream";
import { getDriveClient } from "./google";

const ROOT_FOLDER_ID = () => {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID env var");
  return id;
};

async function getOrCreateDateFolder(date: string): Promise<string> {
  const drive = getDriveClient();
  const parent = ROOT_FOLDER_ID();

  const existing = await drive.files.list({
    q: `'${parent}' in parents and name = '${date}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id as string;
  }

  const created = await drive.files.create({
    requestBody: {
      name: date,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return created.data.id as string;
}

export async function uploadEvaluationPhoto(opts: {
  date: string;
  areaId: string;
  userEmail: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<string> {
  const drive = getDriveClient();
  const folderId = await getOrCreateDateFolder(opts.date);

  const ext = opts.mimeType.split("/")[1] || "jpg";
  const safeUser = opts.userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${opts.date}_${opts.areaId}_${safeUser}.${ext}`;

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: opts.mimeType,
      body: Readable.from(opts.buffer),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const fileId = created.data.id as string;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
    supportsAllDrives: true,
  });

  const file = await drive.files.get({
    fileId,
    fields: "webViewLink",
    supportsAllDrives: true,
  });

  return file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
}
