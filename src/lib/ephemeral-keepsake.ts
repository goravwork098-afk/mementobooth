import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";

export interface EphemeralKeepsake {
  token: string;
  roomCode: string;
  frameName: string;
  dataUrl: string;
  createdAt: number;
  expiresAt: number;
  hoursRemaining: number;
}

// 24-hour Time-To-Live for ephemeral keepsakes
export const KEEPSAKE_TTL_MS = 24 * 60 * 60 * 1000;

const keepsakeStore = new Map<string, EphemeralKeepsake>();

export function createEphemeralKeepsake(
  roomCode: string,
  frameName: string,
  dataUrl: string
): string {
  purgeExpiredKeepsakes();

  const token = randomBytes(16).toString("hex");
  const now = Date.now();

  keepsakeStore.set(token, {
    token,
    roomCode,
    frameName,
    dataUrl,
    createdAt: now,
    expiresAt: now + KEEPSAKE_TTL_MS,
    hoursRemaining: 24,
  });

  return token;
}

/**
 * Retrieves an active ephemeral keepsake if within its 24-hour TTL.
 */
export function getEphemeralKeepsake(token: string): EphemeralKeepsake | null {
  purgeExpiredKeepsakes();

  const record = keepsakeStore.get(token);
  if (!record) return null;

  const now = Date.now();
  if (now > record.expiresAt) {
    keepsakeStore.delete(token);
    return null;
  }

  record.hoursRemaining = Math.max(
    1,
    Math.round((record.expiresAt - now) / (1000 * 60 * 60))
  );

  return record;
}

/**
 * Purges expired keepsakes from memory.
 */
export function purgeExpiredKeepsakes(): number {
  const now = Date.now();
  let purged = 0;

  for (const [token, keepsake] of keepsakeStore.entries()) {
    if (now > keepsake.expiresAt) {
      keepsakeStore.delete(token);
      purged++;
    }
  }

  return purged;
}

/**
 * Reset store (for testing).
 */
export function clearAllKeepsakesForTesting(): void {
  keepsakeStore.clear();
}

/**
 * Formats and dispatches transactional keepsake email with high-resolution attachment.
 */
export async function sendKeepsakeEmail({
  recipients,
  imageBuffer,
  roomCode,
  frameName,
}: {
  recipients: string[];
  imageBuffer: Buffer;
  roomCode: string;
  frameName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const emailServer = process.env.AUTH_EMAIL_SERVER;
    const emailFrom =
      process.env.AUTH_EMAIL_FROM ?? "Memento Booth <no-reply@mementobooth.com>";

    if (!emailServer) {
      return {
        success: false,
        error:
          "Email server is not configured. Please use local download or Google Drive save.",
      };
    }

    const transporter = nodemailer.createTransport(emailServer);

    const dateFormatted = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const filename = `memento-booth-${roomCode}.png`;

    const htmlContent = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fffcfd; border: 1px solid #efe8ec; border-radius: 16px; color: #18181b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #db4f70; font-size: 26px; margin: 0 0 6px 0; font-weight: normal;">Memento Booth</h1>
          <p style="color: #706374; font-size: 14px; margin: 0; font-family: sans-serif;">A little date night, no matter the distance.</p>
        </div>
        
        <div style="background: #ffffff; border: 1px solid #f1e6ec; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 17px; line-height: 1.5; margin: 0 0 16px 0;">
            Here is your keepsake from today's session (${dateFormatted})!
          </p>
          <p style="font-size: 13px; color: #706374; margin: 0; font-family: sans-serif;">
            Style: <strong>${frameName}</strong> &middot; Room: <strong>${roomCode}</strong>
          </p>
        </div>

        <p style="font-size: 13px; color: #a196a0; text-align: center; font-family: sans-serif; line-height: 1.5; margin: 0;">
          Your photo strip is attached to this email in full resolution.<br />
          Composed entirely in your browser with zero server media storage.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: emailFrom,
      to: recipients.join(", "),
      subject: `Your Memento Keepsake (${roomCode})`,
      html: htmlContent,
      attachments: [
        {
          filename,
          content: imageBuffer,
          contentType: "image/png",
        },
      ],
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send keepsake email",
    };
  }
}
