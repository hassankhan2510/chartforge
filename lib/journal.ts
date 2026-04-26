import fs from 'fs';
import path from 'path';

export interface JournalEntry {
  id: string;
  timestamp: string; // ISO string
  pair: string;
  style: string;
  consensus: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  action: 'BUY' | 'SELL' | null;
  entry: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  riskReward: string | null;
  explanation: string; // The "if-then" reasoning
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'trades.json');

// Initialize database
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function saveTrade(entry: JournalEntry): boolean {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const trades: JournalEntry[] = JSON.parse(data);
    
    // Add to top of file
    trades.unshift(entry);
    
    fs.writeFileSync(DB_FILE, JSON.stringify(trades, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Failed to save trade to journal:", error);
    return false;
  }
}

export function getTrades(
  filters?: { pair?: string; style?: string; startDate?: string; endDate?: string }
): JournalEntry[] {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    let trades: JournalEntry[] = JSON.parse(data);
    
    if (filters) {
      if (filters.pair) trades = trades.filter(t => t.pair === filters.pair);
      if (filters.style) trades = trades.filter(t => t.style === filters.style);
      
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        trades = trades.filter(t => new Date(t.timestamp).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        trades = trades.filter(t => new Date(t.timestamp).getTime() <= end);
      }
    }
    
    return trades;
  } catch (error) {
    console.error("Failed to get trades from journal:", error);
    return [];
  }
}
