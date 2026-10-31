import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createEmailOtp } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkIpSecurity, recordSuspiciousFailure } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  // 1. Extract client IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  // 2. Database-backed suspicious IP threat check
  const ipSecurity = await checkIpSecurity(ip);
  if (ipSecurity.blocked) {
    return NextResponse.json(
      {
        error: `Access temporarily restricted due to suspicious activity. Try again in ${ipSecurity.retryAfterSec ?? 1800} seconds.`,
      },
      {
        status: 403,
        headers: { "Retry-After": String(ipSecurity.retryAfterSec ?? 1800) },
      }
    );
  }

  // 3. Database-backed rate limiting on client IP (max 5 OTP requests per 10 minutes)
  const ipLimit = await checkRateLimit(`otp:ip:${ip}`, 5, 600);
  if (!ipLimit.success) {
    await recordSuspiciousFailure(ip, "EXCESSIVE_OTP_REQUESTS", 5, 30);
    return NextResponse.json(
      {
        error: `Too many requests from this network. Please wait ${ipLimit.retryAfterSec ?? 60} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSec ?? 60) },
      }
    );
  }

  // 3. Database-backed rate limiting on email target (max 3 OTP requests per 10 minutes)
  const emailLimit = await checkRateLimit(`otp:email:${email}`, 3, 600);
  if (!emailLimit.success) {
    return NextResponse.json(
      {
        error: `Too many attempts for this email address. Please wait ${emailLimit.retryAfterSec ?? 60} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfterSec ?? 60) },
      }
    );
  }

  // 4. Cooldown per email (minimum 60s between codes)
  const recent = await import("@/lib/prisma").then(({ default: prisma }) =>
    prisma.emailOtp.findFirst({
      where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } },
    })
  );
  if (recent) {
    return NextResponse.json(
      { error: "Please wait 60 seconds before requesting another code." },
      { status: 429 }
    );
  }

  // 5. Generate and persist OTP with client IP
  const { code } = await createEmailOtp(email, ip);
  const transporter = nodemailer.createTransport(
    process.env.AUTH_EMAIL_SERVER ?? "smtp://localhost:1025"
  );
  await transporter.sendMail({
    from: process.env.AUTH_EMAIL_FROM ?? "Memento Booth <no-reply@localhost>",
    to: email,
    subject: "Your Memento Booth verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

  return NextResponse.json({ ok: true });
}
