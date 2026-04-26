import { NextRequest, NextResponse } from 'next/server';
import { executeAnalysis } from '@/lib/engine';
import { getStylesForCategory, PAIRS, PAIR_LIST } from '@/lib/constants';
import { clearJournal, getRecentJournals } from '@/lib/supabase';

// Telegram Bot API URL
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

/**
 * ChartForge AI — Telegram Webhook Gateway
 * Listens for on-demand commands from your phone.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const firstName = message.from.first_name;

    // 1. Security Check: Only allow authorized user
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (adminId && chatId !== adminId) {
      await sendTelegramMessage(chatId, "⚠️ *UNAUTHORIZED ACCESS BLOCKED.*\nThis terminal is restricted to the owner only.");
      return NextResponse.json({ ok: true });
    }

    // 2. Command Router
    if (text === '/start' || text === '/help') {
      const helpMsg = `
🏛 *CHARTFORGE INSTITUTIONAL TERMINAL*

*Command Syntax:*
\`/analyze [PAIR] [STYLE] [SYSTEM]\`

*Step 1: Select Pair*
View them with \`/pairs\` (e.g., EURUSD, SYS, XAUUSD)

*Step 2: Select Style*
• \`scalp\`, \`day\`, \`swing\` (Forex/Global)
• \`psx_intraday\`, \`psx_swing\`, \`psx_dividend\` (PSX)

*Step 3: Select System* (Optional)
View strategies with \`/systems\`

*Admin Commands:*
/journal - View recent setups
/clear - Wipe database
/pairs - List all tracked assets
`;
      await sendTelegramMessage(chatId, helpMsg);
      return NextResponse.json({ ok: true });
    }

    if (text === '/systems') {
      const sysMsg = `
🧠 *ADVANCED ANALYTICAL SYSTEMS*

1. *standard*: Price Action Purist (S/R, Trendlines)
2. *smc*: Smart Money Concepts (FVG, Order Blocks, Liquidity)
3. *wyckoff*: Schematic Analysis (Accumulation/Distribution phases)

*Usage:* \`/analyze XAUUSD day smc\`
`;
      await sendTelegramMessage(chatId, sysMsg);
      return NextResponse.json({ ok: true });
    }

    if (text === '/pairs') {
      const psx = PAIR_LIST.filter(p => PAIRS[p].category === 'psx').join(', ');
      const fx = PAIR_LIST.filter(p => PAIRS[p].category !== 'psx').join(', ');
      await sendTelegramMessage(chatId, `📊 *Currently Tracking:*\n\n*Forex/Global:* ${fx}\n*Local (PSX):* ${psx}`);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/analyze')) {
      const parts = text.split(' ');
      
      // Expected Format: /analyze [pair] [style] [system]
      if (parts.length < 3) {
        await sendTelegramMessage(chatId, "❌ *INVALID SYNTAX.*\nUsage: `/analyze [PAIR] [STYLE] [SYSTEM]`\n\nExample:\n`/analyze SYS psx_swing smc`\n`/analyze EURUSD scalp pa` ");
        return NextResponse.json({ ok: true });
      }

      const pair = parts[1].toUpperCase();
      const style = parts[2].toLowerCase();
      const system = parts[3] || 'standard';

      await sendTelegramMessage(chatId, `⏳ *ANALYSIS INITIATED: ${pair} (${style})*\nRunning multi-agent debate using *${system.toUpperCase()}* ruleset...`);

      const result = await executeAnalysis({ pair, style, chatId, system });

      if (result.success && result.synthesized) {
        const { synthesized, duration } = result;
        const color = synthesized.consensus === 'LONG' ? '🟢' : synthesized.consensus === 'SHORT' ? '🔴' : '🟡';
        
        const responseText = `
${color} *REPORT: ${pair} (${style.toUpperCase()})*
---------------------------------------
*Verdict:* ${synthesized.consensus}
*Confidence:* ${synthesized.confidence}%
*Action:* ${synthesized.action || 'WAIT'}

*Setup Parameters:*
• *Entry:* ${synthesized.entry || 'Pending'}
• *Stop Loss:* ${synthesized.stopLoss || 'N/A'}
• *Take Profit:* ${synthesized.takeProfit || 'N/A'}
• *R:R:* ${synthesized.riskReward || 'N/A'}

*Chief Synthesis Explainer:*
${synthesized.explanation}

---------------------------------------
⏱ _Compute Latency: ${duration}s_
`;
        await sendTelegramMessage(chatId, responseText);
      } else {
        await sendTelegramMessage(chatId, `❌ *ENGINE FAILURE:* ${result.error || 'Unknown error occurred during analysis.'}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/journal') {
        const journals = await getRecentJournals(chatId);
        if (journals.length === 0) {
            await sendTelegramMessage(chatId, "📭 Your journal is currently empty.");
        } else {
            let msg = "📖 *RECENT JOURNAL ENTRIES*\n------------------------\n";
            journals.forEach((j: any, i: number) => {
                msg += `${i+1}. *${j.pair}* | ${j.consensus} | ${j.timestamp.split('T')[0]}\n`;
            });
            await sendTelegramMessage(chatId, msg);
        }
        return NextResponse.json({ ok: true });
    }

    if (text === '/clear') {
        const success = await clearJournal(chatId);
        await sendTelegramMessage(chatId, success ? "🧹 *JOURNAL WIPED.* Database quota cleared." : "❌ Failed to clear database.");
        return NextResponse.json({ ok: true });
    }

    // 3. Interactive Agent Q&A (Handle Replies)
    if (message.reply_to_message && message.reply_to_message.text) {
        const contextTrade = message.reply_to_message.text;
        const userQuestion = text;

        console.log(`[Telegram] Interactive Q&A triggered: ${userQuestion}`);
        await sendTelegramMessage(chatId, "🤔 *CONSULTING THE DESK...* \nSynthesizing agents for a deeper explanation.");

        const { runLLM } = await import('@/lib/gemini');
        const defensePrompt = `
        You are the Head of Research for a Quantitative Trading Desk.
        
        CONTEXT (A previous trade report we sent to the user):
        ${contextTrade}
        
        USER QUESTION ABOUT THIS TRADE:
        "${userQuestion}"
        
        TASK:
        Look inside the context report. Explain the reasoning of our specialized agents (Trend, Contrarian, Price Action).
        Provide a "Street Experienced" defense of the setup. 
        If the user is asking "Why?", break down the specific liquidity zones or macro themes referenced.
        Keep the tone professional, aggressive, and highly technical.
        `;

        try {
            const explanation = await runLLM(defensePrompt, "Desk Consultant");
            await sendTelegramMessage(chatId, `🧠 *DESK CONSULTANT RESPONSE:*\n\n${explanation}`);
        } catch (err) {
            await sendTelegramMessage(chatId, "❌ *CONSULTATION FAILED:* The agents are currently occupied. Try again in 60s.");
        }
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Telegram Webhook Error]:', error);
    return NextResponse.json({ ok: true }); // Always return OK to Telegram to avoid infinite loops
  }
}

/**
 * Helper to send formatted Telegram messages.
 */
async function sendTelegramMessage(chatId: string, text: string) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (e) {
    console.error('[Telegram Send Error]:', e);
  }
}
