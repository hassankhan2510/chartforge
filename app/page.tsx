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
            opacity: 0.8
          }}
        >
          {">"} ON-DEMAND MULTI-AGENT QUANTITATIVE ANALYSIS VIA TELEGRAM. 
          <br />
          {">"} EXECUTING SMC, WYCKOFF, AND PRICE-ACTION PROTOCOLS.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: '3rem' }}>
           <a 
            href="https://t.me/ChartForgeBot" 
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "1rem 2.5rem",
              background: "var(--accent-blue)",
              color: "white",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)",
              transition: "all 0.2s ease",
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            className="hover-lift"
          >
            OPEN TELEGRAM TERMINAL
          </a>
          
          <Link 
            href="/journal" 
            style={{
              padding: "1rem 2.5rem",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-medium)",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1rem",
              transition: "all 0.2s ease",
              textTransform: 'uppercase'
            }}
            className="hover-lift"
          >
            VIEW LIVE JOURNAL
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="animate-fade-in animate-delay-1" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '5rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-purple)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-purple)' }}>[01] THE TELEGRAM BOT</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your private quant analyst in your pocket. Send charts or request data-driven setups anytime, anywhere. Restricted to your specific ID for total privacy.
            </p>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-green)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-green)' }}>[02] MULTI-SYSTEM ENGINE</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Switch between <strong>SMC</strong>, <strong>Wyckoff</strong>, or <strong>Price Action</strong> logic on the fly. The engine re-configures its neural debate based on your command.
            </p>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-amber)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-amber)' }}>[03] REFLEXIVE JOURNALING</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Every analysis is automatically archived in a private Supabase schema. Use the web journal to audit past calls and improve your win-rate.
            </p>
        </div>
      </div>

      {/* TradingView Integrated Dashboard */}
      <div className="animate-fade-in animate-delay-2" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{">"} LIVE_MARKET_FEED</h2>
            <div style={{ height: '1px', flex: 1, background: 'var(--border-medium)' }}></div>
            <span className="badge badge-green">LIVE STREAM</span>
        </div>
        
        <div className="glass-card" style={{ padding: '2px', overflow: 'hidden' }}>
            <div ref={container} className="tradingview-widget-container"></div>
        </div>
      </div>
    </div>
  );
}
