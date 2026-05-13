import { getNseQuote } from "./nse";
import { getScreenerCompanyData } from "./screener";

export async function getCompanyFundamentals(symbol: string) {
  const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "").toUpperCase();

  const emptySource = {
    provider: "NSE India / Screener.in",
    url: null,
    retrievedAt: new Date().toISOString(),
    status: "not_available_from_verified_source",
  };

  try {
    const [nseResult, screenerResult] = await Promise.allSettled([
      getNseQuote(cleanSymbol),
      getScreenerCompanyData(cleanSymbol),
    ]);

    const nse = nseResult.status === "fulfilled" ? nseResult.value : null;
    const screener =
      screenerResult.status === "fulfilled" ? screenerResult.value : null;

    return {
      symbol: cleanSymbol,
      companyName: nse?.companyName ?? screener?.companyName ?? cleanSymbol,
      sector: null,
      industry: null,

      currentPrice: nse?.currentPrice ?? screener?.currentPrice ?? null,
      marketCap: nse?.marketCap ?? screener?.marketCap ?? null,

      dayHigh: nse?.dayHigh ?? null,
      dayLow: nse?.dayLow ?? null,
      previousClose: nse?.previousClose ?? null,
      volume: nse?.volume ?? null,

      pe: screener?.pe ?? null,
      forwardPE: null,
      dividendYield: screener?.dividendYield ?? null,
      roe: screener?.roe ?? null,
      roce: screener?.roce ?? null,
      revenueGrowth: null,
      profitMargins: null,
      targetMeanPrice: null,
      recommendation: null,

      source: {
        provider: [nse?.source.provider, screener?.source.provider]
          .filter(Boolean)
          .join(" + "),
        url: {
          nse: nse?.source.url ?? null,
          screener: screener?.source.url ?? null,
        },
        retrievedAt: new Date().toISOString(),
        status:
          nse || screener
            ? "verified_if_available"
            : "not_available_from_verified_source",
      },
    };
  } catch {
    return {
      symbol: cleanSymbol,
      companyName: cleanSymbol,
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
      source: emptySource,
    };
  }
}