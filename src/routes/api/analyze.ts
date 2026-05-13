import { createFileRoute } from "@tanstack/react-router";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { getCompanyFundamentals } from "@/lib/connectors/companyFundamentals";
import { getCompanyFinancials } from "@/lib/connectors/companyFinancials";
import { parseFinancialStatements } from "@/lib/parsers/parseFinancialStatements";
import { generateFinancialMetrics } from "@/lib/analysis/generateFinancialMetrics";
import { generateTechnicalAnalysis } from "@/services/technicalAnalysis";

const aiCache = new Map<string, any>();

function getPeerSymbols(symbol: string) {
  const clean = symbol.replace(".NS", "").toUpperCase();

  const peerMap: Record<string, string[]> = {
    TCS: ["INFY", "HCLTECH", "WIPRO"],
    INFY: ["TCS", "HCLTECH", "WIPRO"],
    RELIANCE: ["IOC", "BPCL", "HINDPETRO"],
    HDFCBANK: ["ICICIBANK", "AXISBANK", "KOTAKBANK"],
    ITC: ["HINDUNILVR", "NESTLEIND", "BRITANNIA"],
  };

  return peerMap[clean] ?? [];
}

const formatMetric = (value: number | null | undefined) =>
  value == null ? "Not reliable from available data" : value.toFixed(2);

export const Route = createFileRoute("/api/analyze")({
    server: {
      handlers: {
        POST: async ({ request }: { request: Request }) => {
          try {
            const data = await request.json();
  
            const apiKey = process.env.GEMINI_API_KEY;
  
            if (!apiKey) {
              return Response.json(
                { error: "Missing GEMINI_API_KEY" },
                { status: 500 }
              );
            }
  
            const symbol = data.query;
  
            const fundamentals = await getCompanyFundamentals(symbol);
            const technicals = await generateTechnicalAnalysis(symbol);
  
            const liveData = {
              symbol,
              fundamentals,
              technicals,
              retrievedAt: new Date().toISOString(),
            };
  
            const rawFinancials = await getCompanyFinancials(symbol);

            const parsedFinancials = rawFinancials
            ? parseFinancialStatements(rawFinancials)
            : [];

            const financialMetrics = parsedFinancials.length > 0
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
                  const fundamentals =
                    await getCompanyFundamentals(peerSymbol);
  
                  return {
                    name: fundamentals.companyName,
                    ticker: fundamentals.symbol,
                    mcapCr: fundamentals.marketCap
                      ? Math.round(fundamentals.marketCap / 10000000)
                      : null,
                    revGrowth: fundamentals.revenueGrowth
                      ? +(fundamentals.revenueGrowth * 100).toFixed(1)
                      : null,
                    margin: fundamentals.profitMargins
                      ? +(fundamentals.profitMargins * 100).toFixed(1)
                      : null,
                    roe: fundamentals.roe
                      ? +(fundamentals.roe * 100).toFixed(1)
                      : null,
                    pe: fundamentals.pe
                      ? +fundamentals.pe.toFixed(1)
                      : null,
                  };
                } catch {
                  return null;
                }
              })
            );
  
            const cleanPeerData = peerData.filter(Boolean);
  
            const cacheKey = `${symbol}-${financialMetrics?.revenueGrowth?.toFixed(
              1
            )}-${liveData.technicals.trend}`;
  
            let aiJson: any = aiCache.get(cacheKey) ?? null;
  
            if (!aiJson) {
              const genAI = new GoogleGenerativeAI(apiKey);
  
              const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
              });
  
              const prompt = `
  Return ONLY valid compact JSON. No markdown.
  
  Company: ${liveData.fundamentals.companyName}
  Ticker: ${liveData.fundamentals.symbol}
  Sector: ${liveData.fundamentals.sector}
  Industry: ${liveData.fundamentals.industry}
  
  Price: ${liveData.fundamentals.currentPrice}
  MarketCap: ${liveData.fundamentals.marketCap}
  PE: ${liveData.fundamentals.pe}
  
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
  
                aiJson = JSON.parse(
                  text.replace(/```json|```/g, "").trim()
                );
  
                aiJson.aiMode = "gemini";
  
                aiCache.set(cacheKey, aiJson);
              } catch {
                aiJson = {
                  aiMode: "fallback",
                };
              }
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