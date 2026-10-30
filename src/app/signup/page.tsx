"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Heart, Sparkles, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SignupForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!resendIn) return;
    const timer = window.setInterval(
      () => setResendIn((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setCodeSent(true);
      setResendIn(60);
    } catch {
      setError("We could not send a verification code.");
    } finally {
      setPending(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        code,
        name,
        redirect: false,
      });
      if (!result || result.error) throw new Error();
      window.location.assign(callbackUrl);
    } catch {
      setError("That code is invalid or expired.");
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orbit orbit-one" />
      <div className="auth-orbit orbit-two" />
      <div className="auth-shell">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark">
            <Heart size={17} fill="currentColor" />
          </span>
          Memento Booth
        </Link>
        <section className="auth-card">
          <div className="auth-kicker">
            <Sparkles size={14} /> start your story
          </div>
          <h1>
            A little room
            <br />
            <em>for the two of you.</em>
          </h1>
          <p className="auth-intro">
            {codeSent
              ? `Enter the six-digit code sent to ${email}.`
              : "Create your free account. Invite your person. Make something worth keeping."}
          </p>

          {codeSent ? (
            <form className="auth-form" onSubmit={verify}>
              <label>
                Verification code
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                />
              </label>
              <button
                className="button auth-submit"
                disabled={pending}
                type="submit"
              >
                {pending ? "Verifying..." : "Verify and create account"}{" "}
                <ArrowRight size={16} />
              </button>
              <button
                className="text-link"
                type="button"
                disabled={resendIn > 0 || pending}
                onClick={submit}
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
              <button
                className="text-link"
                type="button"
                onClick={() => setCodeSent(false)}
              >
                Use a different email
              </button>
              {error && <p role="alert">{error}</p>}
            </form>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              <label>
                Your name
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="What should we call you?"
                />
              </label>
              <label>
                Email address
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <button
                className="button auth-submit"
                disabled={pending}
                type="submit"
              >
                {pending ? "Sending code..." : "Create free account"}{" "}
                <ArrowRight size={16} />
              </button>
              {error && <p role="alert">{error}</p>}
            </form>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>
          <button
            className="social-button"
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <span className="google-mark">G</span> Sign up with Google
          </button>
          <p className="auth-foot">
            Already have an account?{" "}
            <Link href="/login">
              Sign in <ArrowRight size={13} />
            </Link>
          </p>
        </section>
        <p className="auth-note">
          <Mail size={13} /> Free to start · private room links · browser-based memories
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <SignupForm />
    </Suspense>
  );
}

