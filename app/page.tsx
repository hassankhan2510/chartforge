"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * ChartForge AI — The Official Sentinel
 * Professional Institutional Landing Page
 */
export default function HomePage() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": 450,
      "symbolsGroups": [
        {
          "name": "Global Macro",
          "symbols": [
            { "name": "FX:EURUSD", "displayName": "EUR/USD" },
            { "name": "FX:GBPUSD", "displayName": "GBP/USD" },
            { "name": "OANDA:XAUUSD", "displayName": "Gold" },
            { "name": "CAPITALCOM:US100", "displayName": "Nasdaq" }
          ]
        },
        {
          "name": "PSX Equity",
          "symbols": [
            { "name": "PSX:SYS", "displayName": "Systems" },
            { "name": "PSX:HUBC", "displayName": "Hub Power" },
            { "name": "PSX:ENGRO", "displayName": "Engro Corp" }
          ]
        }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isAnimatedSymbolLogo": true,
      "backgroundColor": "rgba(0, 0, 0, 0.5)"
    });
    
    if (container.current) {
        container.current.innerHTML = '';
        container.current.appendChild(script);
    }
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#000' }}>
      
      {/* Cinematic Hero Background */}
      <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4,
          zIndex: 0
      }}></div>
      
      {/* Vignette & Grain */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle, transparent 20%, #000 100%)', zIndex: 1 }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: "8rem", paddingBottom: "4rem" }}>
        
        {/* Hero Section */}
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "6rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <span style={{ 
                border: '1px solid var(--accent-blue)', 
                padding: '0.4rem 1.2rem', 
                borderRadius: '2px', 
                fontSize: '0.7rem', 
                letterSpacing: '0.2em', 
                fontWeight: 800,
                color: 'var(--accent-blue)',
                background: 'rgba(59, 130, 246, 0.1)'
            }}>
                OPERATIONAL_STATUS: ACTIVE
            </span>
          </div>
          
          <h1 style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              fontWeight: 950,
              letterSpacing: "-0.05em",
              lineHeight: 0.85,
              marginBottom: "2rem",
              textTransform: 'uppercase'
            }}>
            THE <span className="text-gradient">SENTINEL</span>
            <br />
            PROTOCOL.
          </h1>

          <p className="mono" style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              maxWidth: "800px",
              margin: "0 auto 3.5rem",
              lineHeight: 1.8,
              letterSpacing: '-0.01em'
            }}>
            {">"} MULTI-AGENT SYNTHESIS ENGINE. {">"} INSTITUTIONAL CONFLUENCE LAYER. 
            <br />
            {">"} THE RAW POWER OF A BLOOMBERG TERMINAL, REFACTORED FOR THE MODERN RISK TAKER.
          </p>

          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
             <a 
              href="https://t.me/ChartForgeBot" 
              className="hover-lift"
              style={{
                padding: "1.2rem 3.5rem",
                background: "var(--accent-blue)",
                color: "white",
                borderRadius: "2px",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: "0.85rem",
                letterSpacing: '0.15em',
                boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)",
              }}
            >
              LAUNCH TELEGRAM BOT
            </a>
            
            <Link 
              href="/terminal" 
              className="hover-lift"
              style={{
                padding: "1.2rem 3.5rem",
                background: "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "2px",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "0.85rem",
                letterSpacing: '0.15em',
                backdropFilter: 'blur(10px)'
              }}
            >
              ACCESS WEB TERMINAL
            </Link>
          </div>
        </div>

        {/* Dash Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '8rem' }}>
            {[
                { title: "STREET EXPERIENCE", desc: "AI trained to look for retail traps, liquidity grabs, and 'failed moves' in messy data.", color: "var(--accent-blue)" },
                { title: "CONFLUENCE RADAR", desc: "Real-time correlation monitoring for DXY, Yields, and Whale positioning data.", color: "var(--accent-cyan)" },
                { title: "REFLEXIVE LEARNING", desc: "A recursive memory engine that audits its own past mistakes to improve your next setup.", color: "var(--accent-purple)" }
            ].map((item, i) => (
                <div key={i} className="glass-card" style={{ padding: '2.5rem', border: 'none', background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${item.color}` }}>
                    <h3 className="mono" style={{ fontSize: '0.9rem', marginBottom: '1rem', color: item.color }}>{item.title}</h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
            ))}
        </div>

        {/* Live Market Bar */}
        <div className="glass-card" style={{ overflow: 'hidden', padding: '1px', background: 'rgba(255,255,255,0.05)' }}>
            <div ref={container}></div>
        </div>

      </div>
    </div>
  );
}
