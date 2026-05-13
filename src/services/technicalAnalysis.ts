export async function generateTechnicalAnalysis(symbol: string) {
    return {
      currentPrice: null,
      sma20: null,
      sma50: null,
      sma100: null,
      sma200: null,
      sma20Series: [],
      sma50Series: [],
      rsi14: null,
      macd: null,
      bollinger: null,
      trend: "Not available",
      momentum: "Not available",
      signal: "Not available",
      technicalConclusion:
        "Technical analysis is unavailable because live historical price data could not be verified.",
      support: [],
      resistance: [],
      candles: [],
      averageVolume: null,
      source: {
        name: "Verified market-data source",
        status: "not_available_from_verified_source",
        retrievedAt: new Date().toISOString(),
      },
    };
  }