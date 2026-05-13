export async function getCompanyFundamentals(symbol: string) {
    const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.NS`;
  
    try {
      const response = await fetch(
        `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json",
          },
        }
      );
  
      if (!response.ok) {
        console.warn(`Yahoo fundamentals failed: ${response.status}`);
        throw new Error("Yahoo blocked request");
      }
  
      const data = await response.json();
      const quote = data?.quoteResponse?.result?.[0];
  
      if (!quote) throw new Error("No Yahoo quote found");
  
      return {
        symbol: yahooSymbol,
        companyName: quote.longName ?? quote.shortName ?? symbol,
        sector: quote.sector ?? null,
        industry: quote.industry ?? null,
        marketCap: quote.marketCap ?? null,
        pe: quote.trailingPE ?? quote.forwardPE ?? null,
        forwardPE: quote.forwardPE ?? null,
        dividendYield: quote.dividendYield ?? null,
        roe: null,
        revenueGrowth: null,
        profitMargins: null,
        currentPrice: quote.regularMarketPrice ?? null,
        targetMeanPrice: quote.targetMeanPrice ?? null,
        recommendation: quote.recommendationKey ?? null,
        source: {
          provider: "Yahoo Finance",
          url: `https://finance.yahoo.com/quote/${yahooSymbol}`,
          retrievedAt: new Date().toISOString(),
          status: "verified_if_available",
        },
      };
    } catch {
      return {
        symbol: yahooSymbol,
        companyName: symbol,
        sector: null,
        industry: null,
        marketCap: null,
        pe: null,
        forwardPE: null,
        dividendYield: null,
        roe: null,
        revenueGrowth: null,
        profitMargins: null,
        currentPrice: null,
        targetMeanPrice: null,
        recommendation: null,
        source: {
          provider: "Yahoo Finance",
          url: `https://finance.yahoo.com/quote/${yahooSymbol}`,
          retrievedAt: new Date().toISOString(),
          status: "not_available_from_verified_source",
        },
      };
    }
  }