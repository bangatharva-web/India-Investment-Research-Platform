export type PriceCandle = {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  
  const NSE_BASE = "https://www.nseindia.com";
  
  const NSE_HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    Accept: "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.nseindia.com/",
  };
  
  function cleanSymbol(symbol: string) {
    return symbol.replace(".NS", "").replace(".BO", "").trim().toUpperCase();
  }
  
  async function getNseCookies() {
    const res = await fetch(NSE_BASE, { headers: NSE_HEADERS });
    const cookies = res.headers.get("set-cookie");
    return cookies ?? "";
  }
  
  async function nseFetchJson(url: string) {
    const cookie = await getNseCookies();
  
    const res = await fetch(url, {
      headers: {
        ...NSE_HEADERS,
        Cookie: cookie,
      },
    });
  
    const text = await res.text();
  
    if (!res.ok) {
      throw new Error(`NSE request failed: ${res.status}`);
    }
  
    if (text.trim().startsWith("<")) {
      throw new Error("NSE returned HTML instead of JSON. Likely blocked.");
    }
  
    return JSON.parse(text);
  }
  
  export async function getNseQuote(symbol: string) {
    const nseSymbol = cleanSymbol(symbol);
  
    const url = `${NSE_BASE}/api/quote-equity?symbol=${encodeURIComponent(
      nseSymbol
    )}`;
  
    const data = await nseFetchJson(url);
    const priceInfo = data?.priceInfo ?? {};
    const meta = data?.info ?? {};
    const securityInfo = data?.securityInfo ?? {};
  
    return {
      symbol: nseSymbol,
      companyName: meta.companyName ?? nseSymbol,
      currentPrice: priceInfo.lastPrice ?? null,
      dayHigh: priceInfo.intraDayHighLow?.max ?? null,
      dayLow: priceInfo.intraDayHighLow?.min ?? null,
      previousClose: priceInfo.previousClose ?? null,
      open: priceInfo.open ?? null,
      volume: securityInfo.tradedVolume ?? null,
      marketCap: securityInfo.marketCap ?? null,
      currency: "INR",
      source: {
        provider: "NSE India",
        url: `https://www.nseindia.com/get-quotes/equity?symbol=${nseSymbol}`,
        retrievedAt: new Date().toISOString(),
        status: "verified_if_available",
      },
    };
  }
  
  function formatNseDate(date: Date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  
  export async function getNseHistoricalPrices(
    symbol: string
  ): Promise<PriceCandle[]> {
    const nseSymbol = cleanSymbol(symbol);
  
    const to = new Date();
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
  
    const url =
      `${NSE_BASE}/api/historical/cm/equity?symbol=${encodeURIComponent(nseSymbol)}` +
      `&series=%5B%22EQ%22%5D&from=${formatNseDate(from)}&to=${formatNseDate(to)}`;
  
    const data = await nseFetchJson(url);
    const rows = data?.data ?? [];
  
    const candles = rows
      .map((row: any) => ({
        date: row.CH_TIMESTAMP,
        open: Number(row.CH_OPENING_PRICE),
        high: Number(row.CH_TRADE_HIGH_PRICE),
        low: Number(row.CH_TRADE_LOW_PRICE),
        close: Number(row.CH_CLOSING_PRICE),
        volume: Number(row.CH_TOT_TRADED_QTY),
      }))
      .filter(
        (c: PriceCandle) =>
          c.date &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close) &&
          Number.isFinite(c.volume)
      )
      .reverse();
  
    if (!candles.length) {
      throw new Error("No verified NSE historical price data available.");
    }
  
    return candles;
  }