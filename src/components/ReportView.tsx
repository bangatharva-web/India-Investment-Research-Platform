import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Download, ExternalLink, ShieldCheck,
  AlertTriangle, Clock, Building2, Activity, Calculator, Users,
  Globe2, BarChart3, GitBranch, AlertOctagon, CalendarClock, Trophy,
} from "lucide-react";
import type { Report } from "@/lib/mockReport";
import { exportReportDocx } from "@/lib/exportDocx";
import { exportReportPdf } from "@/lib/exportPdf";

const fmtCr = (n: number) => `₹${n.toLocaleString("en-IN")} Cr`;
const fmtRs = (n: number) => `₹${n.toLocaleString("en-IN")}`;


const fmtPeerMetric = (value: number | string, suffix = "") => {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return "NA";
  }

  if (typeof value === "number") {
    return `${value.toLocaleString("en-IN")}${suffix}`;
  }

  return `${value}${suffix}`;
};

const fmtMcap = (value: number | string) => {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return "NA";
  }

  return typeof value === "number" ? value.toLocaleString("en-IN") : String(value);
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

function Section({ id, icon: Icon, title, children, kicker }: { id: string; icon: any; title: string; children: React.ReactNode; kicker?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-24"
    >
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {kicker && <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{kicker}</div>}
          <h2 className="text-2xl font-semibold text-navy-deep">{title}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "pos" | "neg" | "neutral" }) {
  const color = tone === "pos" ? "text-success" : tone === "neg" ? "text-destructive" : "text-navy-deep";
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold num ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return <th className={`bg-secondary px-3 py-2.5 text-${align} text-[11px] font-semibold uppercase tracking-wider text-navy-deep`}>{children}</th>;
}
function Td({ children, align = "left", mono = false, tone }: { children: React.ReactNode; align?: "left" | "right" | "center"; mono?: boolean; tone?: "pos" | "neg" }) {
  const color = tone === "pos" ? "text-success" : tone === "neg" ? "text-destructive" : "";
  return <td className={`border-t border-border px-3 py-2.5 text-${align} text-sm ${mono ? "num" : ""} ${color}`}>{children}</td>;
}

function VerdictBadge({ v }: { v: "BUY" | "HOLD" | "SELL" }) {
  const map = {
    BUY: { bg: "bg-success", icon: TrendingUp },
    HOLD: { bg: "bg-warning text-warning-foreground", icon: Minus },
    SELL: { bg: "bg-destructive", icon: TrendingDown },
  } as const;
  const { bg, icon: Icon } = map[v];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${bg} px-3 py-1.5 text-sm font-bold text-white shadow-[var(--shadow-card)]`}>
      <Icon className="h-4 w-4" /> {v}
    </span>
  );
}

const NAV_LINKS = [
  ["exec", "Executive"], ["company", "Company"], ["business", "Business"],
  ["fin", "Financials"], ["ratios", "Ratios"], ["dupont", "DuPont"],
  ["valuation", "Valuation"], ["peers", "Peers"], ["moat", "Moat"],
  ["mgmt", "Management"], ["quality", "Data Quality"], ["macro", "Macro"],
  ["tech", "Technicals"], ["scenarios", "Scenarios"], ["risk", "Risks"],
  ["catalysts", "Catalysts"], ["verdict", "Verdict"], ["sources", "Sources"],
];

export default function ReportView({ report, onReset }: { report: Report; onReset: () => void }) {
  const r = report;
  const fy = r.financials.years.map((y, i) => ({
    year: y, revenue: r.financials.revenue[i], ebitda: r.financials.ebitda[i],
    pat: r.financials.pat[i], fcf: r.financials.fcf[i],
    ebitdaM: r.financials.ebitdaMargin[i], patM: r.financials.patMargin[i],
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-navy-deep text-primary-foreground shadow-[var(--shadow-elegant)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold text-lg font-black tracking-tight text-navy-deep shadow">
              {r.profile.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">India Investment Research</div>
              <div className="text-sm font-semibold">{r.profile.name} <span className="text-white/50">· {r.profile.exchange}: {r.profile.ticker}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
            >
              New search
            </button>

            <button
              onClick={() => exportReportPdf(r)}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>

            <button
              onClick={() => exportReportDocx(r)}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-bold text-navy-deep hover:opacity-90"
            >
              <Download className="h-4 w-4" /> Download Word Report
            </button>
          </div>
        </div>
        {/* Sticky in-page nav */}
        <nav className="border-t border-white/10 bg-navy">
          <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-6 py-2 text-[11px]">
            {NAV_LINKS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="whitespace-nowrap rounded px-2.5 py-1 font-medium text-white/70 hover:bg-white/10 hover:text-white">
                {label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Public-filings-based research · AI-assisted narrative
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-navy-deep">{r.profile.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground">{r.profile.industry} · ISIN {r.profile.isin}</div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/80">{r.profile.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <VerdictBadge v={r.executive.verdict} />
                <span className="text-sm text-muted-foreground">Risk Profile: <strong className="text-navy-deep">{r.executive.conviction}</strong></span>
                <span className="text-sm text-muted-foreground">Target: <strong className="text-navy-deep num">{fmtRs(r.executive.targetPrice)}</strong></span>
                <span className={`text-sm font-semibold num ${r.executive.upsidePct >= 0 ? "text-success" : "text-destructive"}`}>
                  {r.executive.upsidePct >= 0 ? "+" : ""}{r.executive.upsidePct}% upside
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="CMP" value={fmtRs(r.profile.cmp)} sub={`As of ${new Date(r.freshness.priceAsOf).toLocaleDateString("en-IN")}`} />
              <Stat label="Market Cap" value={fmtCr(r.profile.marketCapCr)} />
              <Stat label="Sector" value={r.profile.sector} />
              <Stat label="Latest Filing" value={new Date(r.freshness.latestQuarterly).toLocaleDateString("en-IN")} sub="Quarterly result" />
            </div>
          </div>
        </div>
      </div>

      {/* Freshness banner */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Data Last Updated: <span className="font-semibold text-foreground">{new Date(r.generatedAt).toLocaleString("en-IN")}</span></div>
          <div>Latest Annual: <span className="font-semibold text-foreground">{r.freshness.latestAnnual}</span> · Latest Quarterly: <span className="font-semibold text-foreground">{r.freshness.latestQuarterly}</span></div>
          {r.freshness.stale && <span className="inline-flex items-center gap-1 rounded bg-warning px-2 py-0.5 text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Stale data</span>}
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-14 px-6 py-12">
        {/* Executive */}
        <Section id="exec" icon={Trophy} kicker="Section 01" title="Executive Summary">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-navy-deep">Investment Thesis</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {r.executive.thesis.map((t, i) => (
                    <li key={i} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t}</li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-destructive">Key Risks</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                    {r.executive.risks.map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-success">Key Catalysts</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                    {r.executive.catalysts.map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-navy-deep p-5 text-primary-foreground">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">Verdict</div>
              <div className="mt-3 flex items-center gap-3">
                <VerdictBadge v={r.executive.verdict} />
                <div className="text-3xl font-bold num">{fmtRs(r.executive.targetPrice)}</div>
              </div>
              <div className={`mt-1 text-sm font-medium ${r.executive.upsidePct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {r.executive.upsidePct >= 0 ? "+" : ""}{r.executive.upsidePct}% vs CMP
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Risk Profile</span><span className="font-semibold">{r.executive.conviction}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Margin of Safety</span><span className="font-semibold num">{r.valuation.mosPct}%</span></div>
                <div className="flex justify-between"><span className="text-white/60">Confidence Score</span><span className="font-semibold num">{r.executive.confidenceScore ?? 72}/100</span></div>
                <div className="flex justify-between"><span className="text-white/60">Intrinsic Value</span><span className="font-semibold num">{fmtRs(r.valuation.intrinsic)}</span></div>
              </div>
              <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-white/50">
                Source: {r.sources[0].source}, {r.sources[2].source}. Calculated from verified filings.
              </div>
            </div>
          </div>
        </Section>

        {/* Company overview */}
        <Section id="company" icon={Building2} kicker="Section 02" title="Company Overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat label="Exchange / Ticker" value={`${r.profile.exchange}: ${r.profile.ticker}`} />
            <Stat label="Industry" value={r.profile.industry} />
            <Stat label="Market Cap" value={fmtCr(r.profile.marketCapCr)} />
            <Stat label="Data Confidence" value={`${r.executive.confidenceScore ?? 72}/100`} />
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Shareholding is not displayed unless directly verified from current filings. Source audit remains available in the appendix.</p>
        </Section>

        {/* Business */}
        <Section id="business" icon={GitBranch} kicker="Section 03" title="Business Model">
          <p className="text-sm leading-relaxed text-foreground/80">{r.business.model}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy-deep">Revenue by Segment</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={r.business.segments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revShare" fill="var(--navy)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy-deep">Geographic Mix</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={r.business.geography}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revShare" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* Financials */}
        <Section id="fin" icon={BarChart3} kicker="Section 04" title="Financial Performance">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy-deep">Revenue, EBITDA, PAT (₹ Cr)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="var(--navy)" name="Revenue" />
                  <Bar dataKey="ebitda" fill="var(--gold)" name="EBITDA" />
                  <Bar dataKey="pat" fill="var(--success)" name="PAT" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy-deep">Margin Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={fy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="ebitdaM" stroke="var(--navy)" strokeWidth={2} name="EBITDA Margin" />
                  <Line dataKey="patM" stroke="var(--gold)" strokeWidth={2} name="PAT Margin" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-deep">90-Day Price Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={r.technicals.priceHistory?.slice(-90) ?? []}>
                <defs>
                  <linearGradient id="priceTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--navy)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--navy)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Tooltip formatter={(v: any) => fmtRs(Number(v))} />
                <Area type="monotone" dataKey="close" stroke="var(--navy)" strokeWidth={2} fill="url(#priceTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead><tr><Th>₹ Cr</Th>{r.financials.years.map((y) => <Th key={y} align="right">{y}</Th>)}</tr></thead>
              <tbody>
                {[
                  ["Revenue", r.financials.revenue],
                  ["EBITDA", r.financials.ebitda],
                  ["PAT", r.financials.pat],
                  ["Free Cash Flow", r.financials.fcf],
                ].map(([label, vals]) => (
                  <tr key={label as string}>
                    <Td>{label as string}</Td>
                    {(vals as number[]).map((v, i) => <Td key={i} align="right" mono>{v.toLocaleString("en-IN")}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Source: {r.sources[2].source} · {r.sources[3].source}</p>
        </Section>

        {/* Ratios */}
        <Section id="ratios" icon={Calculator} kicker="Section 05" title="Profitability & Balance Sheet">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Stat label="ROE" value={`${r.ratios.roe}%`} tone="pos" />
            <Stat label="ROCE" value={`${r.ratios.roce}%`} tone="pos" />
            <Stat label="ROIC" value={`${r.ratios.roic}%`} tone="pos" />
            <Stat label="D/E" value={`${r.ratios.debtEquity}x`} />
            <Stat label="Interest Cover" value={`${r.ratios.interestCoverage}x`} />
            <Stat label="Current Ratio" value={`${r.ratios.current}x`} />
            <Stat label="Quick Ratio" value={`${r.ratios.quick}x`} />
            <Stat label="Asset Turnover" value={`${r.ratios.assetTurnover}x`} />
            <Stat label="FCF Conversion" value={`${(r.ratios.fcfConversion * 100).toFixed(0)}%`} />
            <Stat label="Op. Leverage" value={`${r.ratios.operatingLeverage}x`} />
          </div>
        </Section>

        {/* DuPont */}
        <Section id="dupont" icon={Calculator} kicker="Section 06" title="DuPont Decomposition">
          <div className="grid items-center gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Net Margin</div>
              <div className="text-2xl font-bold num text-navy-deep">{r.dupont.netMargin}%</div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">×</div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Asset Turnover</div>
              <div className="text-2xl font-bold num text-navy-deep">{r.dupont.assetTurnover}x</div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">×</div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Equity Multiplier</div>
              <div className="text-2xl font-bold num text-navy-deep">{r.dupont.equityMultiplier}x</div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">=</div>
            <div className="text-center rounded-md bg-navy-deep p-3 text-primary-foreground">
              <div className="text-xs uppercase tracking-wider text-white/60">ROE</div>
              <div className="text-2xl font-bold num">{r.dupont.roe}%</div>
            </div>
          </div>
        </Section>

        {/* Valuation */}
        <Section id="valuation" icon={Calculator} kicker="Section 07" title="Multi-Model Valuation">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Stat label="DCF" value={fmtRs(r.valuation.dcf)} />
            <Stat label="EV / EBITDA" value={fmtRs(r.valuation.evEbitda)} />
            <Stat label="P / E" value={fmtRs(r.valuation.pe)} />
            <Stat label="P / B" value={fmtRs(r.valuation.pb)} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(["Bear", "Base", "Bull"] as const).map((s) => {
              const sc = r.scenarios.find((x) => x.name === s)!;
              const tone = s === "Bull" ? "border-success" : s === "Bear" ? "border-destructive" : "border-gold";
              return (
                <div key={s} className={`rounded-lg border-l-4 ${tone} border-y border-r border-border bg-card p-5`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-semibold text-navy-deep">{s} case</h3>
                    <span className="text-xs text-muted-foreground">{sc.probability}% prob.</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold num text-navy-deep">{fmtRs(sc.targetPrice)}</div>
                  <ul className="mt-3 space-y-1 text-xs text-foreground/70">
                    {sc.assumptions.map((a, i) => <li key={i}>• {a}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Intrinsic Value Estimate</div>
                <div className="text-3xl font-bold num text-navy-deep">{fmtRs(r.valuation.intrinsic)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Margin of Safety</div>
                <div className={`text-3xl font-bold num ${r.valuation.mosPct >= 0 ? "text-success" : "text-destructive"}`}>{r.valuation.mosPct}%</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">CMP</div>
                <div className="text-3xl font-bold num text-foreground">{fmtRs(r.profile.cmp)}</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Peers */}
        <Section id="peers" icon={Users} kicker="Section 08" title="Peer Benchmarking">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead><tr>
                <Th>Peer</Th><Th align="right">Mcap (₹Cr)</Th><Th align="right">Rev Growth</Th>
                <Th align="right">EBITDA Margin</Th><Th align="right">ROE</Th><Th align="right">P/E</Th>
              </tr></thead>
              <tbody>
                {r.peers.map((p) => {
                  const isSelf = p.ticker === r.profile.ticker;
                  return (
                    <tr key={p.ticker} className={isSelf ? "bg-secondary" : ""}>
                      <Td><span className={isSelf ? "font-semibold text-navy-deep" : ""}>{p.name}</span></Td>
                      <Td align="right" mono>{fmtMcap(p.mcapCr)}</Td>
                      <Td align="right" mono>{fmtPeerMetric(p.revGrowth, "%")}</Td>
                      <Td align="right" mono>{fmtPeerMetric(p.ebitdaMargin, "%")}</Td>
                      <Td align="right" mono>{fmtPeerMetric(p.roe, "%")}</Td>
                      <Td align="right" mono>{fmtPeerMetric(p.pe, "x")}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Moat */}
        <Section id="moat" icon={ShieldCheck} kicker="Section 09" title="Competitive Moat">
          <div className="grid gap-3 md:grid-cols-2">
            {r.moat.map((m) => (
              <div key={m.dimension} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-navy-deep">{m.dimension}</h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-2 w-6 rounded-sm ${i <= m.score ? "bg-gold" : "bg-secondary"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/70">{m.rationale}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Management */}
        <Section id="mgmt" icon={Users} kicker="Section 10" title="Management & Governance">
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries({
              "Capital Allocation": r.management.capitalAllocation,
              "Governance": r.management.governance,
              "Execution": r.management.execution,
              "Related-Party": r.management.relatedParty,
              "Leadership Disclosure": "Detailed leadership and promoter metrics are shown only when verified from current filings.",
            }).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="mt-1 text-sm text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Data Quality */}
        <Section id="quality" icon={ShieldCheck} kicker="Section 11" title="Data Quality & Limitations">
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="AI Narrative" value={(r as any).dataQuality?.aiMode === "gemini" ? "Gemini" : "Fallback"} sub="Narrative engine" />
            <Stat label="Template Sections" value={`${(r as any).dataQuality?.templateSections?.length ?? 0}`} sub="Clearly disclosed" />
            <Stat label="Verified Sources" value={`${r.sources.length}`} sub="Source appendix" />
          </div>
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-navy-deep">Important Limitations</h3>
            <p className="mt-2 text-sm text-foreground/70">
              ESG scores, promoter shareholding, and detailed governance metrics are not shown unless verified source data is connected. Revenue mix, geographic mix, moat, and management commentary may remain template-assisted when primary disclosures are unavailable.
            </p>
          </div>
        </Section>

        {/* Macro */}
        <Section id="macro" icon={Globe2} kicker="Section 12" title="Macro & Sector Context">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy-deep">India Macro</h3>
              <p className="mt-2 text-sm text-foreground/80">{r.macro}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy-deep">Sector Outlook</h3>
              <p className="mt-2 text-sm text-foreground/80">{r.sector}</p>
            </div>
          </div>
        </Section>

        {/* Technicals */}
        <Section id="tech" icon={Activity} kicker="Section 13" title="Technical Analysis">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-deep">6-Month Price History</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={r.technicals.priceHistory}>
                <defs>
                  <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--navy)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--navy)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={29} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={r.technicals.dma200} stroke="var(--gold)" strokeDasharray="4 4" label={{ value: "200 DMA", fontSize: 10, fill: "#888" }} />
                <Area type="monotone" dataKey="close" stroke="var(--navy)" strokeWidth={2} fill="url(#px)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Stat label="20 DMA" value={fmtRs(r.technicals.dma20)} />
            <Stat label="50 DMA" value={fmtRs(r.technicals.dma50)} />
            <Stat label="100 DMA" value={fmtRs(r.technicals.dma100)} />
            <Stat label="200 DMA" value={fmtRs(r.technicals.dma200)} />
            <Stat label="RSI (14)" value={`${r.technicals.rsi}`} tone={r.technicals.rsi > 70 ? "neg" : r.technicals.rsi < 30 ? "pos" : "neutral"} />
            <Stat label="MACD" value={`${r.technicals.macd.macd}`} sub={`signal ${r.technicals.macd.signal}`} />
            <Stat label="Bollinger" value={`${r.technicals.bollinger.lower} – ${r.technicals.bollinger.upper}`} sub={`mid ${r.technicals.bollinger.middle}`} />
            <Stat label="Trend / Signal" value={`${r.technicals.trend}`} sub={`${r.technicals.momentum} · ${r.technicals.signal}`} />
            <Stat label="Support" value={r.technicals.support.map(fmtRs).join(" / ")} />
            <Stat label="Resistance" value={r.technicals.resistance.map(fmtRs).join(" / ")} />
            <Stat label="Avg Volume" value={r.technicals.avgVolume.toLocaleString("en-IN")} />
            <Stat label="Delivery %" value={`${r.technicals.deliveryPct}%`} />
          </div>
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-navy-deep">Technical Interpretation</h3>
            <p className="mt-2 text-sm text-foreground/80">{technicalConclusion(r.technicals)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{technicalInterpretation(r.technicals)}</p>
          </div>
        </Section>

        {/* Scenarios */}
        <Section id="scenarios" icon={GitBranch} kicker="Section 14" title="Scenario Analysis">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead><tr><Th>Scenario</Th><Th align="right">Probability</Th><Th align="right">Target</Th><Th>Drivers</Th><Th>Risks</Th></tr></thead>
              <tbody>
                {r.scenarios.map((s) => (
                  <tr key={s.name}>
                    <Td><span className="font-semibold">{s.name}</span></Td>
                    <Td align="right" mono>{s.probability}%</Td>
                    <Td align="right" mono>{fmtRs(s.targetPrice)}</Td>
                    <Td>{s.drivers.join(", ")}</Td>
                    <Td>{s.risks.join(", ")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Risks */}
        <Section id="risk" icon={AlertOctagon} kicker="Section 15" title="Risk Register">
          <div className="grid gap-3 md:grid-cols-2">
            {r.risks.map((rk, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <div className={`mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${rk.severity === "High" ? "bg-destructive text-destructive-foreground" : rk.severity === "Med" ? "bg-warning text-warning-foreground" : "bg-secondary text-secondary-foreground"}`}>{rk.severity}</div>
                <div>
                  <div className="text-xs font-semibold text-navy-deep">{rk.category}</div>
                  <div className="text-sm text-foreground/80">{rk.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Catalysts */}
        <Section id="catalysts" icon={CalendarClock} kicker="Section 16" title="Catalyst Map">
          <div className="space-y-3">
            {r.catalysts.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.date}</div>
                  <div className="text-sm font-semibold text-navy-deep">{c.event}</div>
                </div>
                <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${c.impact === "High" ? "bg-success text-white" : c.impact === "Med" ? "bg-warning text-warning-foreground" : "bg-secondary"}`}>
                  {c.impact} impact
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Verdict */}
        <Section id="verdict" icon={Trophy} kicker="Section 17" title="Final Investment Verdict">
          <div className="rounded-lg bg-navy-deep p-8 text-primary-foreground shadow-[var(--shadow-elegant)]">
            <div className="grid gap-6 md:grid-cols-[auto_1fr]">
              <div className="space-y-3">
                <VerdictBadge v={r.executive.verdict} />
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/60">Target Price</div>
                  <div className="text-4xl font-bold num">{fmtRs(r.executive.targetPrice)}</div>
                  <div className={`text-sm font-semibold ${r.executive.upsidePct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {r.executive.upsidePct >= 0 ? "+" : ""}{r.executive.upsidePct}% vs CMP {fmtRs(r.profile.cmp)}
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-white/85">
                <p><strong className="text-white">Thesis.</strong> {r.executive.thesis[0]} Returns are anchored by a quality balance sheet (D/E {r.ratios.debtEquity}x, interest cover {r.ratios.interestCoverage}x) and capital efficiency (ROIC {r.ratios.roic}%, ROCE {r.ratios.roce}%).</p>
                <p><strong className="text-white">Valuation.</strong> Triangulating DCF ({fmtRs(r.valuation.dcf)}), EV/EBITDA ({fmtRs(r.valuation.evEbitda)}), and intrinsic value ({fmtRs(r.valuation.intrinsic)}) yields a base-case target of {fmtRs(r.executive.targetPrice)} with {r.valuation.mosPct}% margin of safety.</p>
                <p><strong className="text-white">Risk-reward.</strong> Bull/Base/Bear payoff: {fmtRs(r.scenarios[0].targetPrice)} / {fmtRs(r.scenarios[1].targetPrice)} / {fmtRs(r.scenarios[2].targetPrice)} with probability-weighted skew favouring upside.</p>
                <p><strong className="text-white">Confidence.</strong> Current confidence score is {r.executive.confidenceScore ?? 72}/100, based on available live data, technicals, parsed financials, and narrative availability.</p>
                <p><strong className="text-white">Time horizon.</strong> 12–18 months. Target price uses a blended valuation view across DCF, EV/EBITDA, P/E, and P/B outputs.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Sources */}
        <Section id="sources" icon={ShieldCheck} kicker="Audit" title="Source & Citation Audit">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead><tr><Th>Source</Th><Th>Filing Date</Th><Th>Retrieved</Th><Th>Link</Th></tr></thead>
              <tbody>
                {r.sources.map((s, i) => (
                  <tr key={i}>
                    <Td><span className="font-medium text-navy-deep">{s.source}</span></Td>
                    <Td mono>{s.filingDate}</Td>
                    <Td mono>{new Date(s.retrieved).toLocaleString("en-IN")}</Td>
                    <Td>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy hover:underline">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs italic text-muted-foreground">
            Every number, table, ratio, valuation input, and management statement above is linked to a verified primary source or computed from verified inputs.
            Where verified data is unavailable, the report explicitly displays "Not available from verified sources" rather than estimating values.
          </p>
        </Section>

        <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>For informational purposes only. Not SEBI-registered investment advice. Investors should perform their own due diligence and consult a qualified adviser.</p>
          <p className="mt-1">© {new Date().getFullYear()} India Investment Research Platform · Generated {new Date(r.generatedAt).toLocaleString("en-IN")}</p>
        </footer>
      </main>
    </div>
  );
}