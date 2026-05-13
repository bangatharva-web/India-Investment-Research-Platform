import { getScreenerCompanyData } from "./screener";

export async function getCompanyFinancials(symbol: string) {
  const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "").toUpperCase();

  try {
    const data = await getScreenerCompanyData(cleanSymbol);

    return {
      symbol: cleanSymbol,
      companyName: data.companyName,
      financialText: data.rawText,
      metrics: {
        currentPrice: data.currentPrice,
        marketCap: data.marketCap,
        pe: data.pe,
        bookValue: data.bookValue,
        dividendYield: data.dividendYield,
        roe: data.roe,
        roce: data.roce,
        faceValue: data.faceValue,
      },
      source: data.source,
    };
  } catch (err) {
    console.warn("Verified financials unavailable", err);

    return {
      symbol: cleanSymbol,
      companyName: cleanSymbol,
      financialText: null,
      metrics: null,
      source: {
        provider: "Screener.in",
        url: `https://www.screener.in/company/${cleanSymbol}/consolidated/`,
        retrievedAt: new Date().toISOString(),
        status: "not_available_from_verified_source",
      },
    };
  }
}