// Mock verified dataset. Each field carries a citation so the UI can render audit trails.
// In production, replace this generator with backend connectors to NSE/BSE/SEBI/IR pages.

export type Citation = {
  source: string;
  url: string;
  filingDate: string;
  retrieved: string;
};

const today = new Date().toISOString();

const cite = (
  source: string,
  url: string,
  filingDate: string
): Citation => ({
  source,
  url,
  filingDate,
  retrieved: today,
});

export type CompanyProfile = {
  ticker: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  industry: string;
  isin: string;
  marketCapCr: number;
  cmp: number;
  fy: string;
  description: string;
  website: string;
  promoterHolding: number;
  fiiHolding: number;
  diiHolding: number;
  publicHolding: number;
};

export type Report = {
  generatedAt: string;
  profile: CompanyProfile;
  sources: Citation[];

  freshness: {
    latestQuarterly: string;
    latestAnnual: string;
    priceAsOf: string;
    stale: boolean;
  };

  executive: {
    verdict: "BUY" | "HOLD" | "SELL";
    conviction: "Low" | "Moderate" | "High";
    targetPrice: number;
    upsidePct: number;
    confidenceScore?: number;
    thesis: string[];
    risks: string[];
    catalysts: string[];
  };

  business: {
    model: string;
    segments: {
      name: string;
      revShare: number;
    }[];

    geography: {
      name: string;
      revShare: number;
    }[];
  };

  financials: {
    years: string[];
    revenue: number[];
    ebitda: number[];
    pat: number[];
    fcf: number[];
    ebitdaMargin: number[];
    patMargin: number[];
  };

  ratios: {
    roe: number;
    roce: number;
    roic: number;
    debtEquity: number;
    current: number;
    quick: number;
    interestCoverage: number;
    assetTurnover: number;
    fcfConversion: number;
    operatingLeverage: number;
  };

  dupont: {
    netMargin: number;
    assetTurnover: number;
    equityMultiplier: number;
    roe: number;
  };

  valuation: {
    dcf: number;
    evEbitda: number;
    pe: number;
    pb: number;
    ddm: number | null;

    bull: number;
    base: number;
    bear: number;

    intrinsic: number;
    mosPct: number;

    peerMultiples: {
      name: string;
      pe: number;
      evEbitda: number;
      pb: number;
    }[];
  };

  technicals: {
    dma20: number;
    dma50: number;
    dma100: number;
    dma200: number;

    rsi: number;

    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };

    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };

    support: number[];
    resistance: number[];

    avgVolume: number;
    deliveryPct: number;

    trend: string;
    momentum: string;
    signal: string;

    priceHistory: {
      date: string;
      close: number;
      volume: number;
    }[];
  };

  moat: {
    dimension: string;
    score: number;
    rationale: string;
  }[];

  management: {
    ceo: string;
    chair: string;
    tenureYrs: number;
    capitalAllocation: string;
    governance: string;
    execution: string;
    promoterPledge: number;
    relatedParty: string;
  };

  esg: {
    environmental: number;
    social: number;
    governance: number;
    commentary: string;
  };

  macro: string;
  sector: string;

  scenarios: {
    name: "Bull" | "Base" | "Bear";
    probability: number;
    targetPrice: number;
    assumptions: string[];
    drivers: string[];
    risks: string[];
  }[];

  risks: {
    category: string;
    description: string;
    severity: "Low" | "Med" | "High";
  }[];

  catalysts: {
    date: string;
    event: string;
    impact: "Low" | "Med" | "High";
  }[];

  peers: {
    name: string;
    ticker: string;
    mcapCr: number;
    revGrowth: number | string;
    ebitdaMargin: number | string;
    roe: number | string;
    pe: number | string;
  }[];

  revenueMixEstimated?: boolean;
  geographicMixEstimated?: boolean;
  dataQuality?: {
    aiMode: string;
    templateSections: string[];
  };
};

const COMPANIES: Record<string, Partial<CompanyProfile>> = {
  RELIANCE: {
    name: "Reliance Industries Limited",
    sector: "Energy",
    industry: "Oil & Gas Refining & Marketing",
    isin: "INE002A01018",
    marketCapCr: 1845829,
    cmp: 1364,
    website: "https://www.ril.com",
  },

  TCS: {
    name: "Tata Consultancy Services Limited",
    sector: "Technology",
    industry: "IT Services",
    isin: "INE467B01029",
    marketCapCr: 1420000,
    cmp: 3920,
    website: "https://www.tcs.com",
  },

  INFY: {
    name: "Infosys Limited",
    sector: "Technology",
    industry: "IT Services",
    isin: "INE009A01021",
    marketCapCr: 745000,
    cmp: 1820,
    website: "https://www.infosys.com",
  },

  HDFCBANK: {
    name: "HDFC Bank Limited",
    sector: "Financials",
    industry: "Private Sector Bank",
    isin: "INE040A01034",
    marketCapCr: 1280000,
    cmp: 1685,
    website: "https://www.hdfcbank.com",
  },

  ITC: {
    name: "ITC Limited",
    sector: "Consumer Defensive",
    industry: "FMCG",
    isin: "INE154A01025",
    marketCapCr: 580000,
    cmp: 465,
    website: "https://www.itcportal.com",
  },
};

function seeded(s: string) {
  let h = 2166136261;

  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }

  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return (h >>> 8) / 0xffffff;
  };
}

const clampTargetPrice = (target: number, cmp: number) => {
  if (!Number.isFinite(target) || !Number.isFinite(cmp) || cmp <= 0) {
    return target;
  }

  const maxTarget = cmp * 1.6;
  const minTarget = cmp * 0.6;

  return Math.round(Math.min(Math.max(target, minTarget), maxTarget));
};

export function buildMockReport(query: string): Report {
  const ticker = query.trim().toUpperCase().replace(/\s+/g, "");

  const known = COMPANIES[ticker] ?? {};

  const rnd = seeded(ticker || "DEFAULT");

  const cmp =
    known.cmp ??
    Math.round(500 + rnd() * 3500);

  const profile: CompanyProfile = {
    ticker: ticker || "SAMPLE",

    name:
      known.name ??
      `${ticker || "Sample"} Industries Ltd`,

    exchange: "NSE",

    sector:
      known.sector ??
      "Diversified",

    industry:
      known.industry ??
      "Industrials",

    isin:
      known.isin ??
      "INE000X00000",

    marketCapCr:
      known.marketCapCr ??
      Math.round(20000 + rnd() * 200000),

    cmp,

    fy: "FY24",

    description: `${
      known.name ?? ticker
    } is an India-listed company operating in ${
      known.sector ?? "diversified industries"
    }. Profile and financial snapshot extracted from latest exchange filings and annual report.`,

    website:
      known.website ??
      "https://www.nseindia.com",

    promoterHolding: 50.3,
    fiiHolding: 22.4,
    diiHolding: 14.1,
    publicHolding: 13.2,
  };

  const years = [
    "FY20",
    "FY21",
    "FY22",
    "FY23",
    "FY24",
  ];

  const base =
    profile.marketCapCr * 0.18;

  const revenue = years.map((_, i) =>
    Math.round(
      base *
        (1 + 0.11 * i) *
        (0.9 + rnd() * 0.2)
    )
  );

  const ebitda = revenue.map((r) =>
    Math.round(r * (0.18 + rnd() * 0.06))
  );

  const pat = ebitda.map((e) =>
    Math.round(e * (0.55 + rnd() * 0.1))
  );

  const fcf = pat.map((p) =>
    Math.round(p * (0.7 + rnd() * 0.2))
  );

  const ebitdaMargin = revenue.map(
    (r, i) =>
      +(
        (ebitda[i] / r) *
        100
      ).toFixed(1)
  );

  const patMargin = revenue.map(
    (r, i) =>
      +(
        (pat[i] / r) *
        100
      ).toFixed(1)
  );

  const cit_nse = cite(
    "NSE India",
    `https://www.nseindia.com/get-quotes/equity?symbol=${profile.ticker}`,
    "2025-03-31"
  );

  const cit_bse = cite(
    "BSE India",
    `https://www.bseindia.com/stock-share-price/${profile.ticker.toLowerCase()}`,
    "2025-03-31"
  );

  const cit_ar = cite(
    `${profile.name} Annual Report FY24`,
    profile.website +
      "/investors/annual-report",
    "2024-08-15"
  );

  const cit_ip = cite(
    `${profile.name} Investor Presentation Q4 FY24`,
    profile.website +
      "/investors/presentations",
    "2024-05-20"
  );

  const cit_sebi = cite(
    "SEBI Disclosures",
    "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doListingAll=yes",
    "2024-12-01"
  );

  const cit_pr = cite(
    `${profile.name} Press Release`,
    profile.website +
      "/media/press-releases",
    "2025-01-10"
  );

  const dma200 = +(
    cmp *
    (0.92 + rnd() * 0.08)
  ).toFixed(2);

  const dma100 = +(
    cmp *
    (0.95 + rnd() * 0.07)
  ).toFixed(2);

  const dma50 = +(
    cmp *
    (0.97 + rnd() * 0.05)
  ).toFixed(2);

  const dma20 = +(
    cmp *
    (0.99 + rnd() * 0.03)
  ).toFixed(2);

  const priceHistory: {
    date: string;
    close: number;
    volume: number;
  }[] = [];

  let price = cmp * 0.85;

  for (let i = 180; i >= 0; i--) {
    price =
      price *
      (1 + (rnd() - 0.48) * 0.018);

    const d = new Date();

    d.setDate(d.getDate() - i);

    priceHistory.push({
      date: d.toISOString().slice(0, 10),

      close: +price.toFixed(2),

      volume: Math.round(
        500000 + rnd() * 2000000
      ),
    });
  }

  priceHistory[
    priceHistory.length - 1
  ].close = cmp;

  const dcf = Math.round(
    cmp * (1.12 + rnd() * 0.30)
  );
  
  const evEbitdaValue = Math.round(
    cmp * (0.90 + rnd() * 0.35)
  );
  
  const peValue = Math.round(
    cmp * (0.82 + rnd() * 0.45)
  );
  
  const pbValue = Math.round(
    cmp * (0.75 + rnd() * 0.28)
  );
  
  const intrinsic = Math.round(
    (
      dcf +
      evEbitdaValue +
      peValue +
      pbValue
    ) / 4
  );
  
  const rawTarget = Math.round(
    intrinsic * (0.97 + rnd() * 0.08)
  );

  const target = clampTargetPrice(rawTarget, cmp);

  const verdict:
    | "BUY"
    | "HOLD"
    | "SELL" =
    target > cmp * 1.12
      ? "BUY"
      : target < cmp * 0.95
      ? "SELL"
      : "HOLD";

  return {
    generatedAt: today,

    profile,

    sources: [
      cit_nse,
      cit_bse,
      cit_ar,
      cit_ip,
      cit_sebi,
      cit_pr,
    ],

    freshness: {
      latestQuarterly: "2025-01-22",
      latestAnnual: "2024-08-15",
      priceAsOf: today,
      stale: false,
    },

    executive: {
      verdict,

      conviction: "Moderate",

      targetPrice: target,

      upsidePct: +(
        ((target / cmp) - 1) *
        100
      ).toFixed(1),

      thesis: [
        "Business quality supported by scale and sector positioning.",

        "Profitability remains important despite near-term growth volatility.",

        `Technical setup currently indicates ${
          cmp > dma200
            ? "uptrend"
            : "downtrend"
        } conditions.`,
      ],

      risks: [
        "Growth moderation may pressure valuation multiples.",
        "Margin volatility could affect earnings quality.",
        "Weak technical setup may delay rerating.",
      ],

      catalysts: [
        "Improved earnings momentum.",
        "Margin expansion.",
        "Positive sector rerating.",
      ],
    },

    business: {
      model: `${profile.name} operates in ${profile.industry}. The business should be evaluated on scale, profitability, capital intensity, and durability of cash flows.`,

      segments: [
        {
          name:
            profile.sector.includes(
              "Technology"
            )
              ? "IT Services"
              : profile.sector.includes(
                  "Energy"
                )
              ? "Energy & Petrochemicals"
              : profile.sector.includes(
                  "Consumer"
                )
              ? "FMCG & Consumer"
              : "Core Business",

          revShare: 70,
        },

        {
          name: "Growth Segments",
          revShare: 20,
        },

        {
          name: "Other",
          revShare: 10,
        },
      ],

      geography: [
        {
          name: "India",

          revShare:
            profile.sector.includes(
              "Technology"
            )
              ? 8
              : 75,
        },

        {
          name:
            profile.sector.includes(
              "Technology"
            )
              ? "North America"
              : "International",

          revShare:
            profile.sector.includes(
              "Technology"
            )
              ? 52
              : 15,
        },

        {
          name: "Other Regions",

          revShare:
            profile.sector.includes(
              "Technology"
            )
              ? 40
              : 10,
        },
      ],
    },

    financials: {
      years,
      revenue,
      ebitda,
      pat,
      fcf,
      ebitdaMargin,
      patMargin,
    },

    ratios: {
      roe: +(15 + rnd() * 8).toFixed(1),

      roce: +(18 + rnd() * 8).toFixed(1),

      roic: +(16 + rnd() * 7).toFixed(1),

      debtEquity: +(
        0.2 +
        rnd() * 0.5
      ).toFixed(2),

      current: +(
        1.4 +
        rnd() * 0.6
      ).toFixed(2),

      quick: +(
        1.1 +
        rnd() * 0.5
      ).toFixed(2),

      interestCoverage: +(
        5 +
        rnd() * 8
      ).toFixed(1),

      assetTurnover: +(
        0.7 +
        rnd() * 0.6
      ).toFixed(2),

      fcfConversion: +(
        0.65 +
        rnd() * 0.2
      ).toFixed(2),

      operatingLeverage: +(
        1.2 +
        rnd() * 0.6
      ).toFixed(2),
    },

    dupont: {
      netMargin: patMargin[4],

      assetTurnover: 0.92,

      equityMultiplier: 1.85,

      roe: +(
        patMargin[4] *
        0.92 *
        1.85
      ).toFixed(1),
    },

    valuation: {
      dcf,

      evEbitda: evEbitdaValue,
      
      pe: peValue,
      
      pb: pbValue,

      ddm: profile.sector.includes(
        "Financ"
      )
        ? Math.round(
            cmp *
              (0.95 + rnd() * 0.15)
          )
        : null,

      bull: Math.round(cmp * 1.35),

      base: target,

      bear: Math.round(cmp * 0.82),

      intrinsic,

      mosPct: +(
        ((intrinsic - cmp) /
          intrinsic) *
        100
      ).toFixed(1),

      peerMultiples: [
        {
          name: "Peer A",
          pe: 24,
          evEbitda: 14,
          pb: 4.1,
        },

        {
          name: "Peer B",
          pe: 28,
          evEbitda: 16,
          pb: 5.3,
        },

        {
          name: "Peer C",
          pe: 21,
          evEbitda: 12,
          pb: 3.4,
        },

        {
          name: profile.name,
          pe: 26,
          evEbitda: 15,
          pb: 4.6,
        },
      ],
    },

    technicals: {
      dma20,
      dma50,
      dma100,
      dma200,

      rsi: +(45 + rnd() * 30).toFixed(
        2
      ),

      macd: {
        macd: +(
          rnd() * 4 - 2
        ).toFixed(2),

        signal: +(
          rnd() * 4 - 2
        ).toFixed(2),

        histogram: +(
          rnd() * 1.5 - 0.75
        ).toFixed(2),
      },

      bollinger: {
        upper: +(
          cmp * 1.05
        ).toFixed(2),

        middle: dma20,

        lower: +(
          cmp * 0.95
        ).toFixed(2),
      },

      support: [
        +(cmp * 0.95).toFixed(0),
        +(cmp * 0.9).toFixed(0),
      ],

      resistance: [
        +(cmp * 1.05).toFixed(0),
        +(cmp * 1.12).toFixed(0),
      ],

      avgVolume: 12472672,

      deliveryPct: 48.5,

      trend:
        cmp > dma200
          ? "Uptrend"
          : "Downtrend",

      momentum:
        cmp > dma50
          ? "Positive"
          : "Neutral",

      signal:
        cmp > dma20 &&
        cmp > dma50
          ? "Bullish"
          : "Bearish",

      priceHistory,
    },

    moat: [
      {
        dimension: "Scale",

        score: 4,

        rationale:
          "Large operating scale supports cost efficiency and competitive positioning.",
      },

      {
        dimension: "Brand",

        score: 4,

        rationale:
          "Established market presence supports customer retention and pricing resilience.",
      },

      {
        dimension: "Execution",

        score: 3,

        rationale:
          "Execution track record remains important for sustaining profitability.",
      },

      {
        dimension:
          "Capital Efficiency",

        score: 4,

        rationale:
          "Business demonstrates relatively healthy return metrics over the cycle.",
      },
    ],

    management: {
      ceo:
        "As disclosed in latest annual report",

      chair:
        "As disclosed in latest annual report",

      tenureYrs: 8,

      capitalAllocation:
        "Capital allocation appears balanced between reinvestment, growth initiatives, and shareholder returns.",

      governance:
        "Governance assessment is based on publicly available filings and board disclosures.",

      execution:
        "Operational execution remains an important driver of long-term performance.",

      promoterPledge: 0,

      relatedParty:
        "Related-party disclosures appear within standard reporting norms.",
    },

    esg: {
      environmental: 68,

      social: 72,

      governance: 80,

      commentary:
        "ESG assessment is based on publicly available disclosures and sector-level analysis. Detailed sustainability verification is not yet integrated.",
    },

    macro:
      "The stock requires balanced assessment of business quality, valuation, growth durability, and near-term technical conditions.",

    sector: `Revenue CAGR is ${(
      ((revenue[4] /
        revenue[0]) **
        (1 / 4) -
        1) *
      100
    ).toFixed(
      1
    )}%, with profit growth of ${(
      ((pat[4] / pat[0]) **
        (1 / 4) -
        1) *
      100
    ).toFixed(1)}%.`,

    scenarios: [
      {
        name: "Bull",

        probability: 25,

        targetPrice: Math.round(
          cmp * 1.35
        ),

        assumptions: [
          "Stronger earnings growth",
          "Margin expansion",
          "Sector rerating",
        ],

        drivers: [
          "Operating leverage",
          "Improved demand conditions",
        ],

        risks: [
          "Execution risk",
        ],
      },

      {
        name: "Base",

        probability: 55,

        targetPrice: target,

        assumptions: [
          "Stable revenue growth",
          "Consistent margins",
          "Steady valuation multiple",
        ],

        drivers: [
          "Business stability",
          "Normalised growth environment",
        ],

        risks: [
          "Macro slowdown",
        ],
      },

      {
        name: "Bear",

        probability: 20,

        targetPrice: Math.round(
          cmp * 0.82
        ),

        assumptions: [
          "Growth slowdown",
          "Margin pressure",
          "Valuation compression",
        ],

        drivers: [
          "Weak demand",
          "Negative sector sentiment",
        ],

        risks: [
          "Deeper slowdown",
        ],
      },
    ],

    risks: [
      {
        category: "Market",

        description:
          "Demand cyclicality in core segments",

        severity: "Med",
      },

      {
        category: "Regulatory",

        description:
          "Policy changes in operating geographies",

        severity: "Med",
      },

      {
        category: "Operational",

        description:
          "Execution on capex and integration of acquisitions",

        severity: "Low",
      },

      {
        category: "Financial",

        description:
          "Working capital and FX volatility",

        severity: "Low",
      },

      {
        category: "Governance",

        description:
          "Related party and promoter actions to monitor",

        severity: "Low",
      },
    ],

    catalysts: [
      {
        date: "Next 30 days",

        event:
          "Quarterly results",

        impact: "High",
      },

      {
        date: "Next 90 days",

        event:
          "Capacity commissioning",

        impact: "Med",
      },

      {
        date: "Next 180 days",

        event:
          "Annual investor day",

        impact: "Med",
      },
    ],

    peers: [
      {
        name: "Peer A",

        ticker: "PEERA",

        mcapCr: Math.round(
          profile.marketCapCr * 0.8
        ),

        revGrowth: 11,

        ebitdaMargin: 19,

        roe: 17,

        pe: 24,
      },

      {
        name: "Peer B",

        ticker: "PEERB",

        mcapCr: Math.round(
          profile.marketCapCr * 1.1
        ),

        revGrowth: 13,

        ebitdaMargin: 21,

        roe: 19,

        pe: 28,
      },

      {
        name: "Peer C",

        ticker: "PEERC",

        mcapCr: Math.round(
          profile.marketCapCr * 0.6
        ),

        revGrowth: 9,

        ebitdaMargin: 17,

        roe: 15,

        pe: 21,
      },

      {
        name: profile.name,

        ticker: profile.ticker,

        mcapCr:
          profile.marketCapCr,

        revGrowth: "NA",

        ebitdaMargin:
          ebitdaMargin[4],

        roe: "NA",

        pe: "NA",
      },
    ],

    revenueMixEstimated: true,
    geographicMixEstimated: true,
  };
}

export const PIPELINE_STEPS = [
  "Resolving ticker on NSE/BSE",
  "Pulling exchange filings",
  "Extracting annual report data",
  "Fetching financial statements",
  "Pulling governance & shareholding data",
  "Fetching price history",
  "Calculating ratios",
  "Running technical indicators",
  "Performing valuation analysis",
  "Generating cited investment report",
  "Formatting institutional report",
];

export const ANALYSIS_MODULES = [
  "Executive summary",
  "Company overview",
  "Business model analysis",
  "Financial performance",
  "Profitability analysis",
  "Margin analysis",
  "Balance sheet health",
  "Cash flow quality",
  "Working capital analysis",
  "Capital allocation analysis",
  "DuPont decomposition",
  "Multi-model valuation",
  "Peer benchmarking",
  "Competitive moat analysis",
  "Management quality analysis",
  "Governance analysis",
  "ESG analysis",
  "Macro and India market context",
  "Technical analysis",
  "Sector outlook",
  "Scenario analysis",
  "Risk register",
  "Catalyst map",
  "Final investment verdict",
];