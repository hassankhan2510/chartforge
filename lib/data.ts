/**
 * ChartForge AI — Market Data & Technical Indicator Engine
 * Fetches OHLCV data and computes style-specific indicators.
 * This is Step 2 of the analysis pipeline — pure numbers, NO LLM calls.
 * 
 * Uses Yahoo Finance API proxy for free real-time data
 * and the technicalindicators library for computations.
 */

import {
  TradingPair,
  TradingStyle,
  MechanicalData,
  OHLCVBar,
  ScalpIndicators,
  DayIndicators,
  SwingIndicators,
} from './types';
import { PAIRS } from './constants';

// ============================================
// Yahoo Finance Data Fetching
// ============================================

interface YahooQuote {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
  regularMarketVolume: number;
}

interface YahooChartResult {
  timestamp: number[];
  indicators: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
}

/**
 * Fetches current quote data from Yahoo Finance.
 */
async function fetchQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) throw new Error(`Yahoo API returned ${res.status}`);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) throw new Error('No meta data in response');

    return {
      regularMarketPrice: meta.regularMarketPrice ?? meta.previousClose,
      regularMarketChange: (meta.regularMarketPrice ?? 0) - (meta.previousClose ?? 0),
      regularMarketChangePercent: meta.previousClose ? 
        (((meta.regularMarketPrice ?? 0) - meta.previousClose) / meta.previousClose) * 100 : 0,
      regularMarketDayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      regularMarketDayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      regularMarketOpen: meta.regularMarketOpen ?? meta.previousClose,
      regularMarketPreviousClose: meta.previousClose ?? 0,
      regularMarketVolume: meta.regularMarketVolume ?? 0,
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetches OHLCV chart data from Yahoo Finance for indicator computation.
 */
export async function fetchOHLCV(
  symbol: string,
  interval: string = '1h',
  range: string = '30d'
): Promise<OHLCVBar[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) throw new Error(`Yahoo chart API returned ${res.status}`);

    const data = await res.json();
    const result: YahooChartResult = data?.chart?.result?.[0];

    if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
      throw new Error('Invalid chart data structure');
    }

    const quote = result.indicators.quote[0];
    const bars: OHLCVBar[] = [];

    for (let i = 0; i < result.timestamp.length; i++) {
      if (quote.close[i] != null) {
        bars.push({
          timestamp: result.timestamp[i],
          open: quote.open[i] ?? quote.close[i],
          high: quote.high[i] ?? quote.close[i],
          low: quote.low[i] ?? quote.close[i],
          close: quote.close[i],
          volume: quote.volume[i] ?? 0,
        });
      }
    }

    return bars;
  } catch (error) {
    console.error(`Failed to fetch OHLCV for ${symbol}:`, error);
    return [];
  }
}

// ============================================
// Technical Indicator Computations
// ============================================

/** Simple Moving Average */
export function sma(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] ?? 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Exponential Moving Average */
export function ema(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (data.length < period) return sma(data, data.length);
  
  const multiplier = 2 / (period + 1);
  let emaValue = sma(data.slice(0, period), period);
  
  for (let i = period; i < data.length; i++) {
    emaValue = (data[i] - emaValue) * multiplier + emaValue;
  }
  return emaValue;
}

/** Relative Strength Index */
function rsi(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/** Stochastic Oscillator */
function stochastic(highs: number[], lows: number[], closes: number[], period: number = 14): { k: number; d: number } {
  if (closes.length < period) return { k: 50, d: 50 };
  
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  const currentClose = closes[closes.length - 1];
  const k = highestHigh === lowestLow ? 50 : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // Simple %D as 3-period SMA of %K (simplified to just %K here)
  return { k, d: k }; // In production, compute proper %D
}

/** Commodity Channel Index */
function cci(highs: number[], lows: number[], closes: number[], period: number = 20): number {
  if (closes.length < period) return 0;
  
  const typicalPrices = closes.slice(-period).map((c, i) => {
    const idx = closes.length - period + i;
    return (highs[idx] + lows[idx] + c) / 3;
  });
  
  const tp = typicalPrices[typicalPrices.length - 1];
  const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period;
  const meanDev = typicalPrices.reduce((a, b) => a + Math.abs(b - smaTP), 0) / period;
  
  return meanDev === 0 ? 0 : (tp - smaTP) / (0.015 * meanDev);
}

/** Williams %R */
function williamsR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (closes.length < period) return -50;
  
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  const currentClose = closes[closes.length - 1];
  
  return highestHigh === lowestLow ? -50 : ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
}

/** Average True Range */
function atr(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return highs[highs.length - 1] - lows[lows.length - 1];
  
  let trSum = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trSum += tr;
  }
  return trSum / period;
}

/** MACD */
function macd(closes: number[]): { line: number; signal: number; histogram: number } {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12 - ema26;
  // Simplified signal line
  const signal = macdLine * 0.8; // Approximate
  return { line: macdLine, signal, histogram: macdLine - signal };
}

/** Pivot Points (Standard) */
function pivotPoints(high: number, low: number, close: number) {
  const pp = (high + low + close) / 3;
  return {
    pivotPoint: pp,
    r1: 2 * pp - low,
    r2: pp + (high - low),
    r3: high + 2 * (pp - low),
    s1: 2 * pp - high,
    s2: pp - (high - low),
    s3: low - 2 * (high - pp),
  };
}

/** Fibonacci Retracement Levels */
function fibonacciLevels(high: number, low: number): Record<string, number> {
  const diff = high - low;
  return {
    '0.0': high,
    '0.236': high - diff * 0.236,
    '0.382': high - diff * 0.382,
    '0.5': high - diff * 0.5,
    '0.618': high - diff * 0.618,
    '0.786': high - diff * 0.786,
    '1.0': low,
    '1.272': low - diff * 0.272,
    '1.618': low - diff * 0.618,
  };
}

/** ADX (simplified) */
function adx(highs: number[], lows: number[], closes: number[], period: number = 14): { adx: number; plusDI: number; minusDI: number } {
  if (closes.length < period * 2) return { adx: 25, plusDI: 25, minusDI: 25 };
  
  let plusDM = 0;
  let minusDM = 0;
  let trTotal = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    if (upMove > downMove && upMove > 0) plusDM += upMove;
    if (downMove > upMove && downMove > 0) minusDM += downMove;
    
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trTotal += tr;
  }
  
  const plusDI = trTotal === 0 ? 0 : (plusDM / trTotal) * 100;
  const minusDI = trTotal === 0 ? 0 : (minusDM / trTotal) * 100;
  const dx = (plusDI + minusDI) === 0 ? 0 : (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
  
  return { adx: dx, plusDI, minusDI };
}

/** Ichimoku Cloud (simplified) */
function ichimoku(highs: number[], lows: number[], closes: number[]) {
  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;
  
  const tenkan = (Math.max(...highs.slice(-tenkanPeriod)) + Math.min(...lows.slice(-tenkanPeriod))) / 2;
  const kijun = (Math.max(...highs.slice(-kijunPeriod)) + Math.min(...lows.slice(-kijunPeriod))) / 2;
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = highs.length >= senkouBPeriod 
    ? (Math.max(...highs.slice(-senkouBPeriod)) + Math.min(...lows.slice(-senkouBPeriod))) / 2
    : senkouA;
  const chikou = closes[closes.length - 1];
  
  return { tenkan, kijun, senkouA, senkouB, chikou };
}

/** Find support/resistance levels */
function findSupportResistance(highs: number[], lows: number[], closes: number[], count: number = 3): { supports: number[]; resistances: number[] } {
  const currentPrice = closes[closes.length - 1];
  const allLevels = [...highs, ...lows].sort((a, b) => a - b);
  
  // Cluster levels that are close together
  const clusters: number[] = [];
  let cluster: number[] = [allLevels[0]];
  const threshold = currentPrice * 0.002; // 0.2% threshold
  
  for (let i = 1; i < allLevels.length; i++) {
    if (allLevels[i] - allLevels[i - 1] < threshold) {
      cluster.push(allLevels[i]);
    } else {
      clusters.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
      cluster = [allLevels[i]];
    }
  }
  clusters.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
  
  const supports = clusters.filter(l => l < currentPrice).slice(-count);
  const resistances = clusters.filter(l => l > currentPrice).slice(0, count);
  
  return { supports, resistances };
}

// ============================================
// Style-Specific Indicator Computation
// ============================================

function computeScalpIndicators(bars: OHLCVBar[]): ScalpIndicators {
  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const currentPrice = closes[closes.length - 1];

  const stoch = stochastic(highs, lows, closes);
  const sr = findSupportResistance(highs, lows, closes, 3);

  return {
    rsi14: round(rsi(closes, 14), 2),
    stochasticK: round(stoch.k, 2),
    stochasticD: round(stoch.d, 2),
    cci20: round(cci(highs, lows, closes, 20), 2),
    williamsR: round(williamsR(highs, lows, closes), 2),
    atr14: round(atr(highs, lows, closes, 14), 5),
    ema9: round(ema(closes, 9), 5),
    ema21: round(ema(closes, 21), 5),
    vwap: null, // VWAP requires intraday volume data
    volumeDelta: bars[bars.length - 1]?.volume > sma(bars.map(b => b.volume), 20) ? 'Above Average' : 'Below Average',
    microSupport: sr.supports.map(s => round(s, 5)),
    microResistance: sr.resistances.map(r => round(r, 5)),
    spreadEstimate: currentPrice < 10 ? 'Tight (1-2 pips)' : currentPrice < 100 ? 'Medium (3-5 pips)' : 'Wide (varies)',
  };
}

function computeDayIndicators(bars: OHLCVBar[]): DayIndicators {
  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);

  const macdResult = macd(closes);
  const lastBar = bars[bars.length - 1];
  const prevBar = bars[bars.length - 2] || lastBar;
  const pivots = pivotPoints(prevBar.high, prevBar.low, prevBar.close);
  
  // Fibonacci from recent swing
  const recentHighs = highs.slice(-50);
  const recentLows = lows.slice(-50);
  const swingHigh = Math.max(...recentHighs);
  const swingLow = Math.min(...recentLows);
  const fibs = fibonacciLevels(swingHigh, swingLow);

  // SuperTrend (simplified)
  const atrVal = atr(highs, lows, closes, 10);
  const hl2 = (lastBar.high + lastBar.low) / 2;
  const upperBand = hl2 + 3 * atrVal;
  const lowerBand = hl2 - 3 * atrVal;
  const superTrendDir = lastBar.close > lowerBand ? 'bullish' : 'bearish';

  const adxResult = adx(highs, lows, closes);

  return {
    ema9: round(ema(closes, 9), 5),
    ema21: round(ema(closes, 21), 5),
    ema50: round(ema(closes, 50), 5),
    sma200: round(sma(closes, 200), 5),
    macdLine: round(macdResult.line, 5),
    macdSignal: round(macdResult.signal, 5),
    macdHistogram: round(macdResult.histogram, 5),
    superTrend: round(superTrendDir === 'bullish' ? lowerBand : upperBand, 5),
    superTrendDirection: superTrendDir,
    ...pivots,
    pivotPoint: round(pivots.pivotPoint, 5),
    r1: round(pivots.r1, 5),
    r2: round(pivots.r2, 5),
    r3: round(pivots.r3, 5),
    s1: round(pivots.s1, 5),
    s2: round(pivots.s2, 5),
    s3: round(pivots.s3, 5),
    fibLevels: Object.fromEntries(Object.entries(fibs).map(([k, v]) => [k, round(v, 5)])),
    atr14: round(atr(highs, lows, closes, 14), 5),
    rsi14: round(rsi(closes, 14), 2),
    adx: round(adxResult.adx, 2),
  };
}

function computeSwingIndicators(bars: OHLCVBar[]): SwingIndicators {
  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);

  const ich = ichimoku(highs, lows, closes);
  const adxResult = adx(highs, lows, closes);
  const macdResult = macd(closes);

  // Fibonacci extensions from major swing
  const swingHigh = Math.max(...highs);
  const swingLow = Math.min(...lows);
  const fibs = fibonacciLevels(swingHigh, swingLow);

  const sr = findSupportResistance(highs, lows, closes, 3);

  // Volume profile (simplified)
  const avgVol = sma(bars.map(b => b.volume), 20);
  const recentVol = sma(bars.slice(-5).map(b => b.volume), 5);
  const volumeProfile = recentVol > avgVol * 1.5
    ? 'High volume expansion — strong conviction move'
    : recentVol > avgVol
    ? 'Above average volume — moderate participation'
    : 'Below average volume — weak participation, potential false move';

  return {
    ichimokuTenkan: round(ich.tenkan, 5),
    ichimokuKijun: round(ich.kijun, 5),
    ichimokuSenkouA: round(ich.senkouA, 5),
    ichimokuSenkouB: round(ich.senkouB, 5),
    ichimokuChikou: round(ich.chikou, 5),
    adx: round(adxResult.adx, 2),
    adxPlusDI: round(adxResult.plusDI, 2),
    adxMinusDI: round(adxResult.minusDI, 2),
    fibExtensions: Object.fromEntries(Object.entries(fibs).map(([k, v]) => [k, round(v, 5)])),
    weeklySupport: sr.supports.map(s => round(s, 5)),
    weeklyResistance: sr.resistances.map(r => round(r, 5)),
    ema50: round(ema(closes, 50), 5),
    ema200: round(ema(closes, Math.min(200, closes.length)), 5),
    rsi14: round(rsi(closes, 14), 2),
    macdLine: round(macdResult.line, 5),
    macdSignal: round(macdResult.signal, 5),
    atr14: round(atr(highs, lows, closes, 14), 5),
    volumeProfile,
  };
}

// ============================================
// Main Data Fetching Function
// ============================================

/**
 * Fetches market data and computes all style-specific technical indicators.
 * Returns a complete MechanicalData object for the analysis pipeline.
 */
export async function getMechanicalData(
  pair: TradingPair,
  style: TradingStyle
): Promise<MechanicalData> {
  const pairConfig = PAIRS[pair];
  const symbol = pairConfig.yahooSymbol;

  // Determine interval and range based on style
  const chartParams: Record<TradingStyle, { interval: string; range: string }> = {
    scalp: { interval: '5m', range: '5d' },
    day: { interval: '1h', range: '30d' },
    swing: { interval: '1d', range: '6mo' },
    // PSX Modes - No 5m extraction to avoid liquidity gaps
    psx_intraday: { interval: '1h', range: '5d' },
    psx_swing: { interval: '1d', range: '1mo' },
    psx_dividend: { interval: '1d', range: '6mo' },
  };

  const params = chartParams[style];

  // Fetch data in parallel
  const [quote, bars] = await Promise.all([
    fetchQuote(symbol),
    fetchOHLCV(symbol, params.interval, params.range),
  ]);

  const currentPrice = quote?.regularMarketPrice ?? bars[bars.length - 1]?.close ?? 0;

  // Compute style-specific indicators
  let indicators;
  if (bars.length > 0) {
    switch (style) {
      // Forex generic
      case 'scalp':
        indicators = computeScalpIndicators(bars);
        break;
      case 'day':
      case 'psx_intraday':
        indicators = computeDayIndicators(bars);
        break;
      case 'swing':
      case 'psx_swing':
      case 'psx_dividend':
        indicators = computeSwingIndicators(bars);
        break;
    }
  } else {
    // Fallback with zeros if no data
    indicators = getDefaultIndicators(style);
  }

  // Generate OHLCV summary text
  const last5 = bars.slice(-5);
  const ohlcvSummary = last5
    .map(b => {
      const date = new Date(b.timestamp * 1000).toISOString().split('T')[0];
      return `${date}: O=${round(b.open, 5)} H=${round(b.high, 5)} L=${round(b.low, 5)} C=${round(b.close, 5)} V=${b.volume}`;
    })
    .join('\n');

  return {
    pair,
    style,
    currentPrice: round(currentPrice, 5),
    dailyChange: round(quote?.regularMarketChange ?? 0, 5),
    dailyChangePercent: round(quote?.regularMarketChangePercent ?? 0, 2),
    dailyHigh: round(quote?.regularMarketDayHigh ?? 0, 5),
    dailyLow: round(quote?.regularMarketDayLow ?? 0, 5),
    indicators,
    ohlcvSummary,
    dataTimestamp: new Date().toISOString(),
  };
}

// ============================================
// Utility Functions
// ============================================

function round(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function getDefaultIndicators(style: TradingStyle): ScalpIndicators | DayIndicators | SwingIndicators {
  if (style === 'scalp') {
    return {
      rsi14: 50, stochasticK: 50, stochasticD: 50, cci20: 0, williamsR: -50,
      atr14: 0, ema9: 0, ema21: 0, vwap: null, volumeDelta: 'N/A',
      microSupport: [], microResistance: [], spreadEstimate: 'N/A',
    };
  } else if (style === 'day' || style === 'psx_intraday') {
    return {
      ema9: 0, ema21: 0, ema50: 0, sma200: 0,
      macdLine: 0, macdSignal: 0, macdHistogram: 0,
      superTrend: 0, superTrendDirection: 'bullish',
      pivotPoint: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0,
      fibLevels: {}, atr14: 0, rsi14: 50, adx: 25,
    };
  } else {
    // Swing / Dividend models
    return {
      ichimokuTenkan: 0, ichimokuKijun: 0, ichimokuSenkouA: 0,
      ichimokuSenkouB: 0, ichimokuChikou: 0,
      adx: 25, adxPlusDI: 25, adxMinusDI: 25,
      fibExtensions: {}, weeklySupport: [], weeklyResistance: [],
      ema50: 0, ema200: 0, rsi14: 50, macdLine: 0, macdSignal: 0,
      atr14: 0, volumeProfile: 'N/A',
    };
  }
}
