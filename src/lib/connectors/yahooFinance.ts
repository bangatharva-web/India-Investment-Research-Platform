import YahooFinance from "yahoo-finance2";

const yahoo = new YahooFinance();

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

  const quote: any =
    await yahoo.quote(yahooSymbol);

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

  const chart: any = await yahoo.chart(
    yahooSymbol,
    {
      period1: new Date(
        Date.now() -
          365 * 24 * 60 * 60 * 1000
      ),
      period2: new Date(),
      interval: "1d",
    }
  );

  const quotes = chart.quotes ?? [];

  const cleaned = quotes
    .filter(
      (row: any) =>
        row &&
        row.date &&
        row.open != null &&
        row.high != null &&
        row.low != null &&
        row.close != null &&
        row.volume != null
    )
    .map((row: any) => ({
      date: new Date(row.date)
        .toISOString()
        .slice(0, 10),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));

  if (!cleaned.length) {
    throw new Error(
      `No valid Yahoo chart data found for ${yahooSymbol}`
    );
  }

  return cleaned;
}