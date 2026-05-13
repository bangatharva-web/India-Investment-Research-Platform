import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getCompanyFundamentals } from "@/lib/connectors/companyFundamentals";
import { getCompanyFinancials } from "@/lib/connectors/companyFinancials";
import { parseFinancialStatements } from "@/lib/parsers/parseFinancialStatements";
import { generateFinancialMetrics } from "@/lib/analysis/generateFinancialMetrics";
import { generateTechnicalAnalysis } from "@/services/technicalAnalysis";

const aiCache = new Map<string, any>();

function cleanSymbol(symbol: string) {
  return symbol.replace(".NS", "").toUpperCase().trim();
}

async function getScreenerCompanyName(symbol: string) {
    const clean = cleanSymbol(symbol);
  
    try {
      const response = await fetch(`https://www.screener.in/company/${clean}/`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html",
        },
      });
  
      if (!response.ok) return null;
  
      const html = await response.text();
  
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const h1Match = html.match(/<h1[^>]*>\s*(.*?)\s*<\/h1>/i);
  
      const rawName =
        h1Match?.[1]?.replace(/<[^>]+>/g, "").trim() ||
        titleMatch?.[1]?.split("share price")[0]?.trim() ||
        null;
  
      return rawName || null;
    } catch {
      return null;
    }
  }
  
  async function getNseCompanyName(symbol: string) {
    const clean = cleanSymbol(symbol);
  
    const screenerName = await getScreenerCompanyName(clean);
    if (screenerName) return screenerName;
  
    try {
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
  
      if (!response.ok) return clean;
  
      const data = await response.json();
  
      return (
        data?.info?.companyName ||
        data?.metadata?.companyName ||
        data?.securityInfo?.issuerName ||
        clean
      );
    } catch {
      return clean;
    }
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
  const yahooSymbol = symbol.includes(".") ? symbol : `${clean}.NS`;
  const displayName = await getNseCompanyName(symbol);

  return {
    symbol: yahooSymbol,
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
      provider: "NSE India / Yahoo Finance fallback",
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${clean}`,
      retrievedAt: new Date().toISOString(),
      status: "company_name_resolved_from_nse_if_available",
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

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const data = await request.json();

          const apiKey = process.env.GEMINI_API_KEY;
          const symbol = data.query;

          let fundamentals: any = await fallbackFundamentals(symbol);
          let rawFinancials: any = null;
          let technicals: any = fallbackTechnicals();

          try {
            const fetchedFundamentals = await getCompanyFundamentals(symbol);

            fundamentals = {
              ...fundamentals,
              ...fetchedFundamentals,
              companyName:
                fetchedFundamentals?.companyName ||
                fundamentals.companyName ||
                cleanSymbol(symbol),
            };
          } catch (e) {
            console.warn("Fundamentals fetch failed", e);
          }

          try {
            rawFinancials = await getCompanyFinancials(symbol);
          } catch (e) {
            console.warn("Financials fetch failed", e);
          }

          try {
            technicals = await generateTechnicalAnalysis(symbol);
          } catch (e) {
            console.warn("Technical analysis failed", e);
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
                const peerFundamentals =
                  await getCompanyFundamentals(peerSymbol);

                const mergedPeer = {
                  ...peerFallback,
                  ...peerFundamentals,
                  companyName:
                    peerFundamentals?.companyName ||
                    peerFallback.companyName ||
                    peerSymbol,
                };

                return {
                  name: mergedPeer.companyName,
                  ticker: mergedPeer.symbol,
                  mcapCr: mergedPeer.marketCap
                    ? Math.round(mergedPeer.marketCap / 10000000)
                    : null,
                  revGrowth: mergedPeer.revenueGrowth
                    ? +(mergedPeer.revenueGrowth * 100).toFixed(1)
                    : null,
                  margin: mergedPeer.profitMargins
                    ? +(mergedPeer.profitMargins * 100).toFixed(1)
                    : null,
                  roe: mergedPeer.roe
                    ? +(mergedPeer.roe * 100).toFixed(1)
                    : null,
                  pe: mergedPeer.pe ? +mergedPeer.pe.toFixed(1) : null,
                };
              } catch {
                return null;
              }
            })
          );

          const cleanPeerData = peerData.filter(Boolean);

          const cacheKey = `${symbol}-${
            financialMetrics?.revenueGrowth ?? "na"
          }-${liveData.technicals?.trend ?? "na"}`;

          let aiJson: any = aiCache.get(cacheKey) ?? null;

          if (!aiJson && apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);

            const model = genAI.getGenerativeModel({
              model: "gemini-2.0-flash",
            });

            const prompt = `
Return ONLY valid compact JSON. No markdown.

Company: ${liveData.fundamentals?.companyName ?? cleanSymbol(symbol)}
Ticker: ${liveData.fundamentals?.symbol ?? symbol}
Sector: ${liveData.fundamentals?.sector ?? "Not reliable from available data"}
Industry: ${liveData.fundamentals?.industry ?? "Not reliable from available data"}

Price: ${
              liveData.fundamentals?.currentPrice ??
              "Not reliable from available data"
            }
MarketCap: ${
              liveData.fundamentals?.marketCap ??
              "Not reliable from available data"
            }
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

          if (!aiJson) {
            aiJson = { aiMode: "fallback" };
          }

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
            {
              error: err?.message ?? "Unknown server error",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});