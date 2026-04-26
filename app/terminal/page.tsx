"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MultiChartGrid } from './components/MultiChartGrid';
import { PAIRS, getStyleConfig } from '@/lib/constants';
import { TradingStyle, AnalyzeResponse } from '@/lib/types';
import html2canvas from 'html2canvas';

/**
 * Web Terminal — GHOST PROTOCOL V4
 * Features:
 * 1. Stealth Mode (Monochromatic Terminal)
 * 2. Keyboard Shortcuts (A: Analyze, G: Toggle Stealth)
 * 3. Matrix Overlay Analysis
 */
export default function TerminalPage() {
  const params = useParams();
  
  const [pair, setPair] = useState(params?.pair as string || 'EURUSD');
  const [style, setStyle] = useState(params?.style as TradingStyle || 'day');
  const [system, setSystem] = useState('smc');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isGhost, setIsGhost] = useState(false);

  const styleConfig = getStyleConfig(style);
  const timeframes = styleConfig?.timeframes || ['1h', '15m', '5m'];

  const handleAnalyze = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);

    try {
      const element = document.getElementById('capture-grid');
      let base64Image = "";
      
      if (element) {
        const canvas = await html2canvas(element, {
            backgroundColor: isGhost ? '#000000' : '#050508',
            useCORS: true,
            scale: 1.5
        });
        base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair,
          style,
          system,
          images: [base64Image, base64Image, base64Image]
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Terminal analysis failed:", err);
    } finally {
      setLoading(false);
    }
  }, [pair, style, system, loading, isGhost]);

  // Keyboard Shortcuts Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

        if (e.key.toLowerCase() === 'a') {
            handleAnalyze();
        }
        if (e.key.toLowerCase() === 'g') {
            setIsGhost(prev => !prev);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnalyze]);

  return (
    <div className={`terminal-root ${isGhost ? 'ghost' : ''}`} style={{ transition: 'all 0.5s ease' }}>
        <div className="container" style={{ paddingTop: '6rem', maxWidth: '1600px', position: 'relative', zIndex: 10 }}>
        
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
                    {">"} {isGhost ? 'GHOST_MODE_ENABLED' : 'QUANT_TERMINAL_V4'}
                </div>
                
                <select 
                    value={pair} 
                    onChange={(e) => setPair(e.target.value)}
                    style={{ background: '#000', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '4px' }}
                >
                    {Object.keys(PAIRS).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    value={style} 
                    onChange={(e) => setStyle(e.target.value as TradingStyle)}
                    style={{ background: '#000', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '4px' }}
                >
                    <option value="scalp">SCALP</option>
                    <option value="day">DAY</option>
                    <option value="swing">SWING</option>
                    <option value="psx_swing">PSX SWING</option>
                </select>

                <select 
                    value={system} 
                    onChange={(e) => setSystem(e.target.value)}
                    style={{ background: '#000', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '4px' }}
                >
                    <option value="standard">STANDARD PA</option>
                    <option value="smc">SMC / ICT</option>
                    <option value="wyckoff">WYCKOFF</option>
                </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    [A]: ANALYZE | [G]: GHOST
                </span>
                <button 
                    onClick={handleAnalyze} 
                    disabled={loading}
                    style={{ 
                        background: 'var(--accent-blue)', 
                        color: isGhost ? '#000' : 'white', 
                        border: 'none', 
                        padding: '0.6rem 2rem', 
                        fontWeight: 800, 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    {loading ? 'EXECUTING...' : 'RUN_ANALYSIS'}
                </button>
            </div>
        </div>

        {/* Main Terminal Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 380px' : '1fr', gap: '1rem', height: 'calc(100vh - 180px)' }}>
            
            <div style={{ overflowY: 'auto' }}>
                <MultiChartGrid pair={pair} timeframes={timeframes} />
            </div>

            {result && result.synthesized && (
                <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', borderLeft: '2px solid var(--accent-blue)', background: 'var(--bg-card)' }}>
                    <h2 className="mono" style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>{">"} SESSION_RESULT</h2>
                    
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>VERDICT</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{result.synthesized.consensus}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>CONFIDENCE</div>
                            <div style={{ fontWeight: 700 }}>{result.synthesized.confidence}%</div>
                        </div>
                        <div>
                            <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ACTION</div>
                            <div style={{ fontWeight: 700, color: isGhost ? '#fff' : 'var(--accent-green)' }}>{result.synthesized.action}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>LEVELS</div>
                        <div className="mono" style={{ fontSize: '0.8rem', background: '#080808', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-medium)' }}>
                            EP: {result.synthesized.entry || 'TBD'}<br/>
                            SL: {result.synthesized.stopLoss || 'TBD'}<br/>
                            TP: {result.synthesized.takeProfit || 'TBD'}
                        </div>
                    </div>

                    <div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>RATIONALE</div>
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-primary)', opacity: 0.9 }}>
                            {result.synthesized.explanation}
                        </p>
                    </div>
                </div>
            )}
        </div>
        </div>

        {/* Global Loading Overlay */}
        {loading && (
            <div style={{ 
                position: 'fixed', 
                top: 0, left: 0, right: 0, bottom: 0, 
                background: 'rgba(0,0,0,0.9)', 
                zIndex: 1000, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ width: '40px', height: '40px', border: '2px solid #00ff41', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div className="mono" style={{ letterSpacing: '0.3em', color: '#00ff41' }}>{isGhost ? 'BYPASSING_MARKET_NOISE...' : 'ANALYZING_MESSY_DATA...'}</div>
            </div>
        )}
    </div>
  );
}
