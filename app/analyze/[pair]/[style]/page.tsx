"use client";

import { useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { PAIRS, getStyleConfig } from "@/lib/constants";
import { TradingPair, TradingStyle, AnalysisStep, AgentResponse, SynthesizedReport } from "@/lib/types";

// ============================================
// Analysis Steps Configuration
// ============================================

const ANALYSIS_STEPS = [
  { id: "session-detection", label: "Detecting market session & macro context..." },
  { id: "fetching-data", label: "Fetching live market data..." },
  { id: "computing-indicators", label: "Computing technical indicators..." },
  { id: "vision-analysis", label: "Running AI vision on your charts..." },
  { id: "master-synthesis", label: "Generating master synthesis report..." },
] as const;

// ============================================
// Main Analysis Page Component
// ============================================

export default function AnalyzePage({
  params,
}: {
  params: Promise<{ pair: string; style: string }>;
}) {
  const { pair, style } = use(params);
  const pairId = pair as TradingPair;
  const styleId = style as TradingStyle;
  const pairConfig = PAIRS[pairId as keyof typeof PAIRS];
  const styleConfig = getStyleConfig(styleId);

  // State
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("idle");
  const [agents, setAgents] = useState<AgentResponse[] | null>(null);
  const [synthesized, setSynthesized] = useState<SynthesizedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);

  // Validate pair and style
  if (!pairConfig || !styleConfig) {
    return (
      <div className="container" style={{ paddingTop: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Invalid configuration</h1>
        <Link href="/" style={{ color: "var(--accent-blue)" }}>← Back to Home</Link>
      </div>
    );
  }

  // ============================================
  // Analysis Handler
  // ============================================

  const handleAnalyze = async () => {
    setError(null);
    setAgents(null);
    setSynthesized(null);

    // Simulate step progression
    const steps: AnalysisStep[] = [
      "session-detection",
      "fetching-data",
      "computing-indicators",
      "vision-analysis",
      "master-synthesis",
    ];

    // Start stepping through
    let currentStepIndex = 0;
    setAnalysisStep(steps[0]);

    const stepInterval = setInterval(() => {
      currentStepIndex++;
      if (currentStepIndex < steps.length) {
        setAnalysisStep(steps[currentStepIndex]);
      }
    }, 2500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: pairId,
          style: styleId,
          images: [], // Auto-generated on backend
        }),
      });

      clearInterval(stepInterval);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setAgents(data.agents);
      setSynthesized(data.synthesized);
      setProcessingTime(data.processingTime || 0);
      setAnalysisStep("complete");
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setAnalysisStep("error");
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: "950px" }}>
      {/* Breadcrumb */}
      <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
        <Link
          href={`/analyze/${pairId}`}
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.85rem",
          }}
        >
          ← Back to Style Selection
        </Link>
      </div>

      {/* Header */}
      <div
        className="animate-fade-in animate-delay-1"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>{pairConfig.icon}</div>
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {pairConfig.name} — {styleConfig.name}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem" }}>
            <span className="badge" style={{ background: 'var(--border-medium)', color: 'var(--text-primary)' }}>
              {pairConfig.category.toUpperCase()}
            </span>
            <span className="badge badge-blue">{styleConfig.icon} {styleConfig.name}</span>
            <span className="badge badge-green">HORIZON: {styleConfig.holdTime}</span>
            <span className="badge badge-amber">RR TARGET: {styleConfig.typicalRR}</span>
          </div>
        </div>
      </div>

      {/* Pre-Analysis Section */}
      {analysisStep === "idle" || analysisStep === "error" ? (
        <>
          <div
            className="animate-fade-in animate-delay-2"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "1.5rem 2rem",
              marginBottom: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
              [SECURE] 1-Click Automated Inference Active
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Our engine will instantly scrape real-time market data across three timeframes 
              ({styleConfig.timeframes.join(', ')}), dynamically generate visual charts in the background, 
              and feed them directly into the Gemini Vision engine. 
              No manual screenshots required.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--accent-red)",
              }}
            >
              [SYSTEM ERROR]: {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            className="analyze-btn animate-fade-in animate-delay-3"
            onClick={handleAnalyze}
            style={{ padding: "1.25rem", fontSize: "1.1rem" }}
          >
            RUN QUANTITATIVE ANALYSIS
          </button>
        </>
      ) : analysisStep === "complete" ? (
        /* Report Section */
        <div className="animate-fade-in">
          {/* Report Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                }}
              >
                [REPORT] CHIEF SYNTHESIS OUTPUT
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Generated in {processingTime.toFixed(1)}s
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  setAnalysisStep("idle");
                  setAgents(null);
                  setSynthesized(null);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-medium)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                🔄 New Analysis
              </button>
            </div>
          </div>

          {/* Master Synthesis Header */}
          {synthesized && (
            <div style={{ 
              background: synthesized.consensus === 'LONG' ? 'rgba(16, 185, 129, 0.1)' : 
                          synthesized.consensus === 'SHORT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              border: `1px solid ${synthesized.consensus === 'LONG' ? '#10B981' : 
                                   synthesized.consensus === 'SHORT' ? '#EF4444' : '#6B7280'}`,
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem' }}>
                Chief Desk Synthesizer: <span style={{ 
                  color: synthesized.consensus === 'LONG' ? '#10B981' : 
                         synthesized.consensus === 'SHORT' ? '#EF4444' : '#6B7280'
                }}>{synthesized.consensus} ({synthesized.confidence}% Confidence)</span>
              </h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span className="badge">Action: {synthesized.action || 'WAIT'}</span>
                {synthesized.entry && <span className="badge">Entry: {synthesized.entry}</span>}
                {synthesized.stopLoss && <span className="badge">SL: {synthesized.stopLoss}</span>}
                {synthesized.takeProfit && <span className="badge">TP: {synthesized.takeProfit}</span>}
                {synthesized.riskReward && <span className="badge">R:R {synthesized.riskReward}</span>}
              </div>

              <div className="markdown-report" dangerouslySetInnerHTML={{ __html: renderMarkdown(synthesized.explanation) }} />
            </div>
          )}

          {/* Agent Debate Grid */}
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Live Agent Debate</h3>
          {agents && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '1rem' 
            }}>
              {agents.map((agent, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1rem' }}>
                    🤖 {agent.agentName}
                  </h4>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }} dangerouslySetInnerHTML={{ __html: renderMarkdown(agent.verdict) }} />
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* Loading State */
        <LoadingState currentStep={analysisStep} />
      )}
    </div>
  );
}

// Upload Components removed.

// ============================================
// Loading State Component
// ============================================

function LoadingState({ currentStep }: { currentStep: AnalysisStep }) {
  const stepOrder: AnalysisStep[] = [
    "session-detection",
    "fetching-data",
    "computing-indicators",
    "vision-analysis",
    "master-synthesis",
  ];
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <div style={{ textAlign: "center" }}>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Analyzing Your Charts...
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Running institutional-grade 4-step analysis pipeline
        </p>
      </div>

      <div className="loading-steps">
        {ANALYSIS_STEPS.map((step, index) => {
          let status: "complete" | "active" | "pending" = "pending";
          if (index < currentIdx) status = "complete";
          else if (index === currentIdx) status = "active";

          return (
            <div key={step.id} className={`loading-step ${status}`}>
              <div className={`step-dot ${status}`} />
              <span>
                {status === "complete" ? "✓ " : ""}
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Simple Markdown Renderer
// ============================================

function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Bullet points
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Numbered lists
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^(.*)$/, '<p>$1</p>');
}
