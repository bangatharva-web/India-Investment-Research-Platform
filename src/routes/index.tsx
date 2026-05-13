import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search, ShieldCheck, Sparkles, ChevronRight, Check, History,
  Loader2, FileSearch, Database, Calculator, Activity, FileCheck,
} from "lucide-react";
import { ANALYSIS_MODULES, PIPELINE_STEPS, type Report } from "@/lib/mockReport";
import { analyzeCompany } from "@/lib/reportService";
import ReportView from "@/components/ReportView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "India Investment Research Platform — Institutional Equity Analysis" },
      { name: "description", content: "Generate institutional-grade equity research reports for NSE/BSE listed companies. Sourced from verified filings only." },
    ],
  }),
  component: Index,
});

type Stage = "search" | "loading" | "report";
const SUGGESTIONS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC"];

const PIPELINE_ICONS = [Search, FileSearch, FileSearch, Database, Database, Database, Calculator, Activity, Calculator, FileCheck, FileCheck];

function Index() {
  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(ANALYSIS_MODULES);
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<{ ticker: string; name: string; at: string }[]>([]);

  useEffect(() => {
    try {
      const h = localStorage.getItem("iirp_history");
      if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);

  const generate = async () => {
    if (!query.trim()) return;
    setStage("loading");
    setStep(0);

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setStep(Math.min(i, PIPELINE_STEPS.length - 1));
    }, 380);

    try {
      const response = await analyzeCompany({ query, modules: selected });
      clearInterval(id);
      setStep(PIPELINE_STEPS.length - 1);
      const r = response.report;
      setReport(r);
      const next = [{ ticker: r.profile.ticker, name: r.profile.name, at: r.generatedAt }, ...history.filter((h) => h.ticker !== r.profile.ticker)].slice(0, 6);
      setHistory(next);
      try { localStorage.setItem("iirp_history", JSON.stringify(next)); } catch {}
      setStage("report");
    } catch (error) {
      clearInterval(id);
      console.error(error);
      setStage("search");
      window.alert(error instanceof Error ? error.message : "Analysis failed");
    }
  };

  const reset = () => { setStage("search"); setQuery(""); setReport(null); };

  if (stage === "report" && report) return <ReportView report={report} onReset={reset} />;

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-deep via-navy to-navy-deep">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
                <Loader2 className="h-3 w-3 animate-spin" /> Analysing
              </div>
              <h1 className="text-3xl font-semibold text-white">{query.toUpperCase()}</h1>
              <p className="mt-1 text-sm text-white/60">Building institutional research from verified sources only</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <ol className="space-y-3">
                {PIPELINE_STEPS.map((s, i) => {
                  const Icon = PIPELINE_ICONS[i] ?? Check;
                  const done = i < step;
                  const active = i === step;
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all ${done ? "bg-success text-white" : active ? "bg-gold text-navy-deep" : "bg-white/10 text-white/40"}`}>
                        {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className={`flex-1 text-sm ${done ? "text-white/50 line-through" : active ? "font-semibold text-white" : "text-white/40"}`}>{s}</div>
                      {active && <span className="text-[10px] font-mono uppercase tracking-wider text-gold">Running</span>}
                    </li>
                  );
                })}
              </ol>
              <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-gold" initial={{ width: 0 }} animate={{ width: `${(step / PIPELINE_STEPS.length) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-navy-deep text-primary-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-gold font-bold text-navy-deep">IR</div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">Institutional Terminal</div>
              <div className="text-sm font-semibold">India Investment Research Platform</div>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-xs text-white/70 md:flex">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Verified sources only</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Auditable citations</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-secondary via-background to-secondary">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(var(--navy-deep) 1px, transparent 1px), linear-gradient(90deg, var(--navy-deep) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-navy">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> NSE · BSE · SEBI · Annual Reports
            </div>
            <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-navy-deep md:text-6xl">
              Institutional-grade equity research, <span className="italic text-navy">on demand.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
              Enter any NSE or BSE listed company. We assemble a fully cited, multi-model investment report — financials, valuation, technicals, moat, scenarios — sourced strictly from verified filings.
            </p>

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-elegant)] focus-within:border-navy">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                  placeholder="Search by NSE ticker (e.g. TCS, INFY, RELIANCE, DIFFNKG)"
                  className="flex-1 bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-muted-foreground/60"
                />
                <button onClick={generate} disabled={!query.trim()} className="inline-flex items-center gap-2 rounded-lg bg-navy-deep px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-navy disabled:opacity-40">
                  Generate Analysis <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-black/50">
                  Currently supports NSE ticker search. Example: TCS, INFY, ITC, HDFCBANK
                </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-muted-foreground">Try:</span>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQuery(s)} className="rounded-full border border-border bg-card px-3 py-1 font-mono text-navy hover:border-navy hover:bg-secondary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1400px] px-6 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Analysis Modules</div>
              <h2 className="mt-1 text-3xl font-semibold text-navy-deep">Select what to include in the report</h2>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setSelected(ANALYSIS_MODULES)} className="rounded border border-border px-3 py-1.5 hover:bg-secondary">All</button>
              <button onClick={() => setSelected([])} className="rounded border border-border px-3 py-1.5 hover:bg-secondary">None</button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {ANALYSIS_MODULES.map((m) => {
              const on = selected.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => setSelected(on ? selected.filter((x) => x !== m) : [...selected, m])}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left text-sm transition ${on ? "border-navy bg-secondary" : "border-border bg-card hover:border-navy/40"}`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${on ? "border-navy bg-navy" : "border-border"}`}>
                    {on && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                  </div>
                  <span className={on ? "font-medium text-navy-deep" : "text-foreground/70"}>{m}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <div className="text-sm text-muted-foreground">{selected.length} of {ANALYSIS_MODULES.length} modules selected</div>
            <button onClick={generate} disabled={!query.trim()} className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy-deep shadow-[var(--shadow-card)] transition hover:opacity-90 disabled:opacity-40">
              Generate Investment Analysis <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust + history */}
      <section className="bg-background">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h3 className="text-2xl font-semibold text-navy-deep">Built like an institutional research desk</h3>
            <p className="mt-2 text-sm text-muted-foreground">Designed for hedge funds, PMS managers and serious investors who need provenance, not opinions.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { t: "Verified primary sources", d: "NSE, BSE, SEBI, audited annual reports, official IR pages, investor presentations." },
                { t: "Citation on every claim", d: "Source name, filing date, URL and extraction timestamp attached to every number." },
                { t: "No fabricated estimates", d: "If verified data is missing, we display 'Not available from verified sources'." },
                { t: "Auditable & reproducible", d: "Every calculation derives from disclosed data. Full audit panel included." },
              ].map((x) => (
                <div key={x.t} className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-navy-deep"><ShieldCheck className="h-4 w-4 text-gold" /> {x.t}</div>
                  <p className="text-sm text-foreground/70">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-deep"><History className="h-4 w-4" /> Recent reports</div>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet. Run your first analysis above.</p>
              ) : (
                <ul className="divide-y divide-border">
                  <AnimatePresence>
                    {history.map((h) => (
                      <motion.li key={h.ticker + h.at} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <div className="font-mono font-semibold text-navy-deep">{h.ticker}</div>
                          <div className="text-xs text-muted-foreground">{h.name}</div>
                        </div>
                        <button onClick={() => { setQuery(h.ticker); generate(); }} className="text-xs font-medium text-navy hover:underline">Re-run →</button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-navy-deep py-8 text-center text-xs text-white/60">
        <p>For informational purposes only. Not SEBI-registered investment advice.</p>
        <p className="mt-1">© {new Date().getFullYear()} India Investment Research Platform</p>
      </footer>
    </div>
  );
}
