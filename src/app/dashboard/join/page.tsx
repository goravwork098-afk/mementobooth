import { redirect } from "next/navigation";
import { KeyRound, Sparkles, ShieldCheck, Heart } from "lucide-react";
import { auth } from "@/auth";
import { QuickJoinInline } from "../components";

export default async function DashboardJoinPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="dashboard-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">
            <KeyRound size={24} /> Enter Room Code
          </h1>
          <p className="page-subheading">
            Connect to your partner&apos;s private booth with their 4-letter code.
          </p>
        </div>
      </div>

      <div className="join-code-container">
        <div className="join-code-card">
          <div className="join-code-badge">
            <Sparkles size={16} /> Instant Couple Connect
          </div>

          <h2>Ready to hop in the booth?</h2>
          <p className="join-code-desc">
            Ask your partner for the 4-letter code shown on their photobooth
            screen and paste or type it below.
          </p>

          <div className="join-code-input-area">
            <QuickJoinInline />
          </div>

          <div className="join-tips-list">
            <div className="join-tip-item">
              <span className="join-tip-icon">
                <Heart size={16} fill="currentColor" />
              </span>
              <div>
                <strong>Private & Direct</strong>
                <p>
                  Connections run peer-to-peer using WebRTC. Your video feeds
                  stream directly between you and your partner.
                </p>
              </div>
            </div>

            <div className="join-tip-item">
              <span className="join-tip-icon">
                <ShieldCheck size={16} />
              </span>
              <div>
                <strong>Ephemeral Sessions</strong>
                <p>
                  Room codes are valid for 2 hours and automatically self-terminate
                  once the date night session concludes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

