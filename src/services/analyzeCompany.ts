import { createServerFn } from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getLiveCompanyData } from "@/services/getLiveCompanyData";
import { getCompanyFundamentals } from "@/lib/connectors/companyFundamentals";
import { getCompanyFinancials } from "@/lib/connectors/companyFinancials";
import { parseFinancialStatements } from "@/lib/parsers/parseFinancialStatements";
import { generateFinancialMetrics } from "@/lib/analysis/generateFinancialMetrics";

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

export const analyzeCompany = createServerFn({
  method: "POST",
}).handler(async (ctx: any) => {
  const data = ctx.data;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const symbol = data.query;

  const liveData = await (getLiveCompanyData as any)({
    data: { symbol },
  });

  const rawFinancials = await getCompanyFinancials(symbol);
  const parsedFinancials = parseFinancialStatements(rawFinancials);
  const financialMetrics = generateFinancialMetrics(parsedFinancials);
  const latest = parsedFinancials?.[0];

  const peerSymbols = getPeerSymbols(symbol);

  const peerData = await Promise.all(
    peerSymbols.map(async (peerSymbol) => {
      try {
        const fundamentals = await getCompanyFundamentals(peerSymbol);

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
          pe: fundamentals.pe ? +fundamentals.pe.toFixed(1) : null,
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

  let text = "";
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
ForwardPE: ${liveData.fundamentals.forwardPE}
ROE: ${liveData.fundamentals.roe}
DividendYield: ${liveData.fundamentals.dividendYield}
Recommendation: ${liveData.fundamentals.recommendation}

RevenueYoY: ${formatMetric(financialMetrics?.revenueGrowth)}%
ProfitYoY: ${formatMetric(financialMetrics?.profitGrowth)}%
NetMargin: ${formatMetric(financialMetrics?.netMargin)}%
RevenueCAGR: ${formatMetric(financialMetrics?.revenueCAGR)}%

LatestRevenue: ${latest?.revenue}
LatestNetIncome: ${latest?.netIncome}
LatestFCF: ${latest?.freeCashFlow}
LatestDebt: ${latest?.debt}

Trend: ${liveData.technicals.trend}
Momentum: ${liveData.technicals.momentum}
Signal: ${liveData.technicals.signal}
RSI: ${liveData.technicals.rsi14}

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

Use Buffett/Munger-style business quality thinking.
Use institutional equity research tone.
`;

    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();

      aiJson = JSON.parse(text.replace(/```json|```/g, "").trim());
      aiJson.aiMode = "gemini";

      aiCache.set(cacheKey, aiJson);
    } catch (err) {
      console.error("Gemini failed or quota exceeded:", err);

      aiJson = {
        aiMode: "fallback",
        businessOverview: `${liveData.fundamentals.companyName} operates in ${
          liveData.fundamentals.industry ?? liveData.fundamentals.sector
        }. The business should be evaluated on scale, profitability, capital intensity, and durability of cash flows.`,
        investmentThesis: [
          "Business quality supported by scale and sector positioning.",
          "Profitability remains important despite near-term growth volatility.",
          `Technical setup currently indicates ${liveData.technicals.trend.toLowerCase()} conditions.`,
        ],
        keyRisks: [
          "Growth moderation may pressure valuation multiples.",
          "Margin volatility could affect earnings quality.",
          "Weak technical setup may delay rerating.",
        ],
        keyCatalysts: [
          "Improved earnings momentum.",
          "Margin expansion.",
          "Positive sector rerating.",
        ],
        financialSummary: `Revenue CAGR is ${
          financialMetrics?.revenueCAGR == null
            ? "not reliable from available data"
            : `${financialMetrics.revenueCAGR.toFixed(1)}%`
        }, with profit growth of ${
          financialMetrics?.profitGrowth == null
            ? "not reliable from available data"
            : `${financialMetrics.profitGrowth.toFixed(1)}%`
        }.`,
        technicalSummary: `The stock shows ${liveData.technicals.trend}, ${liveData.technicals.momentum} momentum, and a ${liveData.technicals.signal} signal.`,
        investmentConclusion:
          "The stock requires balanced assessment of business quality, valuation, growth durability, and near-term technical conditions.",
      };

      text = JSON.stringify(aiJson);
    }
  } else {
    text = JSON.stringify(aiJson);
  }

  return {
    summary: text,
    aiJson,
    liveData,
    parsedFinancials,
    financialMetrics,
    peerData: cleanPeerData,
    generatedAt: new Date().toISOString(),
  };
});