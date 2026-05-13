import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getCompanyFundamentals } from "@/lib/connectors/companyFundamentals";
import { getCompanyFinancials } from "@/lib/connectors/companyFinancials";
import { parseFinancialStatements } from "@/lib/parsers/parseFinancialStatements";
import { generateFinancialMetrics } from "@/lib/analysis/generateFinancialMetrics";
import { generateTechnicalAnalysis } from "@/services/technicalAnalysis";

const aiCache = new Map<string, any>();
const companyNameCache = new Map<string, string>();

function cleanSymbol(symbol: string) {
  return String(symbol ?? "")
    .replace(/\.NS$/i, "")
    .trim()
    .toUpperCase();
}

function toYahooSymbol(symbol: string) {
  const clean = cleanSymbol(symbol);
  return symbol.toUpperCase().includes(".NS") ? symbol.toUpperCase() : `${clean}.NS`;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ""));
}

async function getCompanyNameFromNseMaster(symbol: string) {
  const clean = cleanSymbol(symbol);
  if (!clean) return clean;

  const cached = companyNameCache.get(clean);
  if (cached) return cached;

  try {
    const response = await fetch(
      "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/csv,*/*",
        },
      }
    );

    if (!response.ok) return clean;

    const csv = await response.text();
    const lines = csv.split(/\r?\n/).filter(Boolean);

    for (const line of lines.slice(1)) {
      const columns = parseCsvLine(line);
      const csvSymbol = columns[0]?.trim().toUpperCase();
      const companyName = columns[1]?.trim();

      if (csvSymbol === clean && companyName) {
        companyNameCache.set(clean, companyName);
        return companyName;
      }
    }
  } catch (error) {
    console.warn("NSE master company-name lookup failed", error);
  }

  return clean;
}

async function getCompanyNameFromNseQuote(symbol: string) {
  const clean = cleanSymbol(symbol);

  try {
    await fetch("https://www.nseindia.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const response = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(clean)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer: "https://www.nseindia.com/",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return (
      data?.info?.companyName ||
      data?.metadata?.companyName ||
      data?.securityInfo?.issuerName ||
      null
    );
  } catch {
    return null;
  }
}

async function resolveCompanyName(symbol: string) {
  const clean = cleanSymbol(symbol);

  const fromMaster = await getCompanyNameFromNseMaster(clean);
  if (fromMaster && fromMaster !== clean) return fromMaster;

  const fromQuote = await getCompanyNameFromNseQuote(clean);
  if (fromQuote) return fromQuote;

  return clean;
}

function getPeerSymbols(symbol: string) {
  const clean = cleanSymbol(symbol);

  const peerMap: Record<string, string[]> = {
    TCS: ["INFY", "HCLTECH", "WIPRO"],
    INFY: ["TCS", "HCLTECH", "WIPRO"],
    RELIANCE: ["IOC", "BPCL", "HINDPETRO"],
    HDFCBANK: ["ICICIBANK", "AXISBANK", "KOTAKBANK"],
    ITC: ["HINDUNILVR", "NESTLEIND", "BRITANNIA"],
  };

  return peerMap[clean] ?? [];
}

async function fallbackFundamentals(symbol: string) {
  const clean = cleanSymbol(symbol);
  const displayName = await resolveCompanyName(clean);

  return {
    symbol: toYahooSymbol(clean),
    companyName: displayName,
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
      provider: "NSE listed securities master / Yahoo Finance fallback",
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${clean}`,
      retrievedAt: new Date().toISOString(),
      status: "company_name_resolved_from_nse_master_if_available",
    },
  };
}

function fallbackTechnicals() {
  return {
    trend: "Not reliable from available data",
    momentum: "Not reliable from available data",
    signal: "Not reliable from available data",
    conclusion: "Technical data unavailable from verified source.",
    interpretation:
      "Technical indicators could not be generated because live market data was unavailable.",
  };
}

function mergeFundamentals(fallback: any, fetched: any, symbol: string) {
  const clean = cleanSymbol(symbol);
  const fetchedName = fetched?.companyName;
  const fallbackName = fallback?.companyName;

  const fetchedLooksLikeTicker =
    !fetchedName || cleanSymbol(fetchedName) === clean || !String(fetchedName).includes(" ");

  return {
    ...fallback,
    ...fetched,
    companyName: fetchedLooksLikeTicker ? fallbackName : fetchedName,
    symbol: fetched?.symbol ?? fallback?.symbol ?? toYahooSymbol(clean),
  };
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const data = await request.json();
          const apiKey = process.env.GEMINI_API_KEY;
          const symbol = cleanSymbol(data.query);

          let fundamentals: any = await fallbackFundamentals(symbol);
          let rawFinancials: any = null;
          let technicals: any = fallbackTechnicals();

          try {
            const fetchedFundamentals = await getCompanyFundamentals(symbol);
            fundamentals = mergeFundamentals(fundamentals, fetchedFundamentals, symbol);
          } catch (error) {
            console.warn("Fundamentals fetch failed", error);
          }

          try {
            rawFinancials = await getCompanyFinancials(symbol);
          } catch (error) {
            console.warn("Financials fetch failed", error);
          }

          try {
            technicals = await generateTechnicalAnalysis(symbol);
          } catch (error) {
            console.warn("Technical analysis failed", error);
          }

          const liveData = {
            symbol,
            fundamentals,
            technicals,
            retrievedAt: new Date().toISOString(),
          };

          const parsedFinancials = rawFinancials
            ? parseFinancialStatements(rawFinancials)
            : [];

          const financialMetrics =
            parsedFinancials.length > 0
              ? generateFinancialMetrics(parsedFinancials)
              : {
                  revenueGrowth: null,
                  revenueCAGR: null,
                  profitGrowth: null,
                  grossMargin: null,
                  operatingMargin: null,
                  netMargin: null,
                  roe: null,
                  roce: null,
                  debtToEquity: null,
                  currentRatio: null,
                  freeCashFlow: null,
                };

          const peerSymbols = getPeerSymbols(symbol);

          const peerData = await Promise.all(
            peerSymbols.map(async (peerSymbol) => {
              try {
                const peerFallback = await fallbackFundamentals(peerSymbol);
                let mergedPeer = peerFallback;

                try {
                  const peerFundamentals = await getCompanyFundamentals(peerSymbol);
                  mergedPeer = mergeFundamentals(peerFallback, peerFundamentals, peerSymbol);
                } catch {
                  mergedPeer = peerFallback;
                }

                return {
                  name: mergedPeer.companyName ?? peerSymbol,
                  ticker: mergedPeer.symbol ?? toYahooSymbol(peerSymbol),
                  mcapCr: mergedPeer.marketCap
                    ? Math.round(mergedPeer.marketCap / 10000000)
                    : null,
                  revGrowth: mergedPeer.revenueGrowth
                    ? +(mergedPeer.revenueGrowth * 100).toFixed(1)
                    : null,
                  margin: mergedPeer.profitMargins
                    ? +(mergedPeer.profitMargins * 100).toFixed(1)
                    : null,
                  roe: mergedPeer.roe ? +(mergedPeer.roe * 100).toFixed(1) : null,
                  pe: mergedPeer.pe ? +Number(mergedPeer.pe).toFixed(1) : null,
                };
              } catch {
                return null;
              }
            })
          );

          const cleanPeerData = peerData.filter(Boolean);

          const cacheKey = `${symbol}-${financialMetrics?.revenueGrowth ?? "na"}-${
            liveData.technicals?.trend ?? "na"
          }`;

          let aiJson: any = aiCache.get(cacheKey) ?? null;

          if (!aiJson && apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
Return ONLY valid compact JSON. No markdown.

Company: ${liveData.fundamentals?.companyName ?? symbol}
Ticker: ${liveData.fundamentals?.symbol ?? toYahooSymbol(symbol)}
Sector: ${liveData.fundamentals?.sector ?? "Not reliable from available data"}
Industry: ${liveData.fundamentals?.industry ?? "Not reliable from available data"}

Price: ${liveData.fundamentals?.currentPrice ?? "Not reliable from available data"}
MarketCap: ${liveData.fundamentals?.marketCap ?? "Not reliable from available data"}
PE: ${liveData.fundamentals?.pe ?? "Not reliable from available data"}

Return this JSON:
{
 "aiMode":"gemini",
 "businessOverview":"max 45 words",
 "investmentThesis":["max 16 words","max 16 words","max 16 words"],
 "keyRisks":["max 12 words","max 12 words","max 12 words"],
 "keyCatalysts":["max 12 words","max 12 words","max 12 words"],
 "financialSummary":"max 45 words",
 "technicalSummary":"max 45 words",
 "investmentConclusion":"max 55 words"
}
`;

            try {
              const result = await model.generateContent(prompt);
              const text = result.response.text();
              aiJson = JSON.parse(text.replace(/```json|```/g, "").trim());
              aiJson.aiMode = "gemini";
              aiCache.set(cacheKey, aiJson);
            } catch {
              aiJson = { aiMode: "fallback" };
            }
          }

          if (!aiJson) aiJson = { aiMode: "fallback" };

          return Response.json({
            liveData,
            parsedFinancials,
            financialMetrics,
            peerData: cleanPeerData,
            aiJson,
            generatedAt: new Date().toISOString(),
          });
        } catch (err: any) {
          console.error(err);

          return Response.json(
            { error: err?.message ?? "Unknown server error" },
            { status: 500 }
          );
        }
      },
    },
  },
});
