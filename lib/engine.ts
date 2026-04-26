import { getSessionInfo, getMacroContext } from './session';
import { getMechanicalData } from './data';
import { generateChartImageBase64 } from './charts';
import { analyzeCharts, masterSynthesis } from './gemini';
import { TradingPair, TradingStyle, SynthesizedReport } from './types';
import { PAIRS, getStyleConfig } from './constants';
import { saveJournalEntry, getPairSpecificLessons } from './supabase';
import { getMarketConfluence } from './confluence';

/**
 * ChartForge AI — Standalone Execution Engine
 * This engine runs the entire 4-step pipeline on-demand.
 * It is completely detached from the UI, making it Vercel-ready for Bot/Cron usage.
 */
export async function executeAnalysis(params: {
  pair: string;
  style: string;
  chatId: string;
  system: string;
}) {
  const { pair, style, chatId, system } = params;
  const startTime = Date.now();

  try {
    // 1. Validation
    const pairConfig = PAIRS[pair as TradingPair];
    const styleConfig = getStyleConfig(style);

    if (!pairConfig || !styleConfig) {
      throw new Error(`Invalid configuration: ${pair} / ${style}`);
    }

    // 2. Fetch Macro & Session Context + Reflexive History
    console.log(`[Engine] Starting analysis for ${pair} using ${style} (${system})...`);
    const category = pairConfig.category === 'psx' ? 'psx' : 'forex';
    const [sessionInfo, macroContext, marketConfluence, reflexiveHistory] = await Promise.all([
      getSessionInfo(category),
      getMacroContext(pair as TradingPair, category),
      getMarketConfluence(),
      getPairSpecificLessons(pair)
    ]);

    // 3. Generate Charts (On-demand scraping)
    console.log(`[Engine] Scrapping 3-timeframe charts from Yahoo Finance...`);
    const chartTimeframes = styleConfig.timeframes;
    const images = await Promise.all(
      chartTimeframes.map(tf => generateChartImageBase64(pair as TradingPair, tf))
    );

    const validImages = images.filter(Boolean) as string[];
    if (validImages.length !== 3) {
      throw new Error("Failed to capture all 3 required chart timeframes.");
    }

    // 4. Run Mechanical Data Engine
    const mechanicalData = await getMechanicalData(pair as TradingPair, style as TradingStyle);

    // 5. Vision Analysis (Gemini)
    console.log(`[Engine] Executing Vision Matrix...`);
    const visionOutput = await analyzeCharts(
      validImages, 
      style as TradingStyle, 
      pair, 
      mechanicalData.currentPrice
    );

    // 6. Master Multi-Agent Synthesis (Groq/Gemini)
    console.log(`[Engine] Running Multi-Agent Debate...`);
    const { synthesized } = await masterSynthesis(
      pair,
      style as TradingStyle,
      sessionInfo,
      macroContext,
      reflexiveHistory,
      marketConfluence,
      mechanicalData,
      visionOutput,
      system
    );

    // 7. Supabase Journaling
    console.log(`[Engine] Journaling output to Supabase (quant-edge/chartforge)...`);
    await saveJournalEntry({
      pair,
      style,
      system,
      consensus: synthesized.consensus,
      confidence: synthesized.confidence,
      action: synthesized.action,
      entry_price: synthesized.entry ? String(synthesized.entry) : null,
      stop_loss: synthesized.stopLoss ? String(synthesized.stopLoss) : null,
      take_profit: synthesized.takeProfit ? String(synthesized.takeProfit) : null,
      explanation: synthesized.explanation,
      chat_id: chatId
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Engine] Analysis complete in ${duration}s.`);

    return {
      success: true,
      synthesized,
      duration,
      pair: pairConfig,
      style: styleConfig
    };

  } catch (error: any) {
    console.error("[Engine] Critical failure:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
