import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createEmailOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const recent = await import("@/lib/prisma").then(({ default: prisma }) => prisma.emailOtp.findFirst({ where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } } }));
  if (recent) return NextResponse.json({ error: "Please wait before requesting another code." }, { status: 429 });
  const { code } = await createEmailOtp(email);
  const transporter = nodemailer.createTransport(process.env.AUTH_EMAIL_SERVER ?? "smtp://localhost:1025");
  await transporter.sendMail({ from: process.env.AUTH_EMAIL_FROM ?? "Memento Booth <no-reply@localhost>", to: email, subject: "Your Memento Booth verification code", text: `Your verification code is ${code}. It expires in 10 minutes.` });
  return NextResponse.json({ ok: true });
}
