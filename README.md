# ChartForge AI ⚡

**Institutional-Grade On-Demand Forex/Gold/Oil/BTC Chart Analyzer**

Upload your chart screenshots and get professional prop-desk-level analysis in seconds. Powered by Gemini AI vision, quantitative indicators, and decades of encoded trading logic.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Gemini AI](https://img.shields.io/badge/Gemini-2.5-orange?style=flat-square)

---

## 🎯 How It Works

1. **Select a pair** — EURUSD, GBPUSD, XAUUSD (Gold), BTCUSD, or USOIL
2. **Choose your style** — Scalp (1m/5m/15m), Day (15m/1H/4H), or Swing (4H/D/W)
3. **Upload 3 chart screenshots** — matching the required timeframes
4. **Click ANALYZE** — get a comprehensive institutional-grade report

## 🔥 What Happens Behind the Scenes

When you click Analyze, a 4-step pipeline runs:

| Step | What | How |
|------|-------|-----|
| 1️⃣ | **Session Detection** | Detects PKT time, active session (Asian/London/NY/Overlap), macro context |
| 2️⃣ | **Mechanical Engine** | Fetches live OHLCV data, computes 15+ indicators per style (RSI, MACD, Ichimoku, etc.) |
| 3️⃣ | **Vision AI** | Sends your 3 charts to Gemini Flash with ultra-detailed vision prompts |
| 4️⃣ | **Master Synthesis** | Combines everything into one massive Gemini call for final trade recommendations |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free Gemini API key

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/chartforge-ai.git
cd chartforge-ai

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Get Your Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key
4. Paste into `.env.local` as `GEMINI_API_KEY=your_key_here`

## ☁️ Deploy to Vercel (One Click)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repo
4. Add Environment Variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Click Deploy

That's it! Free tier is more than enough since it's on-demand only.

## 📁 Project Structure

```
chartforge-ai/
├── app/
│   ├── page.tsx                          # Homepage — pair selection
│   ├── layout.tsx                        # Root layout with premium dark theme
│   ├── globals.css                       # Complete design system
│   ├── analyze/
│   │   ├── [pair]/page.tsx              # Style selection (Scalp/Day/Swing)
│   │   └── [pair]/[style]/page.tsx      # Upload + Analysis page
│   └── api/
│       └── analyze/route.ts             # 4-step analysis API
├── lib/
│   ├── types.ts                         # TypeScript interfaces
│   ├── constants.ts                     # Pair & style configurations
│   ├── session.ts                       # Session detection engine
│   ├── data.ts                          # Market data + indicators
│   └── gemini.ts                        # Gemini API integration
├── prompts/                             # 6 massive system prompts
│   ├── vision-scalp.txt                 # Vision prompt for scalp charts
│   ├── vision-day.txt                   # Vision prompt for day charts
│   ├── vision-swing.txt                 # Vision prompt for swing charts
│   ├── master-scalp.txt                 # Master synthesis for scalp
│   ├── master-day.txt                   # Master synthesis for day
│   └── master-swing.txt                 # Master synthesis for swing
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## ➕ Adding More Pairs

1. Open `lib/constants.ts`
2. Add a new entry to the `PAIRS` object:
```typescript
NEWPAIR: {
  id: 'NEWPAIR',
  name: 'NEW/PAIR',
  fullName: 'New Pair Name',
  icon: '🔵',
  color: '#3B82F6',
  gradient: 'from-blue-500 to-indigo-600',
  yahooSymbol: 'NEWPAIR=X', // Yahoo Finance symbol
  category: 'forex',
  pipValue: 0.0001,
  description: 'Description of the pair',
},
```
3. Add `'NEWPAIR'` to the `TradingPair` type in `lib/types.ts`
4. Add `'NEWPAIR'` to `PAIR_LIST` in `lib/constants.ts`
5. Add correlation notes in `lib/session.ts`

## 🛠️ Tech Stack

- **Next.js 15** — App Router, Server Components
- **TypeScript** — Full type safety
- **Tailwind CSS** — Premium dark UI
- **Gemini AI** — Vision + Text generation
- **Yahoo Finance API** — Free real-time market data
- **Custom Indicators** — RSI, MACD, Ichimoku, Fibonacci, Pivot Points, etc.

## 📄 License

MIT — Use freely for personal and commercial projects.

---

Built with ⚡ by ChartForge AI — The best on-demand chart analyzer for Pakistani traders in 2026.
