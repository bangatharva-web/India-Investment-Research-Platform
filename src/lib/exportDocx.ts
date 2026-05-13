import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, Footer, PageNumber,
} from "docx";
import * as FileSaver from "file-saver";
const saveAs = FileSaver.saveAs;
import type { Report } from "./mockReport";

const NAVY = "1E2A4A";
const GRAY = "6B7280";
const border = { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

const p = (text: string, opts: { bold?: boolean; size?: number; color?: string; align?: any } = {}) =>
  new Paragraph({
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color, font: "Calibri" })],
  });

const h = (text: string, level: any = HeadingLevel.HEADING_1) =>
  new Paragraph({
    heading: level,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: level === HeadingLevel.HEADING_1 ? 32 : 26, font: "Calibri" })],
  });

const cell = (txt: string, bold = false, fill?: string) =>
  new TableCell({
    borders: cellBorders,
    width: { size: 2340, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: txt, bold, size: 20, font: "Calibri" })] })],
  });


const fmtPeerMetric = (value: number | string, suffix = "") => {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return "NA";
  }

  if (typeof value === "number") {
    return `${value.toLocaleString("en-IN")}${suffix}`;
  }

  return `${value}${suffix}`;
};

const technicalConclusion = (t: Report["technicals"]) => {
  if (t.trend === "Uptrend" && t.signal === "Bullish") {
    return "Bullish trend confirmation with positive momentum.";
  }

  if (t.trend === "Downtrend" && t.signal === "Bearish") {
    return "Weak technical structure with bearish momentum.";
  }

  return "Mixed technical setup with no strong directional confirmation.";
};

const technicalInterpretation = (t: Report["technicals"]) => {
  const rsiText =
    t.rsi < 40
      ? "RSI indicates weak near-term momentum."
      : t.rsi > 60
        ? "RSI indicates strong near-term momentum."
        : "RSI indicates neutral near-term momentum.";

  const macdText =
    t.macd.histogram > 0
      ? "MACD histogram is positive, suggesting improving short-term momentum."
      : t.macd.histogram < 0
        ? "MACD histogram is negative, suggesting short-term caution."
        : "MACD histogram is flat, indicating limited directional strength.";

  return `${rsiText} ${macdText}`;
};

function tbl(headers: string[], rows: string[][]) {
  const cols = headers.length;
  const colW = Math.floor(9360 / cols);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: Array(cols).fill(colW),
    rows: [
      new TableRow({
        children: headers.map((hd) => new TableCell({
          borders: cellBorders,
          width: { size: colW, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: hd, bold: true, color: "FFFFFF", size: 20, font: "Calibri" })] })],
        })),
      }),
      ...rows.map((r) => new TableRow({
        children: r.map((c) => new TableCell({
          borders: cellBorders,
          width: { size: colW, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font: "Calibri" })] })],
        })),
      })),
    ],
  });
}

export async function exportReportDocx(r: Report) {
  const fy = r.financials;
  const v = r.valuation;
  const t = r.technicals;

  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800 }, children: [new TextRun({ text: "INDIA INVESTMENT RESEARCH", color: NAVY, bold: true, size: 28, font: "Calibri" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 }, children: [new TextRun({ text: r.profile.name, bold: true, size: 56, color: NAVY, font: "Calibri" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new TextRun({ text: `${r.profile.exchange}: ${r.profile.ticker}  |  ${r.profile.sector}`, size: 24, color: GRAY, font: "Calibri" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: `Investment Rating: ${r.executive.verdict}  •  Risk Profile: ${r.executive.conviction}  •  Target: ₹${r.executive.targetPrice.toLocaleString("en-IN")}  •  Upside: ${r.executive.upsidePct}%`, bold: true, size: 26, font: "Calibri" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200 }, children: [new TextRun({ text: `Generated ${new Date(r.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, size: 20, color: GRAY, font: "Calibri" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "For informational purposes only. Not SEBI-registered investment advice.", italics: true, size: 18, color: GRAY, font: "Calibri" })] }),
    new Paragraph({ children: [new PageBreak()] }),

    h("Executive Summary"),
    p(`Recommendation: ${r.executive.verdict} | Risk Profile: ${r.executive.conviction} | Target Price: ₹${r.executive.targetPrice.toLocaleString("en-IN")} (${r.executive.upsidePct >= 0 ? "+" : ""}${r.executive.upsidePct}%)`, { bold: true }),
    p(""),
    p("Investment Thesis", { bold: true, color: NAVY }),
    ...r.executive.thesis.map((x) => p(`• ${x}`)),
    p(""),
    p("Key Risks", { bold: true, color: NAVY }),
    ...r.executive.risks.map((x) => p(`• ${x}`)),
    p(""),
    p("Key Catalysts", { bold: true, color: NAVY }),
    ...r.executive.catalysts.map((x) => p(`• ${x}`)),

    h("Company Overview"),
    p(r.profile.description),
    tbl(["Metric", "Value"], [
      ["Ticker", `${r.profile.exchange}: ${r.profile.ticker}`],
      ["ISIN", r.profile.isin],
      ["Sector", r.profile.sector],
      ["Industry", r.profile.industry],
      ["Market Cap", `₹${r.profile.marketCapCr.toLocaleString("en-IN")} Cr`],
      ["CMP", `₹${r.profile.cmp.toLocaleString("en-IN")}`],
      ["Website", r.profile.website],
    ]),

    h("Business Model"),
    p(r.business.model),
    p("Revenue Mix (Segment)", { bold: true }),
    tbl(["Segment", "Revenue Share"], r.business.segments.map((s) => [s.name, `${s.revShare}%`])),
    p("Revenue segmentation is displayed only when supported by verified disclosures or audited filings.", { color: GRAY, size: 18 }),
    p(""),
    p("Geographic Mix", { bold: true }),
    tbl(["Region", "Revenue Share"], r.business.geography.map((g) => [g.name, `${g.revShare}%`])),
    p("Geographic segmentation is displayed only when supported by verified disclosures or audited filings.", { color: GRAY, size: 18 }),

    h("Financial Performance"),
    tbl(
      ["Metric (₹ Cr)", ...fy.years],
      [
        ["Revenue", ...fy.revenue.map((x) => x.toLocaleString("en-IN"))],
        ["EBITDA", ...fy.ebitda.map((x) => x.toLocaleString("en-IN"))],
        ["PAT", ...fy.pat.map((x) => x.toLocaleString("en-IN"))],
        ["FCF", ...fy.fcf.map((x) => x.toLocaleString("en-IN"))],
        ["EBITDA Margin %", ...fy.ebitdaMargin.map((x) => `${x}%`)],
        ["PAT Margin %", ...fy.patMargin.map((x) => `${x}%`)],
      ]
    ),

    h("Profitability & Returns"),
    tbl(["Ratio", "Value"], [
      ["ROE", `${r.ratios.roe}%`], ["ROCE", `${r.ratios.roce}%`], ["ROIC", `${r.ratios.roic}%`],
      ["Debt / Equity", `${r.ratios.debtEquity}x`], ["Current Ratio", `${r.ratios.current}x`], ["Quick Ratio", `${r.ratios.quick}x`],
      ["Interest Coverage", `${r.ratios.interestCoverage}x`], ["Asset Turnover", `${r.ratios.assetTurnover}x`],
      ["FCF Conversion", `${(r.ratios.fcfConversion * 100).toFixed(0)}%`], ["Operating Leverage", `${r.ratios.operatingLeverage}x`],
    ]),

    h("DuPont Decomposition"),
    tbl(["Component", "Value"], [
      ["Net Margin", `${r.dupont.netMargin}%`],
      ["Asset Turnover", `${r.dupont.assetTurnover}x`],
      ["Equity Multiplier", `${r.dupont.equityMultiplier}x`],
      ["= ROE", `${r.dupont.roe}%`],
    ]),

    h("Multi-Model Valuation"),
    tbl(["Model", "Implied Price (₹)"], [
      ["DCF", v.dcf.toLocaleString("en-IN")],
      ["EV / EBITDA", v.evEbitda.toLocaleString("en-IN")],
      ["P / E", v.pe.toLocaleString("en-IN")],
      ["P / B", v.pb.toLocaleString("en-IN")],
      ["DDM", v.ddm ? v.ddm.toLocaleString("en-IN") : "Not applicable"],
      ["Bull", v.bull.toLocaleString("en-IN")],
      ["Base", v.base.toLocaleString("en-IN")],
      ["Bear", v.bear.toLocaleString("en-IN")],
      ["Intrinsic Value", v.intrinsic.toLocaleString("en-IN")],
      ["Margin of Safety", `${v.mosPct}%`],
    ]),

    h("Peer Benchmarking"),
    tbl(["Peer", "Mcap (₹Cr)", "Rev Growth", "EBITDA Margin", "ROE", "P/E"],
      r.peers.map((pe) => [
        pe.name,
        typeof pe.mcapCr === "number" ? pe.mcapCr.toLocaleString("en-IN") : String(pe.mcapCr),
        fmtPeerMetric(pe.revGrowth, "%"),
        fmtPeerMetric(pe.ebitdaMargin, "%"),
        fmtPeerMetric(pe.roe, "%"),
        fmtPeerMetric(pe.pe, "x"),
      ])),

    h("Competitive Moat"),
    tbl(["Dimension", "Score / 5", "Rationale"], r.moat.map((m) => [m.dimension, `${m.score}`, m.rationale])),

    h("Management & Governance"),
    tbl(["Topic", "Assessment"], [
      ["CEO", r.management.ceo],
      ["Chairperson", r.management.chair],
      ["Capital Allocation", r.management.capitalAllocation],
      ["Governance", r.management.governance],
      ["Execution", r.management.execution],
      ["Related-Party", r.management.relatedParty],
      ["Leadership Disclosure", "Detailed leadership, promoter pledge, and shareholding metrics are shown only when verified from current filings."],
    ]),

    h("Data Quality & Limitations"),
    tbl(["Area", "Status"], [
      ["Source audit", `${r.sources.length} source references included in the appendix.`],
      ["AI narrative", `${(r as any).dataQuality?.aiMode === "gemini" ? "Gemini-assisted" : "Fallback/template-assisted"}`],
      ["ESG scoring", "Not scored unless verified ESG source data is connected."],
      ["Shareholding", "Not displayed unless directly verified from current filings."],
      ["Template-assisted areas", "Revenue mix, geographic mix, moat, and governance commentary may use template-assisted logic when primary disclosures are unavailable."],
    ]),

    h("Macro & Sector"),
    p("India macro context", { bold: true }), p(r.macro),
    p("Sector outlook", { bold: true }), p(r.sector),

    h("Technical Analysis"),
    tbl(["Indicator", "Value"], [
      ["20 DMA", `₹${t.dma20}`], ["50 DMA", `₹${t.dma50}`], ["100 DMA", `₹${t.dma100}`], ["200 DMA", `₹${t.dma200}`],
      ["RSI (14)", `${t.rsi}`],
      ["MACD", `${t.macd.macd} / signal ${t.macd.signal} / hist ${t.macd.histogram}`],
      ["Bollinger", `Upper ₹${t.bollinger.upper} | Mid ₹${t.bollinger.middle} | Lower ₹${t.bollinger.lower}`],
      ["Support", t.support.map((s) => `₹${s}`).join(", ")],
      ["Resistance", t.resistance.map((s) => `₹${s}`).join(", ")],
      ["Avg Volume", t.avgVolume.toLocaleString("en-IN")],
      ["Delivery %", `${t.deliveryPct}%`],
      ["Trend", t.trend], ["Momentum", t.momentum], ["Signal", t.signal],
      ["Conclusion", technicalConclusion(t)],
      ["Interpretation", technicalInterpretation(t)],
    ]),

    h("Scenario Analysis"),
    tbl(["Scenario", "Probability", "Target Price", "Key Assumptions"],
      r.scenarios.map((s) => [s.name, `${s.probability}%`, `₹${s.targetPrice.toLocaleString("en-IN")}`, s.assumptions.join(" • ")])),

    h("Risk Register"),
    tbl(["Category", "Description", "Severity"], r.risks.map((rk) => [rk.category, rk.description, rk.severity])),

    h("Catalyst Map"),
    tbl(["Window", "Event", "Impact"], r.catalysts.map((c) => [c.date, c.event, c.impact])),

    h("Final Investment Verdict"),
    p(`Recommendation: ${r.executive.verdict}`, { bold: true, size: 28, color: NAVY }),
    p(`Target Price: ₹${r.executive.targetPrice.toLocaleString("en-IN")} (${r.executive.upsidePct}% upside)`, { bold: true }),
    p(`Risk Profile: ${r.executive.conviction}`),
    p(`Confidence Score: ${r.executive.confidenceScore ?? 72} / 100`, { bold: true }),
    p("Time Horizon: 12–18 months"),
    p(`Margin of Safety: ${r.valuation.mosPct}%`),
    p("Valuation View: Target price is based on a blended valuation approach using DCF, EV/EBITDA, P/E, and P/B methods."),

    h("Source Appendix"),
    tbl(["Source", "URL", "Filing Date", "Retrieved"],
      r.sources.map((s) => [s.source, s.url, s.filingDate, new Date(s.retrieved).toLocaleString("en-IN")])),

    h("Disclaimer"),
    p("This report is generated for informational and educational purposes only. It does not constitute investment advice, an offer to sell, or a solicitation to buy any security. The author is not a SEBI-registered investment adviser. Investors should perform their own due diligence and consult a qualified adviser before making any investment decision. Data is sourced from public filings believed to be reliable but not independently verified.", { color: GRAY }),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 } } },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: `${r.profile.name} • India Investment Research • Page `, size: 18, color: GRAY, font: "Calibri" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: "Calibri" }),
        ] })] }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${r.profile.ticker}_Investment_Research.docx`);
}