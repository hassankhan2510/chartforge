"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JournalEntry } from "@/lib/journal";
import { PAIRS, FX_STYLES, PSX_STYLES } from "@/lib/constants";

export default function JournalPage() {
  const [trades, setTrades] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [pairFilter, setPairFilter] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchTrades = async () => {
    setLoading(true);
    let url = "/api/journal?";
    if (pairFilter) url += `&pair=${pairFilter}`;
    if (styleFilter) url += `&style=${styleFilter}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTrades(data.trades);
      }
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrades();
  }, [pairFilter, styleFilter]);

  const handleDownloadCsv = () => {
    if (trades.length === 0) return;
    
    const headers = ["ID", "Timestamp", "Pair", "Style", "Consensus", "Confidence", "Action", "Entry", "SL", "TP", "RR", "Explanation"];
    const rows = trades.map(t => [
      t.id, t.timestamp, t.pair, t.style, t.consensus, t.confidence, t.action, t.entry, t.stopLoss, t.takeProfit, t.riskReward, 
      // replace commas and newlines so it doesn't break CSV formatting
      `"${t.explanation?.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chartforge_journal_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleEodAnalysis = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: id })
      });
      const data = await res.json();
      if (data.success) {
        alert("EOD Analysis Complete:\n\n" + data.auditReport);
      } else {
        alert("Verification logic failed: " + data.error);
      }
    } catch (e: any) {
      alert("Analysis failed: " + e.message);
    }
    setAnalyzingId(null);
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: "1200px" }}>
      <div className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Trade Journal 📖</h1>
          <p style={{ color: "var(--text-secondary)" }}>Review and reflexively analyze past setups.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/" className="badge" style={{ textDecoration: 'none', padding: '0.8rem 1rem' }}>← Back to Desk</Link>
          <button 
            onClick={handleDownloadCsv}
            style={{
              padding: "0.8rem 1rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--gradient-primary)",
              color: "white",
              fontWeight: 600,
              cursor: "pointer"
            }}>📥 Download CSV</button>
        </div>
      </div>

      <div className="animate-fade-in animate-delay-1" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <select value={pairFilter} onChange={e => setPairFilter(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-subtle)' }}>
          <option value="">All Pairs</option>
          {Object.keys(PAIRS).map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-subtle)' }}>
          <option value="">All Styles</option>
          {[...Object.keys(FX_STYLES), ...Object.keys(PSX_STYLES)].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>Loading journal data...</div>
      ) : trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>No trades logged yet.</h3>
          <p style={{ color: "var(--text-secondary)" }}>Go to the main desk and generate some setups!</p>
        </div>
      ) : (
        <div className="animate-fade-in animate-delay-2" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--bg-card)", borderRadius: "12px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <th style={{ padding: "1rem" }}>Date</th>
                <th style={{ padding: "1rem" }}>Pair/Style</th>
                <th style={{ padding: "1rem" }}>Action</th>
                <th style={{ padding: "1rem" }}>Entry / SL / TP</th>
                <th style={{ padding: "1rem" }}>Explanation</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>EOD Autonomy</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    {new Date(t.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {t.pair} <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.8rem" }}>{t.style}</span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span className="badge" style={{ 
                      background: t.action === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : t.action === 'SELL' ? 'rgba(239, 68, 68, 0.1)' : '',
                      color: t.action === 'BUY' ? '#10B981' : t.action === 'SELL' ? '#EF4444' : 'var(--text-secondary)',
                    }}>{t.action || t.consensus}</span>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.85rem" }}>
                    {t.action ? `🎯 ${t.entry}\n🔴 ${t.stopLoss}\n🟢 ${t.takeProfit}` : "No Action"}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.8rem", maxWidth: "400px", lineHeight: "1.4" }}>
                    {t.explanation?.substring(0, 100)}...
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button 
                      onClick={() => handleEodAnalysis(t.id)}
                      disabled={analyzingId === t.id}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.1)",
                        color: "white",
                        border: "none",
                        cursor: analyzingId === t.id ? "not-allowed" : "pointer",
                        opacity: analyzingId === t.id ? 0.5 : 1
                      }}
                    >
                      {analyzingId === t.id ? "Analyzing..." : "Review Trade"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
