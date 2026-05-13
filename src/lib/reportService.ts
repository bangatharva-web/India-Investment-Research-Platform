import { buildMockReport, type Report } from "@/lib/mockReport";
import { getCachedReport, setCachedReport } from "@/lib/cache/reportCache";

export type AnalyzeCompanyRequest = {
  query: string;
  modules: string[];
};

export type AnalyzeCompanyResponse = {
  report: Report;
  mode: "demo" | "live";
  warnings: string[];
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const round = (n: any, digits = 2) =>
  typeof n === "number" && Number.isFinite(n) ? +n.toFixed(digits) : n;

const metricText = (value: any) =>
  value == null || Number.isNaN(value) || value === "NA" ? "NA" : value;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const addSectorSpecificThesis = (report: any) => {
  const thesis: string[] = report.executive.thesis ?? [];
  const sector = report.profile.sector ?? "";

  const alreadyHas = (text: string) =>
    thesis.some((t) => t.toLowerCase().includes(text.toLowerCase()));

  if (sector.includes("Technology") && !alreadyHas("utilization")) {
    thesis.push(
      "Deal pipeline, utilization trends, and attrition remain important operating indicators for IT services businesses."
    );
  }

  if (sector.includes("Financial") && !alreadyHas("CASA")) {
    thesis.push(
      "NIM trajectory, CASA growth, and credit quality remain key banking sector variables."
    );
  }

  if (sector.includes("Consumer") && !alreadyHas("rural demand")) {
    thesis.push(
      "Rural demand recovery and premiumization trends remain important FMCG growth drivers."
    );
  }

  if (sector.includes("Energy") && !alreadyHas("refining margins")) {
    thesis.push(
      "Refining margins, energy prices, and downstream demand remain important profitability drivers."
    );
  }

  report.executive.thesis = thesis;
};

const applyFinalValuationSafety = (report: any) => {
  const cmp = Number(report.profile.cmp);

  if (!cmp || Number.isNaN(cmp) || cmp <= 0) return;

  const minTarget = Math.round(cmp * 0.6);
  const maxTarget = Math.round(cmp * 1.6);

  let safeTarget = Number(report.executive.targetPrice);

  if (!safeTarget || Number.isNaN(safeTarget)) {
    safeTarget = Math.round(cmp * 1.08);
  }

  safeTarget = Math.round(clamp(safeTarget, minTarget, maxTarget));

  const hasExtremeValuation =
    report.valuation.dcf > cmp * 2 ||
    report.valuation.evEbitda > cmp * 2 ||
    report.valuation.pe > cmp * 2 ||
    report.valuation.pb > cmp * 2 ||
    report.valuation.intrinsic > cmp * 2 ||
    safeTarget > cmp * 1.6;

  if (hasExtremeValuation) {
    safeTarget = Math.round(clamp(safeTarget, minTarget, maxTarget));

    report.valuation.dcf = Math.round(safeTarget * 1.08);
    report.valuation.evEbitda = Math.round(safeTarget * 0.96);
    report.valuation.pe = Math.round(safeTarget * 1.14);
    report.valuation.pb = Math.round(safeTarget * 0.88);

    report.valuation.intrinsic = Math.round(
      (report.valuation.dcf +
        report.valuation.evEbitda +
        report.valuation.pe +
        report.valuation.pb) /
        4
    );
  }

  report.executive.targetPrice = safeTarget;

  report.executive.upsidePct = +(
    ((safeTarget - cmp) / cmp) *
    100
  ).toFixed(1);

  report.valuation.base = safeTarget;
  report.valuation.bull = Math.round(safeTarget * 1.2);
  report.valuation.bear = Math.round(safeTarget * 0.8);

  report.valuation.mosPct = +(
    ((report.valuation.intrinsic - cmp) / report.valuation.intrinsic) *
    100
  ).toFixed(1);

  report.scenarios = [
    {
      name: "Bull",
      probability: 25,
      targetPrice: report.valuation.bull,
      assumptions: [
        "Stronger earnings growth",
        "Margin expansion",
        "Sector rerating",
      ],
      drivers: ["Operating leverage", "Improved sentiment"],
      risks: ["Execution risk"],
    },
    {
      name: "Base",
      probability: 55,
      targetPrice: report.valuation.base,
      assumptions: [
        "Stable revenue growth",
        "Consistent margins",
        "Steady valuation multiple",
      ],
      drivers: ["Core earnings growth", "Normal market conditions"],
      risks: ["Moderate cyclicality"],
    },
    {
      name: "Bear",
      probability: 20,
      targetPrice: report.valuation.bear,
      assumptions: [
        "Growth slowdown",
        "Margin pressure",
        "Valuation compression",
      ],
      drivers: ["Weak demand", "Lower risk appetite"],
      risks: ["Downside earnings surprise"],
    },
  ];
};

export async function analyzeCompany(
  request: AnalyzeCompanyRequest
): Promise<AnalyzeCompanyResponse> {
  const dataMode = import.meta.env.VITE_DATA_MODE ?? "demo";

  if (dataMode === "live") {
    const cacheKey = request.query.trim().toUpperCase();
    const cached = getCachedReport(cacheKey);

    if (cached) {
      return cached;
    }

    const apiResponse = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.query,
        modules: request.modules,
      }),
    });
    
    if (!apiResponse.ok) {
      throw new Error("Failed to analyze company");
    }
    
    const result = await apiResponse.json();

    const report: any = buildMockReport(request.query);

    const liveData = result.liveData;
    const aiJson = result.aiJson;
    const aiMode = aiJson?.aiMode ?? "fallback";

    let confidenceScore = 50;

    if (liveData?.fundamentals) confidenceScore += 10;
    if (result.parsedFinancials?.length >= 4) confidenceScore += 10;
    if (result.financialMetrics?.revenueGrowth != null) confidenceScore += 10;
    if (aiMode === "gemini") confidenceScore += 15;
    if (liveData?.technicals?.rsi14 != null) confidenceScore += 5;

    if (liveData?.fundamentals) {
      report.profile.name =
        liveData.fundamentals.companyName ?? report.profile.name;

      report.profile.ticker =
        liveData.fundamentals.symbol ?? report.profile.ticker;

      report.profile.sector =
        liveData.fundamentals.sector ?? report.profile.sector;

      report.profile.industry =
        liveData.fundamentals.industry ?? report.profile.industry;

      report.profile.marketCapCr = liveData.fundamentals.marketCap
        ? Math.round(liveData.fundamentals.marketCap / 10000000)
        : report.profile.marketCapCr;

      report.profile.cmp = liveData.fundamentals.currentPrice
        ? Math.round(liveData.fundamentals.currentPrice)
        : report.profile.cmp;

      report.ratios.roe =
        liveData.fundamentals.roe != null
          ? +(liveData.fundamentals.roe * 100).toFixed(1)
          : report.ratios.roe;

      if (liveData.fundamentals.targetMeanPrice) {
        const target = Math.round(liveData.fundamentals.targetMeanPrice);

        report.executive.targetPrice = target;

        report.executive.upsidePct = +(
          ((target - report.profile.cmp) / report.profile.cmp) *
          100
        ).toFixed(1);

        report.valuation.base = target;
        report.valuation.intrinsic = target;
        report.valuation.bull = Math.round(target * 1.2);
        report.valuation.bear = Math.round(target * 0.8);

        report.valuation.dcf = Math.round(target * 1.08);
        report.valuation.evEbitda = Math.round(target * 0.96);
        report.valuation.pe = Math.round(target * 1.14);
        report.valuation.pb = Math.round(target * 0.88);

        report.valuation.mosPct = +(
          ((target - report.profile.cmp) / target) *
          100
        ).toFixed(1);
      }
    }

    if (liveData?.technicals) {
      report.technicals.dma20 = round(liveData.technicals.sma20);
      report.technicals.dma50 = round(liveData.technicals.sma50);
      report.technicals.dma100 = round(liveData.technicals.sma100);
      report.technicals.dma200 = round(liveData.technicals.sma200);

      report.technicals.rsi = round(liveData.technicals.rsi14);

      report.technicals.trend =
        liveData.technicals.trend ?? report.technicals.trend;

      report.technicals.momentum =
        liveData.technicals.momentum ?? report.technicals.momentum;

      report.technicals.signal =
        liveData.technicals.signal ?? report.technicals.signal;

      report.technicals.support =
        liveData.technicals.support ?? report.technicals.support;

      report.technicals.resistance =
        liveData.technicals.resistance ?? report.technicals.resistance;

      report.technicals.macd = {
        macd: round(liveData.technicals.macd?.MACD),
        signal: round(liveData.technicals.macd?.signal),
        histogram: round(liveData.technicals.macd?.histogram),
      };

      report.technicals.bollinger = {
        upper: round(liveData.technicals.bollinger?.upper),
        middle: round(liveData.technicals.bollinger?.middle),
        lower: round(liveData.technicals.bollinger?.lower),
      };

      report.technicals.avgVolume =
        Math.round(liveData.technicals.averageVolume) ||
        report.technicals.avgVolume;
    }

    if (result.financialMetrics && aiMode !== "gemini") {
      const revenueGrowth =
        result.financialMetrics.revenueGrowth == null
          ? "not reliable"
          : `${result.financialMetrics.revenueGrowth.toFixed(1)}%`;

      const revenueCAGR =
        result.financialMetrics.revenueCAGR == null
          ? "not reliable"
          : `${result.financialMetrics.revenueCAGR.toFixed(1)}%`;

      const netMargin =
        result.financialMetrics.netMargin == null
          ? "not reliable"
          : `${result.financialMetrics.netMargin.toFixed(1)}%`;

      const profitGrowth =
        result.financialMetrics.profitGrowth == null
          ? "not reliable"
          : `${result.financialMetrics.profitGrowth.toFixed(1)}%`;

      report.executive.thesis = [
        `Revenue growth is ${revenueGrowth}, with a ${revenueCAGR} multi-year revenue CAGR.`,
        `Net margin is ${netMargin}, based on parsed financial statement data.`,
        `Profit growth is ${profitGrowth}, subject to data-quality checks.`,
        `Technical setup currently indicates ${
          liveData?.technicals?.technicalConclusion ??
          `${report.technicals.trend}, ${report.technicals.momentum} momentum, and ${report.technicals.signal} signal.`
        }`,
      ];
    }

    if (aiJson) {
      report.business.model = aiJson.businessOverview ?? report.business.model;

      if (aiJson.investmentThesis?.length) {
        report.executive.thesis = aiJson.investmentThesis;
      }

      report.executive.risks = aiJson.keyRisks ?? report.executive.risks;

      report.executive.catalysts =
        aiJson.keyCatalysts ?? report.executive.catalysts;

      report.macro = aiJson.investmentConclusion ?? report.macro;

      report.sector = aiJson.financialSummary ?? report.sector;
    }

    addSectorSpecificThesis(report);

    if (result.peerData?.length) {
      report.peers = result.peerData.map((peer: any) => ({
        name: peer.name ?? peer.ticker,
        ticker: peer.ticker,
        mcapCr: peer.mcapCr ?? "NA",
        revGrowth: peer.revGrowth != null ? peer.revGrowth : "NA",
        ebitdaMargin: peer.margin != null ? peer.margin : "NA",
        roe: peer.roe != null ? peer.roe : "NA",
        pe: peer.pe != null ? peer.pe : "NA",
      }));

      report.peers.push({
        name: report.profile.name,
        ticker: report.profile.ticker,
        mcapCr: report.profile.marketCapCr,
        revGrowth:
          result.financialMetrics?.revenueGrowth != null
            ? Number(result.financialMetrics.revenueGrowth.toFixed(1))
            : "NA",
        ebitdaMargin:
          report.financials.ebitdaMargin?.[
            report.financials.ebitdaMargin.length - 1
          ] ?? "NA",
        roe: report.ratios.roe ?? "NA",
        pe: metricText(liveData?.fundamentals?.pe?.toFixed?.(1)),
      });

      report.valuation.peerMultiples = report.peers.map((peer: any) => ({
        name: peer.name,
        pe: peer.pe === "NA" ? null : Number(peer.pe),
        evEbitda: null,
        pb: null,
      }));
    }

    report.revenueMixEstimated = true;
    report.geographicMixEstimated = true;
    report.executive.confidenceScore = confidenceScore;

    report.dataQuality = {
      aiMode,
      templateSections: [
        "Revenue mix",
        "Geographic mix",
        "Moat analysis",
        "Governance commentary",
        "Management quality",
      ],
    };

    applyFinalValuationSafety(report);

    const warnings = [
      "Live market data, technical indicators, and financial statement parsing are active.",
      aiMode === "gemini"
        ? "AI-generated institutional narrative was successfully used."
        : "Fallback template narrative was used because Gemini quota/rate-limit failed.",
      "Revenue mix, geographic mix, moat analysis, governance commentary, and management quality may still contain estimated/template-assisted components.",
      "Shareholding and ESG scoring are not displayed unless verified source data is connected.",
    ];

    if (result.financialMetrics?.isBankLike) {
      warnings.push(
        "Bank/financial-sector metrics may require specialized interpretation because bank statements differ from non-financial companies."
      );
    }

    const response: AnalyzeCompanyResponse = {
      report,
      mode: "live",
      warnings,
    };

    setCachedReport(cacheKey, response);

    return response;
  }

  await delay(350);

  return {
    report: buildMockReport(request.query),
    mode: "demo",
    warnings: [
      "Demo mode is active. The report uses mock verified-style data. Real NSE/BSE/company filing connectors still need to be integrated.",
    ],
  };
}