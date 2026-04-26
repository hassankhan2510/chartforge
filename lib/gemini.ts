/**
 * ChartForge AI — Multi-Model API Integration
 * Handles all AI calls, intelligently routing to the best model/key:
 * 1. Vision Analysis -> Gemini (using dedicated Vision Key)
 * 2. Master Synthesis -> Groq (Llama 3.1 8B) -> Fallback: Gemini (using dedicated Synthesis Key)
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { TradingStyle, SessionInfo, MacroContext, MechanicalData, AgentResponse, SynthesizedReport } from './types';
import { PAIRS, getStyleConfig } from './constants';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// API Key Management
// ============================================

function getApiKeys(): string[] {
  const keysStr = process.env.GEMINI_API_KEYS;
  if (keysStr) {
    const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  
  const key = process.env.GEMINI_API_KEY;
  if (key) return [key];
  
  // Fallback to the dedicated keys if GEMINI_API_KEYS is missing
  const vision = process.env.GEMINI_API_VISION_KEY;
  const synth = process.env.GEMINI_API_SYNTHESIS_KEY;
  const fallbacks = [vision, synth, key].filter(Boolean) as string[];
  if (fallbacks.length > 0) return fallbacks;
  
  throw new Error('No Gemini API keys found in .env.local');
}

// ============================================
// Prompt Loading
// ============================================

function loadPrompt(filename: string, subfolder: string = ''): string {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', subfolder, filename);
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load prompt ${filename}:`, error);
    return '';
  }
}

// ============================================
// Vision Analysis (Step 3) - DEDICATED GEMINI VISION KEY
// ============================================

const VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export async function analyzeCharts(
  images: string[], // base64 encoded images
  style: TradingStyle,
  pair: string,
  currentPrice: number
): Promise<string> {
  // Use dedicated Vision Key to prevent rate limits
  const apiKey = process.env.GEMINI_API_VISION_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_VISION_KEY is not set in .env.local');
  
  const genAI = new GoogleGenerativeAI(apiKey);

  const pairConfig = PAIRS[pair as keyof typeof PAIRS];
  const isPSX = pairConfig?.category === 'psx';
  const categoryFolder = isPSX ? 'psx' : '';
  
  // Since PSX style keys are like "psx_intraday", we can strip the 'psx_' prefix so the file is "vision-intraday.txt"
  // or we can just keep them named "vision-psx_intraday.txt". Let's assume vision prompt is "vision-{style}.txt" in the category folder.
  const visionPrompt = loadPrompt(`vision-${style}.txt`, categoryFolder);
  const styleConfig = getStyleConfig(style);
  
  if (!styleConfig) throw new Error(`Invalid style ${style}`);
  const timeframes = styleConfig.timeframes;

  const imageParts: Part[] = images.map((base64) => {
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    return {
      inlineData: {
        mimeType: 'image/png',
        data: cleanBase64,
      },
    };
  });

  const prompt = `
${visionPrompt}

PAIR: ${pair}
TRADING STYLE: ${style.toUpperCase()} (${styleConfig.description})
TIMEFRAMES SHOWN: ${timeframes.join(', ')}

[CRITICAL INTELLIGENCE CHECK]
The REAL-TIME current market price for ${pair} is exactly: ${currentPrice}
Look very closely at the current (right-most) price on the uploaded charts. 
If the price shown on the charts is significantly different from ${currentPrice}, YOU MUST explicitly state: "WARNING: The provided charts appear to be OUTDATED (stale). Visual analysis may be irrelevant."

Analyze ALL 3 charts above in the exact order: Chart 1 (${timeframes[0]}), Chart 2 (${timeframes[1]}), Chart 3 (${timeframes[2]}).
`;

  // Retry and model fallback loop for Gemini
  for (const modelName of VISION_MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`  [AI Routing] Sending Vision task to Gemini ${modelName} (attempt ${attempt}/${MAX_RETRIES})...`);
        const result = await model.generateContent([prompt, ...imageParts]);
        console.log(`  [AI Routing] ✓ Vision analysis successful with ${modelName}`);
        return result.response.text();
      } catch (error: unknown) {
        const statusCode = (error as { status?: number })?.status;
        const isRetryable = statusCode === 503 || statusCode === 429 || statusCode === 500;
        
        console.warn(`  [AI Routing] ✗ Vision attempt ${attempt} failed on ${modelName}: ${statusCode || 'unknown'}`);
        
        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(`  [AI Routing] Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (attempt === MAX_RETRIES || !isRetryable) {
          console.warn(`  [AI Routing] Exhausted retries for ${modelName}, trying next model...`);
          break; // Move to the next model in VISION_MODELS
        }
      }
    }
  }

  // Final Fallback: Groq Vision (meta-llama/llama-4-scout-17b-16e-instruct)
  if (process.env.GROQ_API_KEY) {
    console.log(`  [AI Routing] All Gemini models failed. Falling back to Groq Llama Scout Vision...`);
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const groqImageContent = images.map((base64) => ({
        type: 'image_url' as const,
        image_url: {
          url: base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
        }
      }));

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...groqImageContent
            ]
          }
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.1,
      });

      console.log(`  [AI Routing] ✓ Vision analysis successful with Groq Llama Scout`);
      return completion.choices[0]?.message?.content || 'Groq vision analysis completed without text.';
    } catch (groqError) {
      console.error('  [AI Routing] Groq vision fallback also failed:', groqError);
    }
  }

  console.error('Vision analysis failed after all Gemini models and Groq fallback.');
  return 'Vision analysis could not be completed due to ongoing API limits (503 Service Unavailable). Proceeding with mechanical data only.';
}

// ============================================
// Master Synthesis (Step 4) - GROQ (PRIMARY) -> GEMINI (FALLBACK)
// ============================================

// Helper function for individual agent LLM execution
async function runLLM(prompt: string, agentName: string): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    try {
      // console.log(`  [AI Routing] Running ${agentName} via Groq...`);
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.1,
      });
      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.warn(`  [AI Routing] ✗ Groq failing for ${agentName} (${error.status || error.message}), falling back to Gemini...`);
    }
  }

  const apiKeys = getApiKeys();
  for (const fallbackKey of apiKeys) {
    try {
      const genAI = new GoogleGenerativeAI(fallbackKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.warn(`  [AI Routing] Gemini fallback failing: ${error.status || error.message}`);
    }
  }

  throw new Error(`Analysis failed for ${agentName} due to API limits.`);
}

export async function masterSynthesis(
  pair: string,
  style: TradingStyle,
  sessionInfo: SessionInfo,
  macroContext: MacroContext,
  mechanicalData: MechanicalData,
  visionAnalysis: string,
  system: string = 'standard'
): Promise<{ agents: AgentResponse[]; synthesized: SynthesizedReport }> {
  
  const pairConfig = PAIRS[pair as keyof typeof PAIRS];

  // Construct Data Context Payload
  const dataPayload = `
=== CURRENT SESSION & TIMING ===
Current Session: ${sessionInfo.currentSession}
PKT Time: ${sessionInfo.pktTime}
Session Details: ${sessionInfo.sessionDescription}
Volatility Expectation: ${sessionInfo.volatilityExpectation}

=== MACRO & FUNDAMENTAL CONTEXT ===
DXY/USD Bias: ${macroContext.dxyBias}
Risk Sentiment: ${macroContext.riskSentiment}
Key Events Today: 
${macroContext.keyEvents.map(e => `  - ${e}`).join('\n')}

=== MECHANICAL DATA ===
Pair: ${pair} (${pairConfig?.fullName})
Current Price: ${mechanicalData.currentPrice}
Technical Indicators (${style.toUpperCase()} style):
${JSON.stringify(mechanicalData.indicators)}

=== CHART VISION ANALYSIS ===
${visionAnalysis.length > 4000 ? visionAnalysis.substring(0, 4000) + '...' : visionAnalysis}
`;

  // Read Agent Prompts dynamically based on market category
  const categoryFolder = pairConfig.category === 'psx' ? 'psx' : '';
  const trendPrompt = loadPrompt('agent-trend.txt', categoryFolder);
  const contraPrompt = loadPrompt('agent-contrarian.txt', categoryFolder);
  const paPrompt = loadPrompt('agent-priceaction.txt', categoryFolder);
  const synthPrompt = loadPrompt('agent-synthesizer.txt', categoryFolder);
  
  // Load System-specific rules
  const systemRules = loadPrompt(`${system}.txt`, 'systems') || loadPrompt('standard.txt', 'systems');

  console.log('  [AI Routing] Spawning 3 parallel agents (Trend, Contrarian, Price Action)...');

  // Spawn Agents in Parallel
  const [trendResponse, contraResponse, paResponse] = await Promise.all([
    runLLM(`${trendPrompt}\n\n${systemRules}\n\n${dataPayload}`, "Agent 1 (Trend)"),
    runLLM(`${contraPrompt}\n\n${systemRules}\n\n${dataPayload}`, "Agent 2 (Contrarian)"),
    runLLM(`${paPrompt}\n\n${systemRules}\n\n${dataPayload}`, "Agent 3 (Price Action)")
  ]);

  const agents: AgentResponse[] = [
    { agentName: 'Trend Follower', verdict: trendResponse },
    { agentName: 'Contrarian', verdict: contraResponse },
    { agentName: 'Price Action', verdict: paResponse }
  ];

  console.log('  [AI Routing] Agents completed. Running Final Synthesizer...');

  const finalSynthesisPayload = `
${synthPrompt}

${dataPayload}

=== AGENT 1 (TREND) OUTPUT ===
${trendResponse}

=== AGENT 2 (CONTRARIAN) OUTPUT ===
${contraResponse}

=== AGENT 3 (PRICE ACTION) OUTPUT ===
${paResponse}

RETURN YOUR FINAL VERDICT IN EXACT JSON FORMAT ONLY. Do not use markdown blocks.
`;

  const rawJsonOutput = await runLLM(finalSynthesisPayload, "Synthesizer");
  
  // Extract JSON robustly — find the first { ... } block in the output
  let jsonStr = '';
  const jsonMatch = rawJsonOutput.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  } else {
    jsonStr = rawJsonOutput.replace(/```json/g, '').replace(/```/g, '').trim();
  }
  
  let synthesized: SynthesizedReport;
  try {
    const parsed = JSON.parse(jsonStr);
    // Coerce numeric fields to strings so the UI renders them correctly
    synthesized = {
      consensus: parsed.consensus || parsed.verdict || 'NEUTRAL',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      action: parsed.action || null,
      entry: parsed.entry != null ? String(parsed.entry) : null,
      stopLoss: parsed.stopLoss != null ? String(parsed.stopLoss) : null,
      takeProfit: parsed.takeProfit != null ? String(parsed.takeProfit) : null,
      riskReward: parsed.riskReward != null ? String(parsed.riskReward) : null,
      explanation: parsed.explanation || parsed.reasoning || 'No explanation provided.',
    };
  } catch (error) {
    console.error("Synthesizer failed to return valid JSON. Raw output:", rawJsonOutput);
    synthesized = {
      consensus: 'NEUTRAL',
      confidence: 0,
      action: null,
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      explanation: `*Agent failed to serialize output.* \n\nRaw:\n${rawJsonOutput}`
    };
  }

  return { agents, synthesized };
}
