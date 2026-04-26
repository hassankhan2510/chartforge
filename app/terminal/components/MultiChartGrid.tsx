"use client";

import React from 'react';
import { TradingViewWidget } from './TradingViewWidget';

interface MultiChartGridProps {
  pair: string;
  timeframes: string[];
}

/**
 * MultiChartGrid — A professional 3-view trading layout.
 * Each chart is pre-configured with indicators suitable for the style.
 */
export const MultiChartGrid: React.FC<MultiChartGridProps> = ({ pair, timeframes }) => {
  return (
    <div id="capture-grid" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: '1px', 
      background: 'var(--border-medium)',
      border: '1px solid var(--border-medium)',
      borderRadius: '4px',
      overflow: 'hidden',
      padding: '1px'
    }}>
      {timeframes.map((tf, idx) => (
        <div key={`${tf}-${idx}`} style={{ height: '500px', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            top: '8px', 
            left: '12px', 
            zIndex: 10, 
            background: 'rgba(0,0,0,0.7)', 
            padding: '2px 8px', 
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: 'var(--accent-cyan)',
            border: '1px solid var(--border-subtle)',
            pointerEvents: 'none'
          }}>
            {tf.toUpperCase()} TIMEFRAME
          </div>
          <TradingViewWidget 
            symbol={pair} 
            interval={tf === '1h' ? '60' : tf === '1d' ? 'D' : tf === '15m' ? '15' : tf === '5m' ? '5' : '60'}
            indicators={['MASimple@tv-basicstudies', 'BollingerBands@tv-basicstudies', 'RSI@tv-basicstudies']}
          />
        </div>
      ))}
    </div>
  );
};
