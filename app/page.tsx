"use client";

import Link from "next/link";
import { PAIRS, PAIR_LIST } from "@/lib/constants";

/**
 * ChartForge AI — Homepage
 * Displays the 5 predefined trading pairs as premium cards.
 * User clicks a pair → navigate to style selection.
 */
export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Hero Section */}
      <div
        className="animate-fade-in"
        style={{ textAlign: "center", marginBottom: "3rem" }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "1rem",
          }}
        >
          Institutional-Grade
          <br />
          <span className="text-gradient">Chart Analysis</span>
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 1.5rem",
            lineHeight: 1.6,
          }}
        >
          Upload your charts. Get prop-desk-level analysis powered by advanced
          AI vision, quantitative models, and decades of trading logic.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <span className="badge badge-blue">SECURE INFERENCE</span>
          <span className="badge badge-green">T-LATENCY: ~15s</span>
          <span className="badge badge-amber">ENSEMBLE DEBATE PROTOCOL</span>
        </div>
        <Link 
          href="/journal" 
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-medium)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
          className="hover-lift"
        >
          OPEN REFLEXIVE TRADE JOURNAL
        </Link>
      </div>

      {/* Select Pair Label - Global Desk */}
      <div
        className="animate-fade-in animate-delay-1"
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          marginTop: "3rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          [01] GLOBAL MACRO DESK
        </h2>
      </div>

      {/* Global Pair Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {PAIR_LIST.filter(p => PAIRS[p].category !== 'psx').map((pairId, index) => {
          const pair = PAIRS[pairId];
          const glowMap: Record<string, string> = {
            EURUSD: "var(--shadow-glow-blue)",
            GBPUSD: "var(--shadow-glow-purple)",
            XAUUSD: "var(--shadow-glow-amber)",
            BTCUSD: "0 0 30px rgba(249, 115, 22, 0.15)",
            USOIL: "var(--shadow-glow-green)",
          };

          return (
            <Link
              key={pairId}
              href={`/analyze/${pairId}`}
              style={{ textDecoration: "none", color: "inherit" }}
              className={`animate-fade-in animate-delay-${index + 1}`}
            >
              <div
                className="pair-card"
                style={
                  {
                    "--card-border-color": pair.color,
                    "--card-gradient": `linear-gradient(135deg, ${pair.color}, transparent)`,
                    "--card-glow": glowMap[pairId],
                  } as React.CSSProperties
                }
              >
                <div className="pair-card-icon">{pair.icon}</div>
                <div className="pair-card-name">{pair.name}</div>
                <div className="pair-card-fullname">{pair.fullName}</div>
                <div className="pair-card-description">{pair.description}</div>
                <div className="pair-card-arrow">→</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Select Pair Label - PSX Desk */}
       <div
        className="animate-fade-in animate-delay-3"
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          marginTop: "4rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "var(--accent-green)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          [02] LOCAL DOMESTIC EQUITIES (PSX)
        </h2>
      </div>

      {/* PSX Pair Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {PAIR_LIST.filter(p => PAIRS[p].category === 'psx').map((pairId, index) => {
          const pair = PAIRS[pairId];
          return (
            <Link
              key={pairId}
              href={`/analyze/${pairId}`}
              style={{ textDecoration: "none", color: "inherit" }}
              className={`animate-fade-in animate-delay-${index + 3}`}
            >
              <div
                className="pair-card"
                style={
                  {
                    "--card-border-color": pair.color,
                    "--card-gradient": `linear-gradient(135deg, ${pair.color}, transparent)`,
                    "--card-glow": `0 0 20px ${pair.color}20`,
                  } as React.CSSProperties
                }
              >
                <div className="pair-card-icon">{pair.icon}</div>
                <div className="pair-card-name">{pair.name}</div>
                <div className="pair-card-fullname">{pair.fullName}</div>
                <div className="pair-card-description">{pair.description}</div>
                <div className="pair-card-arrow">→</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* How it works */}
      <div
        className="animate-fade-in animate-delay-5"
        style={{
          marginTop: "4rem",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          How It Works
        </h3>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          {[
            { step: "01", title: "Select Pair", desc: "Choose target instrument", icon: "01" },
            { step: "02", title: "Pick Style", desc: "Define holding horizon", icon: "02" },
            { step: "03", title: "Upload Charts", desc: "Execute multi-timeframe", icon: "03" },
            { step: "04", title: "Get Analysis", desc: "Render prop-desk audit", icon: "04" },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: "140px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
              >
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--accent-blue)",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                }}
              >
                STEP {item.step}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
