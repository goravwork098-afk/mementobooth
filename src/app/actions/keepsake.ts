"use server";

import { auth } from "@/auth";
import {
  createEphemeralKeepsake,
  sendKeepsakeEmail,
} from "@/lib/ephemeral-keepsake";

/**
 * Creates an ephemeral shareable link valid for 24 hours.
 */
export async function createShareableKeepsakeAction(
  roomCode: string,
  frameName: string,
  dataUrl: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to share keepsakes.");
  }

  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image data provided for keepsake.");
  }

  const token = createEphemeralKeepsake(roomCode, frameName, dataUrl);

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3133";

  return {
    success: true,
    token,
    shareUrl: `${baseUrl}/keepsake/${token}`,
  };
}

/**
 * Sends the high-definition keepsake directly to participant email addresses.
 */
export async function sendKeepsakeEmailAction(
  roomCode: string,
  frameName: string,
  dataUrl: string,
  emails: string[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validEmails = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (validEmails.length === 0) {
    throw new Error("No valid email addresses provided.");
  }

  // Extract base64 image data and convert to buffer
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const result = await sendKeepsakeEmail({
    recipients: validEmails,
    imageBuffer,
    roomCode,
    frameName,
  });

  return result;
}

