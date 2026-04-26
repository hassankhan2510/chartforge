"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * ChartForge AI — Premium Hub
 * Transformed into a high-end "Trading Terminal" landing page.
 * Features: Telegram integration highlights + Live TradingView Dashboard.
 */
export default function HomePage() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add TradingView Widget Script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": 450,
      "symbolsGroups": [
        {
          "name": "Forex",
          "originalName": "Forex",
          "symbols": [
            { "name": "FX:EURUSD", "displayName": "EUR/USD" },
            { "name": "FX:GBPUSD", "displayName": "GBP/USD" },
            { "name": "FX:USDJPY", "displayName": "USD/JPY" },
            { "name": "OANDA:XAUUSD", "displayName": "Gold" }
          ]
        },
        {
          "name": "Indices / Commodities",
          "symbols": [
            { "name": "CAPITALCOM:US100", "displayName": "Nasdaq 100" },
            { "name": "OANDA:US30USD", "displayName": "Dow 30" },
            { "name": "TVC:USOIL", "displayName": "WTI Crude" }
          ]
        },
        {
          "name": "PSX (Pakistan)",
          "symbols": [
            { "name": "PSX:SYS", "displayName": "Systems Ltd" },
            { "name": "PSX:HUBC", "displayName": "Hub Power" },
            { "name": "PSX:OGDC", "displayName": "Oil & Gas Dev" }
          ]
        }
      ],
      "showSymbolLogo": true,
      "isAnimatedSymbolLogo": true,
      "colorTheme": "dark",
      "smartTone": false,
      "locale": "en",
      "backgroundColor": "rgba(5, 5, 8, 1)"
    });
    
    if (container.current) {
        container.current.innerHTML = '';
        container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
      
      {/* Background Decorative Elements */}
      <div className="bg-grid"></div>
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Hero Terminal Section */}
      <div
        className="animate-fade-in"
        style={{ textAlign: "center", marginBottom: "4rem", position: "relative", zIndex: 2 }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="badge badge-blue" style={{ fontSize: '0.65rem', border: '1px solid var(--accent-blue)' }}>VERSION 4.0 — HEADLESS ENGINE</span>
        </div>
        
        <h1
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            marginBottom: "1.5rem",
          }}
        >
          THE TRADING
          <br />
          <span className="text-gradient">SENTINEL.</span>
        </h1>

        <p
          className="mono"
          style={{
            fontSize: "0.95rem",
            color: "var(--accent-cyan)",
            maxWidth: "700px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.6,

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
