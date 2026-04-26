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
    if (text === '/start') {
      await sendTelegramMessage(chatId, `Welcome back, *${firstName}*.\n\nI am the *ChartForge Institutional Terminal*.\nI am standing by for on-demand analysis.\n\n*Available Commands:*\n/analyze - Generate a setup\n/pairs - View tracked assets\n/journal - Recent setups\n/clear - Wipe database\n/help - Command syntax`);
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
