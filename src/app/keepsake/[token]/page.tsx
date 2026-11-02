import { getEphemeralKeepsake } from "@/lib/ephemeral-keepsake";
import Link from "next/link";
import { Heart, AlertTriangle, ArrowRight } from "lucide-react";
import KeepsakeView from "./view";

export default async function KeepsakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const keepsake = getEphemeralKeepsake(token);

  if (!keepsake) {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card error-state">
            <AlertTriangle size={32} />
            <h1>Keepsake Link Expired</h1>
            <p>
              This private photo link has reached its 24-hour expiration or is
              invalid. Memento Booth automatically purges media to protect your
              privacy.
            </p>
            <Link href="/" className="button">
              Create a New Booth <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <KeepsakeView
      roomCode={keepsake.roomCode}
      frameName={keepsake.frameName}
      dataUrl={keepsake.dataUrl}
      hoursRemaining={keepsake.hoursRemaining}
    />
  );
}

