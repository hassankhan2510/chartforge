import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChartForge AI — Institutional-Grade Chart Analysis",
  description:
    "Upload your forex, gold, oil, or BTC charts and get professional prop-desk-level analysis in seconds. Powered by advanced AI vision and quantitative models.",
  keywords: [
    "forex analysis",
    "trading AI",
    "chart analysis",
    "XAUUSD",
    "BTCUSD",
    "technical analysis",
    "scalping",
    "day trading",
    "swing trading",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Animated background */}
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />

        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-content">
            <a href="/" className="navbar-logo">
              <span className="navbar-logo-icon">⚡</span>
              <span className="navbar-logo-text">
                Chart<span className="text-gradient">Forge</span> AI
              </span>
            </a>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="/terminal" className="mono" style={{ 
                textDecoration: 'none', 
                color: 'var(--accent-blue)', 
                fontSize: '0.8rem', 
                fontWeight: 700,
                border: '1px solid var(--border-medium)',
                padding: '0.4rem 1rem',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.05)'
              }}>
                {">"} LAUNCH_TERMINAL
              </a>
              <span className="navbar-badge">v4.0</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ position: "relative", zIndex: 1, paddingTop: "70px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
