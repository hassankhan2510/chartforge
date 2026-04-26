/**
 * ChartForge AI — Core Type Definitions
 * All TypeScript interfaces for the application
 */

// ============================================
// Trading Pair & Style Types
// ============================================

export type TradingPair = 'EURUSD' | 'GBPUSD' | 'XAUUSD' | 'BTCUSD' | 'ETHUSD' | 'USOIL' | 'SYS' | 'HUBC' | 'LUCK' | 'OGDC' | 'MEBL';

export type TradingStyle = 'scalp' | 'day' | 'swing' | 'psx_intraday' | 'psx_swing' | 'psx_dividend';

export interface PairConfig {
  id: TradingPair;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  gradient: string;
  yahooSymbol: string;
  category: 'forex' | 'commodity' | 'crypto' | 'psx';
  pipValue: number;
  description: string;
}

export interface StyleConfig {
  id: TradingStyle;
  name: string;
  description: string;
  timeframes: [string, string, string];
  icon: string;
  riskPercent: number;
  typicalRR: string;
  holdTime: string;
}

// ============================================
// Session & Fundamental Types
// ============================================

export type MarketSession = 'Asian' | 'London' | 'New York' | 'London-NY Overlap' | 'Pacific' | 'Weekend' | 'PSX Open' | 'PSX Closed';

export interface SessionInfo {
  currentSession: MarketSession;
  pktTime: string;
  utcTime: string;
  sessionDescription: string;
  volatilityExpectation: 'Low' | 'Medium' | 'High' | 'Very High';
  bestPairsForSession: string[];
  sessionOpenClose: string;
  nextSession: string;
  nextSessionIn: string;
}

export interface MacroContext {
  dxyBias: string;
  riskSentiment: string;
  keyEvents: string[];
  correlationNotes: string[];
}

// ============================================
// Technical Indicator Types
// ============================================

export interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScalpIndicators {
  rsi14: number;
  stochasticK: number;
  stochasticD: number;
  cci20: number;
  williamsR: number;
  atr14: number;
  ema9: number;
  ema21: number;
  vwap: number | null;
  volumeDelta: string;
  microSupport: number[];
  microResistance: number[];
  spreadEstimate: string;
}

export interface DayIndicators {
  ema9: number;
  ema21: number;
  ema50: number;
  sma200: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  superTrend: number;
  superTrendDirection: 'bullish' | 'bearish';
  pivotPoint: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  fibLevels: Record<string, number>;
  atr14: number;
  rsi14: number;
  adx: number;
}

export interface SwingIndicators {
  ichimokuTenkan: number;
  ichimokuKijun: number;
  ichimokuSenkouA: number;
  ichimokuSenkouB: number;
  ichimokuChikou: number;
  adx: number;
  adxPlusDI: number;
  adxMinusDI: number;
  fibExtensions: Record<string, number>;
  weeklySupport: number[];
  weeklyResistance: number[];
  ema50: number;
  ema200: number;
  rsi14: number;
  macdLine: number;
  macdSignal: number;
  atr14: number;
  volumeProfile: string;
}

export type StyleIndicators = ScalpIndicators | DayIndicators | SwingIndicators;

export interface MechanicalData {
  pair: TradingPair;
  style: TradingStyle;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  dailyHigh: number;
  dailyLow: number;
  indicators: StyleIndicators;
  ohlcvSummary: string;
  dataTimestamp: string;
}

// ============================================
// Analysis & Report Types
// ============================================

export interface VisionAnalysis {
  timeframe: string;
  patterns: string;
  keyLevels: string;
  candlestickBehavior: string;
  divergences: string;
  overallBias: string;
}

export interface TradeSetup {
  direction: 'LONG' | 'SHORT';
  entry: string;
  stopLoss: string;
  target1: string;
  target2: string;
  target3?: string;
  riskReward: string;
  confidence: string;
  reasoning: string;
}

export interface AnalysisReport {
  sessionContext: SessionInfo;
  macroContext: MacroContext;
  mechanicalData: MechanicalData;
  visionInsights: VisionAnalysis[];
  masterAnalysis: string;
  tradeSetups: TradeSetup[];
  riskWarning: string;
  timestamp: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface AnalyzeRequest {
  pair: TradingPair;
  style: TradingStyle;
  images: string[]; // base64 encoded images
}

export interface AgentResponse {
  agentName: string;
  verdict: string;
}

export interface SynthesizedReport {
  consensus: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  action: 'BUY' | 'SELL' | null;
  entry: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  riskReward: string | null;
  explanation: string;
}

export interface AnalyzeResponse {
  success: boolean;
  agents?: AgentResponse[];
  synthesized?: SynthesizedReport;
  report?: AnalysisReport;
  rawAnalysis?: string;
  error?: string;
  processingTime?: number;
}

// ============================================
// UI State Types
// ============================================

export interface UploadedChart {
  file: File;
  preview: string;
  base64: string;
  timeframe: string;
}

export type AnalysisStep = 
  | 'idle'
  | 'session-detection'
  | 'fetching-data'
  | 'computing-indicators'
  | 'vision-analysis'
  | 'master-synthesis'
  | 'complete'
  | 'error';
