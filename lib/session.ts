/**
 * ChartForge AI — Session & Fundamental Engine
 * Detects current market session based on PKT time and provides macro context.
 * This is Step 1 of the analysis pipeline — NO LLM calls here.
 */

import { SessionInfo, MacroContext, MarketSession, TradingPair } from './types';

// ============================================
// Session Timing Rules (in UTC hours)
// ============================================

interface SessionWindow {
  name: MarketSession;
  startUTC: number;
  endUTC: number;
  description: string;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  bestPairs: string[];
}

const SESSION_WINDOWS: SessionWindow[] = [
  {
    name: 'Pacific',
    startUTC: 21,
    endUTC: 0,
    description: 'Pacific session — Sydney open. Low liquidity, tight ranges. Avoid major entries unless AUD/NZD pairs.',
    volatility: 'Low',
    bestPairs: ['AUDUSD', 'NZDUSD'],
  },
  {
    name: 'Asian',
    startUTC: 0,
    endUTC: 8,
    description: 'Asian session — Tokyo is the driver. JPY pairs move. Gold often consolidates. BTC can see Asian whale activity.',
    volatility: 'Medium',
    bestPairs: ['USDJPY', 'EURJPY', 'XAUUSD', 'BTCUSD'],
  },
  {
    name: 'London',
    startUTC: 7,
    endUTC: 12,
    description: 'London session — Highest forex liquidity. GBP and EUR pairs surge. Gold breakouts common. Oil reacts to European data.',
    volatility: 'High',
    bestPairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USOIL'],
  },
  {
    name: 'London-NY Overlap',
    startUTC: 12,
    endUTC: 16,
    description: 'London-NY Overlap — MAXIMUM volatility window. 70% of daily volume. All pairs move aggressively. Best scalping window.',
    volatility: 'Very High',
    bestPairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'USOIL'],
  },
  {
    name: 'New York',
    startUTC: 12,
    endUTC: 21,
    description: 'New York session — USD pairs dominate. Oil inventories & Fed speakers move markets. BTC follows US equity sentiment.',
    volatility: 'High',
    bestPairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USOIL', 'BTCUSD'],
  },
];

// ============================================
// Session Detection Logic
// ============================================

/**
 * Determines the currently active market session based on current UTC time.
 * Handles overlap detection (London-NY overlap takes priority).
 */
function detectSession(utcHour: number, category: string = 'forex'): SessionWindow {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();

  // PSX Sector Logic (PKT = UTC+5)
  // PSX Markets are open Mon-Fri 09:30 - 15:30 PKT (04:30 - 10:30 UTC)
  if (category === 'psx') {
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      return { name: 'Weekend', startUTC: 0, endUTC: 0, description: 'PSX is closed on weekends.', volatility: 'Low', bestPairs: [] };
    }
    const currentMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const openMins = 4 * 60 + 30; // 04:30 UTC
    const closeMins = 10 * 60 + 30; // 10:30 UTC

    if (currentMins >= openMins && currentMins <= closeMins) {
      return {
        name: 'PSX Open', startUTC: 4.5, endUTC: 10.5,
        description: 'PSX is actively trading. liquidity is highest in first and last hours.',
        volatility: 'High', bestPairs: ['SYS', 'HUBC', 'LUCK', 'OGDC', 'MEBL']
      };
    } else {
      return {
        name: 'PSX Closed', startUTC: 10.5, endUTC: 4.5,
        description: 'PSX is currently closed. Market orders will be queued for next open.',
        volatility: 'Low', bestPairs: []
      };
    }
  }

  // Forex Weekend check (simplified — actual forex closes Friday 21:00 UTC, opens Sunday 21:00 UTC)
  if (dayOfWeek === 6 || (dayOfWeek === 0 && utcHour < 21) || (dayOfWeek === 5 && utcHour >= 21)) {
    return {
      name: 'Weekend',
      startUTC: 0,
      endUTC: 0,
      description: 'Markets are closed for the weekend. Use this time to review past trades and plan for the week ahead.',
      volatility: 'Low',
      bestPairs: [],
    };
  }

  // London-NY Overlap takes priority (12:00 - 16:00 UTC)
  if (utcHour >= 12 && utcHour < 16) {
    return SESSION_WINDOWS.find(s => s.name === 'London-NY Overlap')!;
  }

  // Check other sessions
  if (utcHour >= 7 && utcHour < 12) {
    return SESSION_WINDOWS.find(s => s.name === 'London')!;
  }
  if (utcHour >= 16 && utcHour < 21) {
    return SESSION_WINDOWS.find(s => s.name === 'New York')!;
  }
  if (utcHour >= 0 && utcHour < 7) {
    return SESSION_WINDOWS.find(s => s.name === 'Asian')!;
  }

  // Pacific/transition
  return SESSION_WINDOWS.find(s => s.name === 'Pacific')!;
}

/**
 * Calculates the next session and time until it starts.
 */
function getNextSession(currentSession: MarketSession, utcHour: number): { next: string; timeUntil: string } {
  const sessionOrder: MarketSession[] = ['Asian', 'London', 'London-NY Overlap', 'New York', 'Pacific'];
  const sessionStarts: Record<string, number> = {
    'Asian': 0,
    'London': 7,
    'London-NY Overlap': 12,
    'New York': 16,
    'Pacific': 21,
  };

  const currentIndex = sessionOrder.indexOf(currentSession);
  const nextIndex = (currentIndex + 1) % sessionOrder.length;
  const nextSession = sessionOrder[nextIndex];
  const nextStart = sessionStarts[nextSession];

  let hoursUntil = nextStart - utcHour;
  if (hoursUntil <= 0) hoursUntil += 24;

  return {
    next: nextSession,
    timeUntil: `~${hoursUntil}h`,
  };
}

/**
 * Gets full session information including PKT time conversion.
 * PKT = UTC + 5
 */
export function getSessionInfo(category: string = 'forex'): SessionInfo {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const pktHour = (utcHour + 5) % 24;

  const session = detectSession(utcHour, category);
  const nextInfo = category === 'psx' ? { next: 'Next Trading Day', timeUntil: 'N/A' } : getNextSession(session.name, utcHour);

  const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const formatTime = (d: Date) =>
    d.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  return {
    currentSession: session.name,
    pktTime: formatTime(pktTime),
    utcTime: formatTime(now),
    sessionDescription: session.description,
    volatilityExpectation: session.volatility,
    bestPairsForSession: session.bestPairs,
    sessionOpenClose: `${session.startUTC} - ${session.endUTC} UTC`,
    nextSession: nextInfo.next,
    nextSessionIn: nextInfo.timeUntil,
  };
}

// ============================================
// Macro Context Engine
// ============================================

/**
 * Generates macro context based on the selected pair and current conditions.
 * In production, this would scrape RSS feeds and economic calendars.
 */
export async function getMacroContext(pair: TradingPair, category: string = 'forex'): Promise<MacroContext> {
  const correlationNotes: Record<TradingPair, string[]> = {
    EURUSD: [
      'EUR/USD inversely correlates with DXY (US Dollar Index) — strong DXY = bearish EURUSD',
      'Watch ECB vs Fed rate differential — wider spread favors USD',
      'EUR/USD often leads GBP/USD moves by 15-30 minutes in London session',
      'Risk-on sentiment generally supports EUR over USD',
    ],
    GBPUSD: [
      'GBP/USD (Cable) is more volatile than EUR/USD — wider stops needed',
      'BoE policy divergence from Fed is the primary macro driver',
      'Cable often reverses at London fix (4 PM London / 9 PM PKT)',
      'UK gilt yields vs US Treasury spread drives medium-term direction',
    ],
    XAUUSD: [
      'Gold inversely correlates with real yields (TIPS) — falling real yields = bullish gold',
      'Strong negative correlation with DXY — USD weakness = gold strength',
      'Gold is a risk-off asset but also responds to inflation expectations',
      'Central bank gold buying (especially China, India) provides structural support',
      'Gold often gaps at Asian open and trends during London session',
    ],
    BTCUSD: [
      'BTC correlates with US tech stocks (NASDAQ) in 2026 — risk-on asset',
      'Halving cycle: 2024 halving effects still playing out — historically bullish 12-18 months post-halving',
      'Institutional flows (ETF inflows/outflows) are the dominant price driver',
      'Weekend liquidity is thin — Sunday evening (PKT) often sees manipulation wicks',
      'BTC dominance vs altcoin rotation affects volatility patterns',
    ],
    USOIL: [
      'WTI Crude: OPEC+ production decisions are the #1 macro driver',
      'Inversely correlated with USD strength — weak USD = higher oil',
      'Weekly EIA inventory data (Wed 7:30 PM PKT) causes sharp moves',
      'Geopolitical risk premium (Middle East tensions) adds upside bias',
      'US shale production levels cap sustained rallies above key levels',
    ],
    SYS: [
      'Systems Ltd is deeply tied to tech exports. PKR depreciation = Higher PKR earnings.',
      'IT sector is heavily incentivized by the government. Watch for tax exemption news.',
      'High beta stock. Moves explosively on institutional FIPI buying.',
    ],
    HUBC: [
      'Hub Power is heavily driven by Circular Debt clearing and IPP (Independent Power Producer) contract renegotiations.',
      'High dividend payer. Price often rallies leading into payout dates.',
      'Government payouts to IPPs are the primary bullish catalyst.',
    ],
    LUCK: [
      'Lucky Cement reacts strongly to PSDP (Public Sector Development Program) spending allocations.',
      'Coal prices impact margins. Lower international coal = bullish for margins.',
      'Interest rate cuts by SBP act as a massive catalyst for the construction sector.',
    ],
    OGDC: [
      'OGDC is heavily suppressed by Circular Debt. IMF pressure to clear circular debt is highly bullish.',
      'Correlates loosely with international oil prices, but local pricing mechanism dictates revenue.',
      'Often acts as a market proxy for foreign FIPI inflows due to its massive weight in the KSE-100 index.',
    ],
    MEBL: [
      'Meezan Bank thrives in high-interest rate environments. SBP rate hikes increase NIM (Net Interest Margin).',
      'Islamic banking deposits grow faster than conventional banks, offering a structural advantage.',
      'Government Sukuk issuances provide low-risk, high-yield avenues for Meezan.',
    ],
  };

  const dxyBias = getDxyBias();
  const riskSentiment = getRiskSentiment();
  const keyEvents = await getUpcomingEvents(category);

  return {
    dxyBias: category === 'psx' ? 'PSX drives off PKR volatility. Watch USD/PKR interbank rates.' : dxyBias,
    riskSentiment: category === 'psx' ? 'PSX relies on SBP rate cuts and IMF tranche approvals. High interest rates choke liquidity.' : riskSentiment,
    keyEvents,
    correlationNotes: correlationNotes[pair],
  };
}

// ============================================
// Helper Functions for Macro Context
// ============================================

function getDxyBias(): string {
  const hour = new Date().getUTCHours();
  // Simplified DXY bias based on session dynamics
  if (hour >= 12 && hour < 21) {
    return 'USD session active — DXY moves driven by US data and Fed speakers. Watch 10Y yield for real-time direction.';
  } else if (hour >= 7 && hour < 12) {
    return 'European session — EUR and GBP flows dominate. DXY typically consolidates unless major US pre-market data drops.';
  } else {
    return 'Asian session — DXY usually range-bound. JPY crosses provide direction clues for USD trend.';
  }
}

function getRiskSentiment(): string {
  const now = new Date();
  const month = now.getUTCMonth();
  // Seasonal patterns
  if (month >= 4 && month <= 9) {
    return 'Mid-year period — historically "sell in May" effect can dampen risk appetite. Monitor VIX for sudden spikes.';
  } else if (month >= 10 || month <= 1) {
    return 'Year-end/early-year flows — institutional rebalancing can cause unexpected moves. Santa rally or January effect possible.';
  }
  return 'Neutral seasonal period — focus on data-driven catalysts and central bank communications.';
}

async function getUpcomingEvents(category: string = 'forex'): Promise<string[]> {
  const events: string[] = [];

  // Try sweeping real-time fundamentals via RSS2JSON
  try {
    const rssUrl = category === 'psx' 
      ? 'https://mettisglobal.news/feed/' 
      : 'https://www.forexlive.com/feed/news';
      
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const res = await fetch(proxyUrl, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        // Grab top 4 recent headlines
        for (let i = 0; i < Math.min(4, data.items.length); i++) {
          const item = data.items[i];
          events.push(`[${category === 'psx' ? 'METTIS GLOBAL' : 'FOREXLIVE'}] ${item.title}`);
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch live RSS news, falling back to static:", err);
  }

  const dayOfWeek = new Date().getUTCDay();

  // Common recurring events by day
  switch (dayOfWeek) {
    case 1: // Monday
      events.push('Monday open — watch for weekend gap fills in first 2 hours');
      break;
    case 2: // Tuesday
      events.push('Session check — mid-week transition point');
      break;
    case 3: // Wednesday
      events.push('Mid-week pivot — EIA Crude Inventory (7:30 PM PKT)');
      break;
    case 4: // Thursday
      events.push('US Weekly Jobless Claims — typically 5:30/6:30 PM PKT');
      break;
    case 5: // Friday
      events.push('Friday profit-taking common in late NY session');
      events.push('Weekly candle close analysis important for swing traders');
      break;
    default:
      events.push('Weekend — markets closed, review and plan');
  }

  return events;
}

// End of session logic
