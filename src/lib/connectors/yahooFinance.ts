export type PriceCandle = {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  
  export async function getYahooQuote(symbol: string) {
    const yahooSymbol = symbol.includes(".")
      ? symbol
      : `${symbol}.NS`;
  
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`
    );
  
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Yahoo quote for ${yahooSymbol}`
      );
    }
  
    const data: any = await response.json();
  
    const quote =
      data?.quoteResponse?.result?.[0];
  
    if (!quote) {
      throw new Error(
        `No Yahoo quote data found for ${yahooSymbol}`
      );
    }
  
    return {
      symbol: yahooSymbol,
      shortName:
        quote.shortName ?? "Not available",
      currency: quote.currency ?? "INR",
      currentPrice:
        quote.regularMarketPrice ?? null,
      marketCap: quote.marketCap ?? null,
      dayHigh:
        quote.regularMarketDayHigh ?? null,
      dayLow:
        quote.regularMarketDayLow ?? null,
      previousClose:
        quote.regularMarketPreviousClose ??
        null,
      volume:
        quote.regularMarketVolume ?? null,
      source: {
        name: "Yahoo Finance",
        url: `https://finance.yahoo.com/quote/${yahooSymbol}`,
        retrievedAt:
          new Date().toISOString(),
      },
    };
  }
  
  export async function getYahooHistoricalPrices(
    symbol: string
  ): Promise<PriceCandle[]> {
    const yahooSymbol = symbol.includes(".")
      ? symbol
      : `${symbol}.NS`;
  
    const period1 = Math.floor(
      (Date.now() -
        365 * 24 * 60 * 60 * 1000) /
        1000
    );
  
    const period2 = Math.floor(
      Date.now() / 1000
    );
  
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d`
    );
  
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Yahoo chart data for ${yahooSymbol}`
      );
    }
  
    const data: any = await response.json();
  
    const result =
      data?.chart?.result?.[0];
  
    if (!result) {
      throw new Error(
        `No Yahoo chart result found for ${yahooSymbol}`
      );
    }
  
    const timestamps =
      result.timestamp ?? [];
  
    const quote =
      result.indicators?.quote?.[0];
  
    if (!quote) {
      throw new Error(
        `No Yahoo quote indicators found for ${yahooSymbol}`
      );
    }
  
    const cleaned: PriceCandle[] = [];
  
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];
  
      if (
        open == null ||
        high == null ||
        low == null ||
        close == null ||
        volume == null
      ) {
        continue;
      }
  
      cleaned.push({
        date: new Date(
          timestamps[i] * 1000
        )
          .toISOString()
          .slice(0, 10),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      });
    }
  
    if (!cleaned.length) {
      throw new Error(
        `No valid Yahoo chart data found for ${yahooSymbol}`
      );
    }
  
    return cleaned;
  }