export async function getCompanyFundamentals(symbol: string) {
    const yahooSymbol = symbol.includes(".")
      ? symbol
      : `${symbol}.NS`;
  
    const response = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=price,summaryDetail,financialData,defaultKeyStatistics,assetProfile`
    );
  
    if (!response.ok) {
      throw new Error("Failed to fetch company fundamentals");
    }
  
    const data = await response.json();
  
    const quote = data?.quoteSummary?.result?.[0];
  
    return {
      symbol: yahooSymbol,
  
      companyName:
        quote?.price?.longName ??
        quote?.price?.shortName ??
        symbol,
  
      sector:
        quote?.assetProfile?.sector ?? null,
  
      industry:
        quote?.assetProfile?.industry ?? null,
  
      marketCap:
        quote?.summaryDetail?.marketCap ?? null,
  
      pe:
        quote?.summaryDetail?.trailingPE ?? null,
  
      forwardPE:
        quote?.summaryDetail?.forwardPE ?? null,
  
      dividendYield:
        quote?.summaryDetail?.dividendYield ?? null,
  
      roe:
        quote?.financialData?.returnOnEquity ?? null,
  
      revenueGrowth:
        quote?.financialData?.revenueGrowth ?? null,
  
      profitMargins:
        quote?.financialData?.profitMargins ?? null,
  
      currentPrice:
        quote?.financialData?.currentPrice ?? null,
  
      targetMeanPrice:
        quote?.financialData?.targetMeanPrice ?? null,
  
      recommendation:
        quote?.financialData?.recommendationKey ?? null,
  
      source: {
        provider: "Yahoo Finance",
        url: `https://finance.yahoo.com/quote/${yahooSymbol}`,
        retrievedAt: new Date().toISOString(),
      },
    };
  }