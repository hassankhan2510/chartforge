/**
 * ChartForge AI — Main Analysis API Route
 * Orchestrates the 4-step analysis pipeline:
 * 1. Session & Fundamental Engine
 * 2. Mechanical Data & Indicators
 * 3. Vision Analysis (Gemini)
 * 4. Master Synthesis (Gemini)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionInfo, getMacroContext } from '@/lib/session';
import { getMechanicalData } from '@/lib/data';
import { analyzeCharts, masterSynthesis } from '@/lib/gemini';
import { TradingPair, TradingStyle, AnalyzeResponse } from '@/lib/types';
import { PAIRS, getStyleConfig } from '@/lib/constants';
import { generateChartImageBase64 } from '@/lib/charts';

export const maxDuration = 60; // Allow up to 60 seconds for Vercel

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();
    const { pair, style, images } = body as {
      pair: string;
      style: string;
      images: string[];
    };

    // Validate inputs
    if (!pair || !style) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: pair, style' },
        { status: 400 }
      );
    }

    if (!(pair in PAIRS)) {
      return NextResponse.json(
        { success: false, error: `Invalid pair: ${pair}. Valid pairs: ${Object.keys(PAIRS).join(', ')}` },
        { status: 400 }
      );
    }

    if (!getStyleConfig(style)) {
      return NextResponse.json(
        { success: false, error: `Invalid style: ${style}. Valid FX styles: scalp, day, swing. Valid PSX styles: psx_intraday, psx_swing, psx_dividend` },
        { status: 400 }
      );
    }

    let finalImages = images;
    if (!images || images.length !== 3) {
      console.log('[ChartForge AI] No images provided. Auto-generating naked charts via QuickChart...');
      const targetTimeframes = getStyleConfig(style as TradingStyle)!.timeframes;
      
      const generatedImages = await Promise.all(
        targetTimeframes.map(tf => generateChartImageBase64(pair as TradingPair, tf))
      );
      
      // Filter out nulls
      const validImages = generatedImages.filter(Boolean) as string[];
      if (validImages.length !== 3) {
         return NextResponse.json(
          { success: false, error: 'Failed to auto-generate the required 3 timeframes from Yahoo Finance.' },
          { status: 500 }
         );
      }
      finalImages = validImages;
    }

    const tradingPair = pair as TradingPair;
    const tradingStyle = style as TradingStyle;

    console.log(`[ChartForge AI] Starting analysis: ${pair} / ${style}`);

    // ============================================
    // STEP 1: Session & Fundamental Engine (No LLM)
    // ============================================
    console.log('[Step 1/4] Detecting session & macro context...');
    // ============================================
    // STEP 1: Session & Fundamental Engine (No LLM)
    // ============================================
    console.log('[Step 1/4] Detecting session & macro context...');
    const pairFullConfig = PAIRS[tradingPair];
    const { getMarketConfluence } = await import('@/lib/confluence');
    const { getPairSpecificLessons } = await import('@/lib/supabase');
    
    const [sessionInfo, macroContext, marketConfluence, reflexiveHistory] = await Promise.all([
      getSessionInfo(pairFullConfig.category),
      getMacroContext(tradingPair, pairFullConfig.category),
      getMarketConfluence(),
      getPairSpecificLessons(pair)
    ]);

    if (sessionInfo.currentSession === 'Weekend' && pairFullConfig.category !== 'crypto') {
      console.warn(`[ChartForge AI] Aborting analysis: ${pair} market is closed for the weekend.`);
      return NextResponse.json({
        success: false,
        error: `The ${pairFullConfig.name} market is currently closed for the weekend. The agent will not analyze stale data. Please wait until market open.`,
        processingTime: (Date.now() - startTime) / 1000,
      }, { status: 400 });
    }

    if (sessionInfo.currentSession === 'PSX Closed') {
       console.warn(`[ChartForge AI] Aborting analysis: ${pair} PSX market is currently closed out of hours.`);
       return NextResponse.json({
        success: false,
        error: `The Pakistan Stock Exchange is currently closed. Trading hours are strictly Mon-Fri, 09:30 AM to 03:30 PM PKT. Please try again during open hours.`,
        processingTime: (Date.now() - startTime) / 1000,
      }, { status: 400 });
    }

    // ============================================
    // STEP 2: Mechanical Data & Indicators (No LLM)
    // ============================================
    console.log('[Step 2/4] Fetching market data & computing indicators...');
    const mechanicalData = await getMechanicalData(tradingPair, tradingStyle);

    // ============================================
    // STEP 3: Vision Analysis (Gemini Flash)
    // ============================================
    console.log('[Step 3/4] Running vision analysis on charts...');
    const visionAnalysis = await analyzeCharts(finalImages, tradingStyle, pair, mechanicalData.currentPrice);

    // ============================================
    // STEP 4: Multi-Agent Debate & Synthesis (Gemini/Groq)
    // ============================================
    console.log('[Step 4/4] Running multi-agent debate and synthesis...');
    const system = body.system || 'standard';
    const { agents, synthesized } = await masterSynthesis(
      pair,
      tradingStyle,
      sessionInfo,
      macroContext,
      reflexiveHistory,
      marketConfluence,
      mechanicalData,
      visionAnalysis,
      system
    );

    // ============================================
    // STEP 5: Autonomous Database Journaling
    // ============================================
    try {
      if (synthesized) {
        const { saveTrade } = await import('@/lib/journal');
        
        const entryId = `trd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        saveTrade({
          id: entryId,
          timestamp: new Date().toISOString(),
          pair: tradingPair,
          style: tradingStyle,
          consensus: synthesized.consensus,
          confidence: synthesized.confidence,
          action: synthesized.action,
          entry: synthesized.entry ? String(synthesized.entry) : null,
          stopLoss: synthesized.stopLoss ? String(synthesized.stopLoss) : null,
          takeProfit: synthesized.takeProfit ? String(synthesized.takeProfit) : null,
          riskReward: synthesized.riskReward,
          explanation: synthesized.explanation,
        });
        console.log(`[ChartForge AI] Auto-journaled trade setup ${entryId}`);
      }
    } catch (dbError) {
      console.warn('[ChartForge AI] Failed to journal trade. Continuing anyway...', dbError);
    }

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`[ChartForge AI] Analysis complete in ${processingTime}s`);

    return NextResponse.json({
      success: true,
      agents,
      synthesized,
      processingTime,
    });
  } catch (error: unknown) {
    const processingTime = (Date.now() - startTime) / 1000;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[ChartForge AI] Analysis failed:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        processingTime,
      },
      { status: 500 }
    );
  }
}
