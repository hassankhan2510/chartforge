/**
 * ChartForge AI — Constants & Configuration
 * All predefined pairs, styles, and their configurations.
 */

import { PairConfig, StyleConfig, TradingPair, TradingStyle } from './types';

// ============================================
// Trading Pair Configurations
// ============================================

export const PAIRS: Record<TradingPair, PairConfig> = {
  EURUSD: {
    id: 'EURUSD',
    name: 'EUR/USD',
    fullName: 'Euro / US Dollar',
    icon: 'EU',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-600',
    yahooSymbol: 'EURUSD=X',
    category: 'forex',
    pipValue: 0.0001,
    description: 'The world\'s most traded currency pair. High liquidity, tight spreads.',
  },
  GBPUSD: {
    id: 'GBPUSD',
    name: 'GBP/USD',
    fullName: 'British Pound / US Dollar',
    icon: 'GU',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
    yahooSymbol: 'GBPUSD=X',
    category: 'forex',
    pipValue: 0.0001,
    description: 'Cable — volatile with strong London session moves.',
  },
  XAUUSD: {
    id: 'XAUUSD',
    name: 'XAU/USD',
    fullName: 'Gold / US Dollar',
    icon: 'XU',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-yellow-600',
    yahooSymbol: 'GC=F',
    category: 'commodity',
    pipValue: 0.01,
    description: 'Gold — the ultimate safe haven. Massive moves possible.',
  },
  BTCUSD: {
    id: 'BTCUSD',
    name: 'BTC/USD',
    fullName: 'Bitcoin / US Dollar',
    icon: 'BTC',
    color: '#F97316',
    gradient: 'from-orange-500 to-amber-600',
    yahooSymbol: 'BTC-USD',
    category: 'crypto',
    pipValue: 1,
    description: 'Bitcoin — 24/7 market, high volatility, macro-driven.',
  },
  USOIL: {
    id: 'USOIL',
    name: 'US Oil',
    fullName: 'WTI Crude Oil',
    icon: 'WTI',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-600',
    yahooSymbol: 'CL=F',
    category: 'commodity',
    pipValue: 0.01,
    description: 'WTI Crude — geopolitics & supply-driven volatility.',
  },
  SYS: {
    id: 'SYS',
    name: 'SYS',
    fullName: 'Systems Limited',
    icon: 'SYS',
    color: '#06B6D4',
    gradient: 'from-cyan-400 to-blue-500',
    yahooSymbol: 'SYS.KA',
    category: 'psx',
    pipValue: 0.01,
    description: 'PSX IT Leader. Highly responsive to PKR depreciation and tech exports.',
  },
  HUBC: {
    id: 'HUBC',
    name: 'HUBC',
    fullName: 'Hub Power Company',
    icon: 'HUB',
    color: '#EAB308',
    gradient: 'from-yellow-400 to-orange-500',
    yahooSymbol: 'HUBC.KA',
    category: 'psx',
    pipValue: 0.01,
    description: 'Energy giant. Moves heavily on IPP policies and circular debt payouts.',
  },
  LUCK: {
    id: 'LUCK',
    name: 'LUCK',
    fullName: 'Lucky Cement',
    icon: 'LCK',
    color: '#64748B',
    gradient: 'from-slate-400 to-slate-600',
    yahooSymbol: 'LUCK.KA',
    category: 'psx',
    pipValue: 0.01,
    description: 'Cement sector proxy. Reacts to PSDP spending and coal prices.',
  },
  OGDC: {
    id: 'OGDC',
    name: 'OGDC',
    fullName: 'Oil & Gas Development',
    icon: 'OGD',
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-700',
    yahooSymbol: 'OGDC.KA',
    category: 'psx',
    pipValue: 0.01,
    description: 'E&P blue-chip. Driven by circular debt and global oil prices.',
  },
  MEBL: {
    id: 'MEBL',
    name: 'MEBL',
    fullName: 'Meezan Bank',
    icon: 'MEB',
    color: '#14B8A6',
    gradient: 'from-teal-400 to-emerald-600',
    yahooSymbol: 'MEBL.KA',
    category: 'psx',
    pipValue: 0.01,
    description: 'Top Islamic Bank. Driven by SBP interest rates and Shariah inflows.',
  },
  ETHUSD: {
    id: 'ETHUSD',
    name: 'ETH/USD',
    fullName: 'Ethereum / US Dollar',
    icon: 'ETH',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-700',
    yahooSymbol: 'ETH-USD',
    category: 'crypto',
    pipValue: 0.01,
    description: 'Ethereum — The world layer 2 smart contract proxy.',
  },
};

// ============================================
// Trading Style Configurations
// ============================================

export const FX_STYLES: Record<string, StyleConfig> = {
  scalp: {
    id: 'scalp',
    name: 'Scalp',
    description: 'Quick generic captures. Heavy oscillator focus.',
    timeframes: ['1m', '5m', '15m'],
    icon: 'SCP',
    riskPercent: 0.5,
    typicalRR: '1:1.5 to 1:2',
    holdTime: '1-30 minutes',
  },
  day: {
    id: 'day',
    name: 'Day Trade',
    description: 'Intraday setups. Trend + momentum confluence.',
    timeframes: ['15m', '1H', '4H'],
    icon: 'DAY',
    riskPercent: 1.0,
    typicalRR: '1:2 to 1:3',
    holdTime: '1-8 hours',
  },
  swing: {
    id: 'swing',
    name: 'Swing',
    description: 'Multi-day positions. Higher timeframe structures.',
    timeframes: ['4H', 'Daily', 'Weekly'],
    icon: 'SWG',
    riskPercent: 2.0,
    typicalRR: '1:3 to 1:5',
    holdTime: '2-14 days',
  },
};

export const PSX_STYLES: Record<string, StyleConfig> = {
  psx_intraday: {
    id: 'psx_intraday',
    name: 'Lock Hunter',
    description: 'Intraday tracking for upper/lower circuit breaker momentum.',
    timeframes: ['15m', '1H', 'Daily'],
    icon: 'LCK',
    riskPercent: 2.0,
    typicalRR: 'Target 5-7.5%',
    holdTime: 'Intraday (Same Day)',
  },
  psx_swing: {
    id: 'psx_swing',
    name: 'PSX Momentum',
    description: 'Multi-day block tracking for institutional FIPI flows.',
    timeframes: ['1H', 'Daily', 'Weekly'],
    icon: 'MOM',
    riskPercent: 4.0,
    typicalRR: 'Target 10-20%',
    holdTime: '1-4 weeks',
  },
  psx_dividend: {
    id: 'psx_dividend',
    name: 'Value Track',
    description: 'Long-term KSE-100 dividend & value structural investing.',
    timeframes: ['Daily', 'Weekly', 'Monthly'],
    icon: 'VAL',
    riskPercent: 5.0,
    typicalRR: 'Target 30%+ / Div Yield',
    holdTime: '3-12 months',
  },
};

// ============================================
// Helper Functions
// ============================================

export const PAIR_LIST: TradingPair[] = ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD', 'USOIL', 'SYS', 'HUBC', 'LUCK', 'OGDC', 'MEBL'];

export function getStylesForCategory(category: string): Record<string, StyleConfig> {
  return category === 'psx' ? PSX_STYLES : FX_STYLES;
}

export function getStyleConfig(styleId: string): StyleConfig | undefined {
  return FX_STYLES[styleId] || PSX_STYLES[styleId];
}
