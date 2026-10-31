"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Heart, X, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { resolveRoomCodeAction } from "@/app/actions/join";

interface QuickJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickJoinModal({ isOpen, onClose }: QuickJoinModalProps) {
  if (!isOpen) return null;
  return <QuickJoinModalContent onClose={onClose} />;
}

function QuickJoinModalContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setPending(true);
    setError(null);

    try {
      const res = await resolveRoomCodeAction(code);
      if (res.success && res.token) {
        router.push(`/join/${res.token}`);
      } else {
        setError(res.error ?? "Could not find this booth.");
        setPending(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setPending(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <Heart size={20} fill="currentColor" />
          </div>
          <h2 id="modal-title">Enter Room Code</h2>
          <p>
            Have a private room code from your partner? Enter it below to step
            into your booth.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-input-wrap">
            <span className="code-prefix">LOVE-</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="4X9K"
              maxLength={9} // accommodates "LOVE-XXXX" or "XXXX"
              value={code.startsWith("LOVE-") ? code.slice(5) : code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                setCode(val ? `LOVE-${val}` : "");
                if (error) setError(null);
              }}
              required
              disabled={pending}
              className="modal-input"
            />
          </div>

          {error && (
            <p className="modal-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="button modal-submit"
              disabled={pending || !code.trim()}
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="spin" /> Joining…
                </>
              ) : (
                <>
                  Join Booth <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="modal-footer">
          <LockKeyhole size={13} />
          <span>Private, peer-to-peer session. No photos saved.</span>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(48, 43, 53, 0.45);
          backdrop-filter: blur(8px);
          display: grid;
          place-items: center;
          padding: 20px;
          z-index: 100;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-card {
          width: min(440px, 100%);
          background: #ffffff;
          border: 1px solid #eee6ec;
          border-radius: 28px;
          padding: 36px 32px 28px;
          box-shadow: 0 30px 80px rgba(168, 140, 197, 0.3),
            0 10px 30px rgba(124, 102, 141, 0.15);
          position: relative;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          transition: background 0.2s, color 0.2s;
        }

        .modal-close:hover {
          background: #f5eff3;
          color: var(--ink);
        }

        .modal-header {
          text-align: center;
        }

        .modal-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffe8ec;
          color: var(--rose);
          display: grid;
          place-items: center;
          margin: 0 auto 16px;
        }

        .modal-header h2 {
          font-family: Georgia, serif;
          font-size: 28px;
          color: var(--ink);
          margin: 0 0 8px;
          letter-spacing: -0.03em;
        }

        .modal-header p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        .modal-form {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-input-wrap {
          display: flex;
          align-items: center;
          background: #fff9f6;
          border: 2px solid #ecdde4;
          border-radius: 16px;
          padding: 0 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .modal-input-wrap:focus-within {
          border-color: var(--rose);
          box-shadow: 0 0 0 4px rgba(219, 79, 112, 0.12);
        }

        .code-prefix {
          font-family: monospace;
          font-size: 18px;
          font-weight: 700;
          color: var(--rose);
          letter-spacing: 0.05em;
          user-select: none;
        }

        .modal-input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: monospace;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--ink);
          padding: 14px 8px;
          outline: none;
          text-transform: uppercase;
        }

        .modal-input::placeholder {
          color: #cfc2ca;
        }

        .modal-error {
          color: #e11d48;
          font-size: 12px;
          font-weight: 600;
          margin: 0;
          text-align: center;
          padding: 8px 12px;
          background: #fff1f2;
          border-radius: 10px;
        }

        .modal-submit {
          width: 100%;
          cursor: pointer;
        }

        .modal-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .modal-footer {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #9a9099;
          font-size: 11px;
        }

        @media (max-width: 480px) {
          .modal-card {
            padding: 28px 20px 22px;
            border-radius: 22px;
          }
          .modal-header h2 {
            font-size: 24px;
          }
          .code-prefix,
          .modal-input {
            font-size: 16px;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

