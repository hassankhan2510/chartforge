import { TradingPair } from './types';
import { fetchOHLCV } from './data';
import { PAIRS } from './constants';

const TIMEFRAME_TO_YAHOO: Record<string, { interval: string; range: string }> = {
  '1m': { interval: '1m', range: '1d' },
  '5m': { interval: '5m', range: '2d' },
  '15m': { interval: '15m', range: '5d' },
  '1H': { interval: '60m', range: '1mo' },
  '4H': { interval: '60m', range: '1mo' }, // Yahoo doesn't do 4h natively easily, 1h is close enough visually for pattern recognition
  'Daily': { interval: '1d', range: '1y' },
  'Weekly': { interval: '1wk', range: '3y' },
};

/**
 * Builds a 64-based image string from QuickChart.io using Yahoo Finance data.
 */
export async function generateChartImageBase64(
  pair: TradingPair,
  timeframe: string
): Promise<string | null> {
  try {
    const symbol = PAIRS[pair].yahooSymbol;
    const { interval, range } = TIMEFRAME_TO_YAHOO[timeframe] || { interval: '1d', range: '3mo' };

    const bars = await fetchOHLCV(symbol, interval, range);
    if (!bars || bars.length === 0) {
      console.warn(`[Charts] No data for ${symbol} at ${timeframe}`);
      return null;
    }

    // QuickChart prefers around 50-100 bars for a good visual candlestick chart.
    // Let's slice the last 60 bars to make it look zoomed in and modern.
    const recentBars = bars.slice(-75);

    // Calculate EMA series for plotting
    const calculateEmaSeries = (closes: number[], period: number) => {
      const series = new Array(closes.length).fill(null);
      if (closes.length < period) return series;
      
      const multiplier = 2 / (period + 1);
      // SMA for first value
      let ema = closes.slice(0, period).reduce((a, b) => a + b) / period;
      series[period - 1] = ema;
      
      for (let i = period; i < closes.length; i++) {
        ema = (closes[i] - ema) * multiplier + ema;
        series[i] = ema;
      }
      return series;
    };

    const closes = recentBars.map(b => b.close);
    const ema9Series = calculateEmaSeries(closes, 9);
    const ema21Series = calculateEmaSeries(closes, 21);

    // Format data for Chart.js Financial
    const chartData = recentBars.map(b => ({
      x: b.timestamp * 1000,
      o: b.open,
      h: b.high,
      l: b.low,
      c: b.close
    }));

    const ema9Data = recentBars.map((b, i) => ({
      x: b.timestamp * 1000,
      y: ema9Series[i]
    })).filter(d => d.y !== null);

    const ema21Data = recentBars.map((b, i) => ({
      x: b.timestamp * 1000,
      y: ema21Series[i]
    })).filter(d => d.y !== null);

    const chartConfig = {
      type: 'candlestick',
      data: {
        datasets: [
          {
            type: 'line',
            label: 'EMA 9',
            data: ema9Data,
            borderColor: '#3B82F6', // blue-500
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0
          },
          {
            type: 'line',
            label: 'EMA 21',
            data: ema21Data,
            borderColor: '#F59E0B', // amber-500
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0
          },
          {
            type: 'candlestick',
            label: `${pair} - ${timeframe}`,
            data: chartData,
            color: {
              up: '#10B981',
              down: '#EF4444',
              unchanged: '#6B7280',
            }
          }
        ]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        layout: {
          padding: 10
        },
        scales: {
          x: { 
            type: 'timeseries',
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            beginAtZero: false,
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    };

    console.log(`[Charts] Requesting QuickChart for ${pair} ${timeframe}...`);

    const response = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width: 800,
        height: 400,
        version: '3', // Chart.js v3 is required for the candlestick financial plugin
        format: 'png',
        chart: chartConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`QuickChart API returned ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    return base64; // Return raw base64 (analyzeCharts expects it without data URL prefix, or handles it)
  } catch (error) {
    console.error(`[Charts] Failed to generate chart for ${pair} ${timeframe}:`, error);
    return null;
  }
}
