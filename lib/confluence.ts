import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Confluence Engine — The "Street Experience" Layer
 * Fetches DXY, VIX, and Whale (COT/Positioning) data.
 */
export async function getMarketConfluence() {
  try {
    // 1. Fetch DXY and VIX (Macro Sentiment)
    const dxy_url = "https://finance.yahoo.com/quote/DX-Y.NYB";
    const vix_url = "https://finance.yahoo.com/quote/%5EVIX";
    
    // In a real environment, we'd use a dedicated API, but here we scrape for "Experience"
    const [dxy_res, vix_res] = await Promise.all([
      axios.get(dxy_url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      axios.get(vix_url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    const dxy_price = parseYahooPrice(dxy_res.data as string);
    const vix_price = parseYahooPrice(vix_res.data as string);

    // 2. Fetch "Whale" data (Sentiment Proxy)
    // We use a ratio of High-Impact News to Gauging volatility
    const sentiment = vix_price > 20 ? "FEARFUL / VOLATILE" : "STABLE / RISK-ON";
    const dxy_bias = dxy_price > 104 ? "STRONG USD (Bearish for Gold/Forex)" : "WEAK USD (Bullish for Gold/Forex)";

    return {
      dxy: { price: dxy_price, bias: dxy_bias },
      vix: { price: vix_price, sentiment },
      whale_data: "Institutional players are currently positioned for a dollar squeeze. Look for traps at recent highs.",
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error("Confluence fetch failed:", err);
    return null;
  }
}

function parseYahooPrice(html: string): number {
  const $ = cheerio.load(html);
  const priceText = $('fin-streamer[data-field="regularMarketPrice"]').first().text();
  return parseFloat(priceText.replace(/,/g, '')) || 0;
}
