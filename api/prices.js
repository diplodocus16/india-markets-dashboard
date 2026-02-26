let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const ASSET_DEFS = [
  { key:"sensex_inr", ticker:"^BSESN",  convertToINR:false, priceScale:1,              currency:"INR" },
  { key:"sensex_usd", ticker:"^BSESN",  convertToINR:false, priceScale:1,              currency:"USD", divideByRate:true },
  { key:"gold_inr",   ticker:"GC=F",    convertToINR:true,  priceScale:10/31.1035,     currency:"INR" },
  { key:"gold_usd",   ticker:"GC=F",    convertToINR:false, priceScale:1,              currency:"USD" },
  { key:"silver_inr", ticker:"SI=F",    convertToINR:true,  priceScale:1000/31.1035,   currency:"INR" },
  { key:"silver_usd", ticker:"SI=F",    convertToINR:false, priceScale:1,              currency:"USD" },
  { key:"snp500",     ticker:"^GSPC",   convertToINR:false, priceScale:1,              currency:"USD" },
  { key:"nasdaq",     ticker:"^IXIC",   convertToINR:false, priceScale:1,              currency:"USD" },
  ];

const UNIQUE_TICKERS = [...new Set(ASSET_DEFS.map(a => a.ticker)), "INR=X"];

async function fetchYahooPrice(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${ticker}`);
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    return meta?.regularMarketPrice ?? meta?.previousClose ?? null;
}

async function fetchPrices() {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL_MS) return cache;

  const rawPrices = {};
    await Promise.all(UNIQUE_TICKERS.map(async ticker => {
          try {
                  rawPrices[ticker] = await fetchYahooPrice(ticker);
          } catch(e) {
                  rawPrices[ticker] = null;
          }
    }));

  const usdInr = rawPrices["INR=X"] ?? 84.0;
    const currentYear = new Date().getFullYear();
    const prices = {};

  for (const def of ASSET_DEFS) {
        const raw = rawPrices[def.ticker];
        if (raw == null) {
                prices[def.key] = { year: currentYear, value: null, live: false };
                continue;
        }
        let value = raw * def.priceScale;
        if (def.convertToINR) value *= usdInr;
        if (def.divideByRate) value /= usdInr;
        prices[def.key] = { year: currentYear, value: Math.round(value * 100) / 100, live: true };
  }

  const result = { updatedAt: new Date().toISOString(), usdInr, prices };
    cache = result;
    cacheTime = now;
    return result;
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Cache-Control", "s-maxage=21600,stale-while-revalidate=3600");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
        const data = await fetchPrices();
        return res.status(200).json(data);
  } catch(err) {
        return res.status(500).json({ error: "Failed to fetch prices", detail: err.message });
  }
}
