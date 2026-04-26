"use client";

import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  interval: string;
  indicators?: string[];
}

/**
 * Reusable TradingView Advanced Chart Widget
 */
export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol, interval, indicators = [] }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          "autosize": true,
          "symbol": symbol.includes(':') ? symbol : `FX:${symbol}`,
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": container.current?.id,
          "studies": indicators,
          "backgroundColor": "rgba(5, 5, 8, 1)",
          "gridColor": "rgba(30, 30, 30, 0.05)",
          "save_image": false,
        });
      }
    };
    document.head.appendChild(script);
  }, [symbol, interval, indicators]);

  const id = `tv_widget_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div id={id} ref={container} style={{ height: '100%', width: '100%' }} />
  );
};
