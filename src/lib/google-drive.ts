/**
 * Client-Side Google Drive Direct Export Utility.
 * Uses Google Identity Services (GIS) token client with 'drive.file' scope.
 * Uploads photos directly from browser to the user's personal Google Drive.
 */

export interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

/**
 * Builds standard Google Drive multipart upload body.
 * Pure function designed for deterministic unit testing.
 */
export function buildMultipartBody(
  metadata: Record<string, unknown>,
  fileBlob: Blob,
  boundary: string
): Blob {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  return new Blob(
    [
      delimiter,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      delimiter,
      "Content-Type: image/png\r\n\r\n",
      fileBlob,
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );
}

/**
 * Loads the official Google Identity Services script if not already present.
 */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-gis-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Prompts user with Google OAuth popup for least-privileged drive.file scope.
 */
export function requestGoogleDriveToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google Identity client is not loaded."));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (resp) => {
          if (resp.error) {
            reject(
              new Error(resp.error_description ?? `Google OAuth error: ${resp.error}`)
            );
          } else if (resp.access_token) {
            resolve(resp.access_token);
          } else {
            reject(new Error("No access token received from Google."));
          }
        },
        error_callback: (err) => {
          reject(new Error(err instanceof Error ? err.message : "Authorization failed"));
        },
      });

      client.requestAccessToken({ prompt: "consent" });
    } catch (err: unknown) {
      reject(err instanceof Error ? err : new Error("Failed to initialize Google token client"));
    }
  });
}

/**
 * Uploads keepsake image directly to user's Google Drive.
 */
export async function uploadKeepsakeToGoogleDrive(
  accessToken: string,
  imageBlob: Blob,
  filename: string
): Promise<GoogleDriveUploadResult> {
  try {
    const boundary =
      "memento_booth_boundary_" + Math.random().toString(36).substring(2, 10);
    const metadata = {
      name: filename,
      mimeType: "image/png",
      description: "Created with Memento Booth - Couple Photobooth",
    };

    const body = buildMultipartBody(metadata, imageBlob, boundary);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Google Drive API error (${res.status}): ${errText}`,
      };
    }

    const data: { id?: string; webViewLink?: string } = await res.json();
    if (!data.id) {
      return { success: false, error: "Missing file ID in Google Drive response" };
    }

    return {
      success: true,
      fileId: data.id,
      webViewLink: data.webViewLink ?? `https://drive.google.com/file/d/${data.id}/view`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown upload error",
    };
  }
}

