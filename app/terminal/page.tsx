"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MultiChartGrid } from './components/MultiChartGrid';
import { PAIRS, getStyleConfig } from '@/lib/constants';
import { TradingStyle, AnalyzeResponse } from '@/lib/types';
import html2canvas from 'html2canvas';

/**
 * Web Terminal Analysis Engine
 * Allows selection of pair, style, and system with one-click Vision injection.
 */
export default function TerminalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const [pair, setPair] = useState(params?.pair as string || 'EURUSD');
  const [style, setStyle] = useState(params?.style as TradingStyle || 'day');
  const [system, setSystem] = useState('smc');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const styleConfig = getStyleConfig(style);
  const timeframes = styleConfig?.timeframes || ['1h', '15m', '5m'];

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 1. Capture Dashboard Screenshot
      const element = document.getElementById('capture-grid');
      let base64Image = "";
      
      if (element) {
        const canvas = await html2canvas(element, {
            backgroundColor: '#000000',
            useCORS: true,
            scale: 1.5 // High res for AI vision
        });
        base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }

      // 2. Transmit to Ensemble Engine
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair,
          style,
          images: [base64Image, base64Image, base64Image] // Send same dashboard capture as all 3 frames
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Terminal analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '6rem', maxWidth: '1600px' }}>
      
      {/* Header Toolbar */}
      <div className="glass-card" style={{ 
        padding: '1rem 1.5rem', 
        marginBottom: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {">"} QUANT_TERMINAL_V4
            </div>
            
            {/* Pair Selector */}
            <select 
                value={pair} 
                onChange={(e) => setPair(e.target.value)}
                style={{ background: '#111', border: '1px solid var(--border-medium)', color: 'white', padding: '0.4rem', borderRadius: '4px' }}
            >
                {Object.keys(PAIRS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Style Selector */}
            <select 
                value={style} 
                onChange={(e) => setStyle(e.target.value as TradingStyle)}
                style={{ background: '#111', border: '1px solid var(--border-medium)', color: 'white', padding: '0.4rem', borderRadius: '4px' }}
            >
                <option value="scalp">SCALP</option>
                <option value="day">DAY</option>
                <option value="swing">SWING</option>
                <option value="psx_swing">PSX SWING</option>
            </select>

            {/* System Selector */}
            <select 
                value={system} 
                onChange={(e) => setSystem(e.target.value)}
                style={{ background: '#111', border: '1px solid var(--border-medium)', color: 'white', padding: '0.4rem', borderRadius: '4px' }}
            >
                <option value="standard">STANDARD PA</option>
                <option value="smc">SMC / ICT</option>
                <option value="wyckoff">WYCKOFF</option>
            </select>
        </div>

        <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="hover-lift"
            style={{ 
                background: 'var(--accent-blue)', 
                color: 'white', 
                border: 'none', 
                padding: '0.6rem 2rem', 
                fontWeight: 800, 
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
            }}
        >
            {loading ? 'RUNNING DEBATE...' : 'ONE-CLICK ANALYZE'}
        </button>
      </div>

      {/* Main Terminal Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 380px' : '1fr', gap: '1rem', height: 'calc(100vh - 180px)' }}>
        
        {/* Charts Side */}
        <div style={{ overflowY: 'auto' }}>
            <MultiChartGrid pair={pair} timeframes={timeframes} />
        </div>

        {/* AI Report Sidebar */}
        {result && result.synthesized && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', borderLeft: '2px solid var(--accent-blue)' }}>
                <h2 className="mono" style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>{">"} SYNTHESIS_REPORT</h2>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>VERDICT</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{result.synthesized.consensus}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CONFIDENCE</div>
                        <div style={{ fontWeight: 700 }}>{result.synthesized.confidence}%</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACTION</div>
                        <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{result.synthesized.action}</div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LEVELS</div>
                    <div className="mono" style={{ fontSize: '0.8rem', background: '#111', padding: '0.75rem', borderRadius: '4px' }}>
                        EP: {result.synthesized.entry || 'TBD'}<br/>
                        SL: {result.synthesized.stopLoss || 'TBD'}<br/>
                        TP: {result.synthesized.takeProfit || 'TBD'}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RATIONALE</div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                        {result.synthesized.explanation}
                    </p>
                </div>
            </div>
        )}

        {loading && (
            <div style={{ 
                position: 'fixed', 
                top: 0, left: 0, right: 0, bottom: 0, 
                background: 'rgba(0,0,0,0.8)', 
                zIndex: 1000, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div className="loading-spinner"></div>
                <div className="mono" style={{ letterSpacing: '0.2em', color: 'var(--accent-blue)' }}>SYNCHRONIZING_AGENTS</div>
            </div>
        )}
      </div>

    </div>
  );
}
