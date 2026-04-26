import { NextRequest, NextResponse } from 'next/server';
import { getTrades, JournalEntry } from '@/lib/journal';
import { fetchOHLCV } from '@/lib/data';
import Groq from 'groq-sdk';
import { PAIRS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { tradeId } = await request.json();
    if (!tradeId) return NextResponse.json({ success: false, error: 'Missing tradeId' }, { status: 400 });

    const trades = getTrades();
    const trade = trades.find(t => t.id === tradeId);

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
    }

    if (!trade.action || !trade.entry || !trade.stopLoss || !trade.takeProfit) {
      return NextResponse.json({ 
        success: true, 
        auditReport: `This setup was logged as NO TRADE / WAIT.\nReasoning: "${trade.explanation}"\nNo mechanical risk was taken, so it cannot be mathematically audited for PnL. The desk successfully preserved capital.` 
      });
    }

    // Step 1: Fetch historical data from trade time to now
    // We fetch a tight interval (e.g., 15m) for accurate intra-day pathing
    const symbol = PAIRS[trade.pair as keyof typeof PAIRS]?.yahooSymbol || trade.pair;
    const bars = await fetchOHLCV(symbol, '15m', '5d'); // Fetch last 5 days
    
    const tradeTime = new Date(trade.timestamp).getTime() / 1000;
    
    // Filter bars to only those AFTER the trade was placed
    const subsequentBars = bars.filter(b => b.timestamp >= tradeTime);
    
    if (subsequentBars.length === 0) {
      return NextResponse.json({ 
        success: true, 
        auditReport: `Trade was placed too recently. Not enough subsequent market data exists yet to determine the outcome. Wait a few hours and analyze again.` 
      });
    }

    // Step 2: Simulate Trade Outcome
    let outcome: 'TP HIT' | 'SL HIT' | 'OPEN' = 'OPEN';
    let outcomeTime = 0;
    let maxDrawdown = 0;
    let maxFavorableExcursion = 0;

    for (const bar of subsequentBars) {
      const high = bar.high;
      const low = bar.low;
      const entry = Number(trade.entry);
      const stopLoss = Number(trade.stopLoss);
      const takeProfit = Number(trade.takeProfit);

      if (trade.action === 'BUY') {
        const drawdown = entry - low;
        const profit = high - entry;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        if (profit > maxFavorableExcursion) maxFavorableExcursion = profit;

        // Check SL first as worst-case scenario
        if (low <= stopLoss) {
          outcome = 'SL HIT';
          outcomeTime = bar.timestamp;
          break;
        }
        if (high >= takeProfit) {
          outcome = 'TP HIT';
          outcomeTime = bar.timestamp;
          break;
        }
      } else if (trade.action === 'SELL') {
        const drawdown = high - entry;
        const profit = entry - low;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        if (profit > maxFavorableExcursion) maxFavorableExcursion = profit;

        if (high >= stopLoss) {
          outcome = 'SL HIT';
          outcomeTime = bar.timestamp;
          break;
        }
        if (low <= takeProfit) {
          outcome = 'TP HIT';
          outcomeTime = bar.timestamp;
          break;
        }
      }
    }

    // Step 3: Run the Auditor Agent via Groq
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        success: true, 
        auditReport: `Mechanical Outcome: ${outcome}\nMax Drawdown: ${maxDrawdown.toFixed(5)}\nMax Favorable Excursion: ${maxFavorableExcursion.toFixed(5)}\n\n(Groq API Key required for AI text audit).` 
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const auditorPrompt = `
You are the CHIEF REFLEXIVITY AUDITOR for an Algorithmic Trading Desk.
Your job is to read a past trade setup that the desk executed, compare it against the objective reality of what actually happened in the market, and write a brutal, honest, highly educational critique.

=== THE ORIGINAL TRADE LOG ===
Date Executed: ${trade.timestamp}
Pair: ${trade.pair}
Action: ${trade.action}
Entry: ${trade.entry}
Stop Loss: ${trade.stopLoss}
Take Profit: ${trade.takeProfit}
Original Desk Rationale:
"${trade.explanation}"

=== THE OBJECTIVE REALITY ===
Final Outcome: ${outcome} 
Outcome Time: ${outcomeTime > 0 ? new Date(outcomeTime * 1000).toISOString() : 'N/A'}
Maximum Favorable Move (Pip Equivalent): ${maxFavorableExcursion.toFixed(5)}
Maximum Drawdown (Pip Equivalent): ${maxDrawdown.toFixed(5)}

=== INSTRUCTIONS ===
Write a 3-paragraph critique answering:
1. If TP Hit: Was the thesis completely correct, or was the take-profit too conservative given the MFE (Favorable Move)?
2. If SL Hit: Why was the original rationale wrong? What indicators or liquidity levels did the desk misinterpret?
3. If Open: Is the trade currently heavily in drawdown, and should the desk cut it early, or is it grinding towards TP?

Be ruthless. Use a highly institutional, quantitative tone. Do NOT output markdown headers, just plain text with line breaks.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: auditorPrompt }],
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    const aiAudit = completion.choices[0]?.message?.content || 'Audit model failed to generate text.';
    
    const finalReport = `### Objective Outcome: ${outcome}
Max Favorable Excursion: ${maxFavorableExcursion.toFixed(5)}
Max Drawdown: ${maxDrawdown.toFixed(5)}

### Chief Reflexivity Audit
${aiAudit}
`;

    return NextResponse.json({ success: true, auditReport: finalReport });

  } catch (error: any) {
    console.error("EOD analysis error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
