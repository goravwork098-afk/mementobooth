import { NextResponse } from "next/server";
import { consumeEmailOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter a valid email and six-digit code." }, { status: 400 });
  const user = await consumeEmailOtp(email, code);
  if (!user) return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
