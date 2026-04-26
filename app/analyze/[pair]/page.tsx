"use client";

import Link from "next/link";
import { use } from "react";
import { PAIRS, getStylesForCategory } from "@/lib/constants";
import { TradingPair } from "@/lib/types";

/**
 * ChartForge AI — Style Selection Page
 * User selects Scalp, Day, or Swing trading style.
 * Shows timeframes required for each style.
 */
export default function PairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = use(params);
  const pairId = pair as TradingPair;
  const pairConfig = PAIRS[pairId];
  
  // Guard clause for invalid pairs
  if (!pairConfig) {
    return (
      <div className="container" style={{ paddingTop: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Invalid pair: {pair}</h1>
        <Link href="/" style={{ color: "var(--accent-blue)" }}>← Back to Home</Link>
      </div>
    );
  }

  const categoryStyles = getStylesForCategory(pairConfig.category);
  const styleKeys = Object.keys(categoryStyles);

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: "800px" }}>
      {/* Breadcrumb */}
      <div className="animate-fade-in" style={{ marginBottom: "2rem" }}>
        <Link
          href="/"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            transition: "color 0.2s",
          }}
        >
          ← Back to Pairs
        </Link>
      </div>

      {/* Pair Header */}
      <div
        className="animate-fade-in animate-delay-1"
        style={{ textAlign: "center", marginBottom: "2.5rem" }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>{pairConfig.icon}</div>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "0.25rem",
          }}
        >
          {pairConfig.name}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {pairConfig.fullName}
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            marginTop: "0.5rem",
            maxWidth: "400px",
            margin: "0.5rem auto 0",
          }}
        >
          {pairConfig.description}
        </p>
      </div>

      {/* Style Selection Label */}
      <div
        className="animate-fade-in animate-delay-2"
        style={{ textAlign: "center", marginBottom: "1.5rem" }}
      >
        <h2
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Choose Your Trading Style
        </h2>
      </div>

      {/* Style Buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {styleKeys.map((styleId, index) => {
          const style = categoryStyles[styleId];
          return (
            <Link
              key={styleId}
              href={`/analyze/${pairId}/${styleId}`}
              style={{ textDecoration: "none", color: "inherit" }}
              className={`animate-fade-in animate-delay-${index + 2}`}
            >
              <button className="style-btn" type="button">
                <div className="style-btn-icon">{style.icon}</div>
                <div className="style-btn-name">{style.name}</div>
                <div className="style-btn-desc">{style.description}</div>
                <div className="style-btn-meta">
                  <span>TF: {style.timeframes.join(" + ")}</span>
                  <span>HOLD: {style.holdTime}</span>
                  <span>TARGET: {style.typicalRR}</span>
                </div>

                {/* Timeframe preview */}
                <div
                  style={{
                    marginTop: "0.75rem",
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  {style.timeframes.map((tf) => (
                    <span key={tf} className="badge badge-blue">
                      {tf}
                    </span>
                  ))}
                </div>
              </button>
            </Link>
          );
        })}
      </div>

      {/* Info */}
      <div
        className="animate-fade-in animate-delay-5"
        style={{
          marginTop: "2rem",
          padding: "1rem 1.25rem",
          background: "rgba(59, 130, 246, 0.05)",
          border: "1px solid rgba(59, 130, 246, 0.1)",
          borderRadius: "12px",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>NOTE:</strong> Each
        style requires 3 chart screenshots at specific timeframes. Make sure
        your charts are clear and show candlesticks with key indicators visible.
      </div>
    </div>
  );
}
