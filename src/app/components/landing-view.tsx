"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  Heart,
  LockKeyhole,
  MapPin,
  Menu,
  Sparkles,
  KeyRound,
  X,
} from "lucide-react";
import { QuickJoinModal } from "./quick-join-modal";

const themes = ["rose", "lavender", "gold"] as const;

function BoothPreview({ tone = "rose" }: { tone?: string }) {
  return (
    <div className={`booth-card tone-${tone}`}>
      <div className="booth-topline">
        <span>NYC</span>
        <Heart size={13} fill="currentColor" />
        <span>LONDON</span>
      </div>
      <div className="booth-screens">
        <div className="person-screen person-one">
          <span>you</span>
        </div>
        <div className="person-screen person-two">
          <span>your person</span>
        </div>
      </div>
      <div className="countdown">
        <span>3</span>
        <span>2</span>
        <span>1</span>
        <strong>
          <Camera size={19} />
        </strong>
      </div>
      <div className="booth-strip">
        <div className="strip-shot shot-one" />
        <div className="strip-shot shot-two" />
        <div className="strip-shot shot-three" />
        <small>captured together</small>
      </div>
      <div className="booth-caption">
        <Sparkles size={13} /> saved to your memories
      </div>
    </div>
  );
}

interface LandingViewProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

export function LandingView({ isAuthenticated, userName }: LandingViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<number>(0);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const createBoothUrl = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <main className="site-shell">
      {/* ── Quick Join Modal ── */}
      <QuickJoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {/* ── Navigation ── */}
      <nav className="nav-wrap">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Heart size={17} fill="currentColor" />
          </span>
          <span>Memento Booth</span>
        </Link>

        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#themes" onClick={() => setMenuOpen(false)}>
            Themes
          </a>
          <a href="#privacy" onClick={() => setMenuOpen(false)}>
            Privacy
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
          </a>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="text-link flex-center gap-1"
            onClick={() => setIsJoinModalOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <KeyRound size={14} /> Enter Code
          </button>

          {isAuthenticated ? (
            <Link className="button button-small" href="/dashboard">
              {userName ? `${userName}'s Dashboard` : "Dashboard"}{" "}
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link className="text-link" href="/login">
                Sign in
              </Link>
              <Link className="button button-small" href="/signup">
                Create booth <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>

        <button
          className="icon-button menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          type="button"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* ── Hero Section ── */}
      <section id="top" className="hero section-pad">
        <div className="hero-copy reveal-up">
          <p className="eyebrow">
            <Heart size={14} fill="currentColor" /> a little date night, no matter the distance
          </p>
          <h1>
            Different places.
            <br />
            <em>One perfect moment.</em>
          </h1>
          <p className="hero-lede">
            A virtual photobooth for the two of you. Pose together, count down
            together, and leave with a little memory worth keeping.
          </p>

          <div className="hero-actions">
            <Link className="button" href={createBoothUrl}>
              Create our booth <ArrowRight size={17} />
            </Link>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => setIsJoinModalOpen(true)}
            >
              <KeyRound size={16} /> Enter Room Code
            </button>
          </div>

          <p className="microcopy">
            <LockKeyhole size={13} /> private room link <span /> works in your
            browser <span /> zero photos stored on servers
          </p>
        </div>

        <div className="hero-art reveal-in">
          <div className="float-note note-left">
            made for
            <br />
            <strong>your person</strong> <Heart size={13} fill="currentColor" />
          </div>
          <div className="float-note note-right">
            04.09.26
            <br />
            <strong>forever & always</strong>
          </div>
          <BoothPreview tone={themes[activeTheme]} />
        </div>
      </section>

      {/* ── Ticker ── */}
      <section className="ticker">
        <span>two cameras</span>
        <Heart size={13} fill="currentColor" />
        <span>one countdown</span>
        <Heart size={13} fill="currentColor" />
        <span>a keepsake for later</span>
        <Heart size={13} fill="currentColor" />
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="section-pad story-section">
        <div className="section-intro">
          <p className="eyebrow">the sweet little ritual</p>
          <h2>
            Not another screenshot
            <br />
            <em>a memory worth keeping.</em>
          </h2>
        </div>
        <div className="compare-grid">
          <div className="compare-card muted-card">
            <div className="fake-call">
              <div className="fake-person" />
              <div className="fake-person small" />
              <span className="call-time">00:42:18</span>
            </div>
            <p className="compare-label negative">just another screenshot</p>
            <p>Lovely, but lost in a camera roll full of everything else.</p>
          </div>
          <div className="compare-card keepsake-card">
            <BoothPreview />
            <p className="compare-label positive">
              captured together <Heart size={14} fill="currentColor" />
            </p>
            <p>
              A tiny date, a silly pose, and proof you showed up for each
              other.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 Steps ── */}
      <section id="themes" className="section-pad steps-section">
        <div className="section-intro centered">
          <p className="eyebrow">three easy steps</p>
          <h2>
            Make a little magic
            <br />
            <em>from wherever you are.</em>
          </h2>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <Camera />
            <h3>Start a private booth</h3>
            <p>
              Create an account, make a room, and send the invite link or 4-letter code to your person.
            </p>
            <button
              type="button"
              className="mini-action"
              onClick={() => setIsJoinModalOpen(true)}
            >
              <KeyRound size={13} /> Enter a room code
            </button>
          </article>
          <article>
            <span>02</span>
            <div className="mini-count">
              <b>3</b>
              <b>2</b>
              <b>1</b>
              <strong>
                <Camera size={16} />
              </strong>
            </div>
            <h3>Pose. Count down. Smile.</h3>
            <p>
              Your cameras flash at the same time across every pose slot, even when your clocks differ.
            </p>
          </article>
          <article>
            <span>03</span>
            <Sparkles />
            <h3>Keep your favorite frame</h3>
            <p>
              Choose a theme, add your date stamp, and download the finished photo strip instantly.
            </p>
          </article>
        </div>
      </section>

      {/* ── Privacy Promise ── */}
      <section id="privacy" className="privacy-band section-pad">
        <div className="privacy-lock">
          <LockKeyhole size={28} />
        </div>
        <div>
          <p className="eyebrow">made for personal moments</p>
          <h2>Your memory stays yours.</h2>
          <p>
            Rooms are private and temporary. Photos are composed directly inside
            your browser and downloaded by you. We do not store your photos on
            servers or build a gallery of your private moments.
          </p>
        </div>
        <div className="privacy-points">
          <span>
            <Check size={15} /> private invite links
          </span>
          <span>
            <Check size={15} /> browser-side composition
          </span>
          <span>
            <Check size={15} /> close your room anytime
          </span>
        </div>
      </section>

      {/* ── Distance Section ── */}
      <section className="section-pad distance-section">
        <div className="distance-copy">
          <p className="eyebrow">love, in two places</p>
          <h2>
            For late-night calls,
            <br />
            <em>birthdays, and in-betweens.</em>
          </h2>
          <p>
            Some of the best dates do not need a reservation or a plane ticket.
            Just the two of you, a silly pose, and a reason to press capture.
          </p>
          <Link className="underlined" href={createBoothUrl}>
            Make a keepsake <ArrowRight size={15} />
          </Link>
        </div>
        <div className="map-art">
          <div className="map-line" />
          <div className="map-city city-a">
            <MapPin size={18} fill="currentColor" />
            <b>New York</b>
          </div>
          <div className="map-city city-b">
            <MapPin size={18} fill="currentColor" />
            <b>London</b>
          </div>
          <span className="map-heart">
            <Heart size={18} fill="currentColor" />
          </span>
          <span className="map-star star-one">✦</span>
          <span className="map-star star-two">✦</span>
        </div>
      </section>

      {/* ── Theme Customizer ── */}
      <section className="customizer section-pad">
        <div className="section-intro">
          <p className="eyebrow">make it yours</p>
          <h2>
            Pick a mood.
            <br />
            <em>Keep the moment.</em>
          </h2>
        </div>
        <div className="customizer-grid">
          <div className="theme-picker">
            {themes.map((theme, index) => (
              <button
                key={theme}
                type="button"
                className={
                  activeTheme === index ? "theme-option selected" : "theme-option"
                }
                onClick={() => setActiveTheme(index)}
              >
                <span className={`swatch swatch-${theme}`} />
                <span>
                  <strong>
                    {theme === "rose"
                      ? "Soft romance"
                      : theme === "lavender"
                      ? "Lavender dream"
                      : "Golden hour"}
                  </strong>
                  <small>
                    {theme === "rose"
                      ? "warm blush + little hearts"
                      : theme === "lavender"
                      ? "cool lilac + silver stars"
                      : "peach light + date stamps"}
                  </small>
                </span>
                {activeTheme === index && <Check size={16} />}
              </button>
            ))}
          </div>
          <div className="customizer-preview">
            <BoothPreview tone={themes[activeTheme]} />
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section id="join" className="final-cta section-pad">
        <p className="eyebrow">
          <Heart size={14} fill="currentColor" /> your next little memory is waiting
        </p>
        <h2>
          Turn your next call
          <br />
          <em>into a keepsake.</em>
        </h2>
        <p>No download needed. Just you, them, and a private room for two.</p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Link className="button" href={createBoothUrl}>
            Create our booth <ArrowRight size={17} />
          </Link>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <KeyRound size={16} /> Enter Room Code
          </button>
        </div>
        <div className="cta-sparkles">
          ✦ <Heart size={16} fill="currentColor" /> ✦
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="faq">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Heart size={15} fill="currentColor" />
          </span>
          <span>Memento Booth</span>
        </Link>
        <span>Made for couples everywhere.</span>
        <span>© 2026 Memento Booth</span>
      </footer>
    </main>
  );
}

