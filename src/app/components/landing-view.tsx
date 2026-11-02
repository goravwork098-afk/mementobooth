"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Sparkle,
} from "lucide-react";
import { QuickJoinModal } from "./quick-join-modal";
import { gsap, useGSAP } from "@/lib/gsap";

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
          <Image
            src="/peeps/peep-8.png"
            alt="You in New York"
            width={130}
            height={160}
            className="booth-screen-avatar"
            unoptimized
          />
          <span className="screen-tag">you</span>
        </div>
        <div className="person-screen person-two">
          <Image
            src="/peeps/peep-13.png"
            alt="Your person in London"
            width={130}
            height={160}
            className="booth-screen-avatar"
            unoptimized
          />
          <span className="screen-tag">your person</span>
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

  const containerRef = useRef<HTMLDivElement>(null);
  const distancePathRef = useRef<SVGPathElement>(null);

  const createBoothUrl = isAuthenticated ? "/dashboard" : "/signup";

  useGSAP(
    () => {
      // Respect user motion preferences
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      // ── 1. Hero Entrance Timeline ──
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".hero-copy .eyebrow", { y: 20, opacity: 0, duration: 0.6 })
        .from(".hero-copy h1", { y: 35, opacity: 0, duration: 0.8 }, "-=0.4")
        .from(".hero-lede", { y: 25, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-actions", { y: 20, opacity: 0, scale: 0.96, duration: 0.6 }, "-=0.4")
        .from(".hero-art", { y: 40, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(".hero-art-peep", { x: 30, opacity: 0, duration: 0.8 }, "-=0.6");

      // Continuous gentle hover for hero companion character
      gsap.to(".hero-art-peep", {
        y: "+=8",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ── 2. Scroll-triggered section reveals ──
      gsap.utils.toArray<HTMLElement>(".section-intro").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      });

      // ── 3. Compare cards stagger ──
      gsap.from(".compare-card", {
        scrollTrigger: {
          trigger: ".compare-grid",
          start: "top 80%",
        },
        y: 45,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
      });

      // ── 4. Step cards stagger with peep images ──
      gsap.from(".steps-grid article", {
        scrollTrigger: {
          trigger: ".steps-grid",
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.18,
        ease: "power2.out",
      });

      // ── 5. Distance path draw animation (scrubbed) ──
      if (distancePathRef.current) {
        const path = distancePathRef.current;
        const pathLength = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        gsap.to(path, {
          scrollTrigger: {
            trigger: ".distance-section",
            start: "top 75%",
            end: "center center",
            scrub: 1,
          },
          strokeDashoffset: 0,
          ease: "none",
        });

        gsap.from(".distance-peep", {
          scrollTrigger: {
            trigger: ".distance-section",
            start: "top 80%",
          },
          scale: 0.9,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.2)",
        });

        gsap.from(".map-heart-badge", {
          scrollTrigger: {
            trigger: ".distance-section",
            start: "center 70%",
          },
          scale: 0,
          opacity: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)",
        });
      }

      // ── 6. Privacy band reveal ──
      gsap.from(".privacy-band", {
        scrollTrigger: {
          trigger: ".privacy-band",
          start: "top 85%",
        },
        y: 35,
        opacity: 0,
        duration: 0.75,
        ease: "power2.out",
      });

      // ── 7. Parallax for CTA background characters ──
      gsap.to(".cta-bg-peep-left", {
        scrollTrigger: {
          trigger: ".final-cta",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
        y: -35,
        ease: "none",
      });
      gsap.to(".cta-bg-peep-right", {
        scrollTrigger: {
          trigger: ".final-cta",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
        y: -50,
        ease: "none",
      });
    },
    { scope: containerRef }
  );

  return (
    <main ref={containerRef} className="site-shell">
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
            className="nav-code-btn"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <KeyRound size={14} />
            <span>Enter Code</span>
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
        <div className="hero-copy">
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

        <div className="hero-art">
          {/* Standing companion illustration alongside the booth card */}
          <div className="hero-art-peep" aria-hidden="true">
            <Image
              src="/peeps/a-person/standing.svg"
              alt=""
              width={140}
              height={300}
              priority
              unoptimized
              className="art-peep-img"
            />
          </div>

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
              <Image
                src="/peeps/peep-23.png"
                alt="Video call screenshot"
                width={150}
                height={200}
                className="fake-call-avatar"
                unoptimized
              />
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
            <div className="step-peep-wrap">
              <Image
                src="/peeps/peep-31.png"
                alt="Start private booth"
                width={120}
                height={150}
                className="peep-step-avatar"
                unoptimized
              />
            </div>
            <span>01</span>
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
            <div className="step-peep-wrap">
              <Image
                src="/peeps/peep-17.png"
                alt="Pose and countdown"
                width={120}
                height={150}
                className="peep-step-avatar"
                unoptimized
              />
            </div>
            <span>02</span>
            <h3>Pose. Count down. Smile.</h3>
            <p>
              Your cameras flash at the same time across every pose slot, even when your clocks differ.
            </p>
          </article>
          <article>
            <div className="step-peep-wrap">
              <Image
                src="/peeps/peep-79.png"
                alt="Keep favorite frame"
                width={120}
                height={150}
                className="peep-step-avatar"
                unoptimized
              />
            </div>
            <span>03</span>
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

      {/* ── Distance Section (Interactive SVG Arc & Peeps) ── */}
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

        <div className="distance-interactive-map">
          {/* Animated SVG Path connecting both cities */}
          <div className="distance-svg-wrap">
            <svg
              className="distance-svg"
              viewBox="0 0 600 160"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                ref={distancePathRef}
                d="M 80 110 Q 300 10 520 110"
                stroke="var(--rose)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            </svg>
          </div>

          {/* New York Character (Male) */}
          <div className="distance-peep peep-ny">
            <Image
              src="/peeps/peep-standing-3.svg"
              alt="He is in New York"
              width={100}
              height={250}
              className="peep-img"
              unoptimized
            />
            <div className="city-pill">
              <MapPin size={13} />
              <span>New York</span>
            </div>
          </div>

          {/* Connected Heart Badge */}
          <div className="map-heart-badge">
            <Heart size={16} fill="currentColor" />
            <span>Connected</span>
          </div>

          {/* London Character (Female) */}
          <div className="distance-peep peep-london">
            <Image
              src="/peeps/a-person/sitting.svg"
              alt="She is in London"
              width={130}
              height={230}
              className="peep-img"
              unoptimized
            />
            <div className="city-pill">
              <MapPin size={13} />
              <span>London</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Theme Customizer ── */}
      <section className="customizer section-pad">
        <div className="section-intro centered">
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

      {/* ── Final Call to Action with Parallax Peeps ── */}
      <section id="join" className="final-cta section-pad">
        {/* Parallax Background Peeps */}
        <div className="cta-bg-peep-left" aria-hidden="true">
          <Image
            src="/peeps/a-person/sitting.svg"
            alt=""
            width={140}
            height={200}
            unoptimized
            className="peep-sitting-img"
          />
        </div>
        <div className="cta-bg-peep-right" aria-hidden="true">
          <Image
            src="/peeps/peep-34.png"
            alt=""
            width={130}
            height={180}
            unoptimized
            className="peep-sitting-img"
          />
        </div>

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
            position: "relative",
            zIndex: 2,
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
          <Sparkle size={18} />
          <Heart size={16} fill="currentColor" />
          <Sparkle size={18} />
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
        <span>&copy; 2026 Memento Booth</span>
      </footer>
    </main>
  );
}
