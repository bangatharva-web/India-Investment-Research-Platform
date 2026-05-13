import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    BarChart,
    Bar,
  } from "recharts";
  
  import type { Report } from "@/lib/mockReport";
  
  const inr = (v: number) =>
    `₹${Math.round(v).toLocaleString("en-IN")}`;
  
  export function ReportCharts({ r }: { r: Report }) {
    const financialData = r.financials.years.map((year, i) => ({
      year,
      Revenue: r.financials.revenue[i],
      PAT: r.financials.pat[i],
      EBITDA: r.financials.ebitda[i],
    }));
  
    const priceData = r.technicals.priceHistory?.slice(-90) ?? [];
  
    return (
      <section className="mt-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            Visual Analysis
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            Charts & Trend Analysis
          </h2>
        </div>
  
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">
              Revenue Trend
            </h3>
  
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")} Cr`} />
                  <Bar dataKey="Revenue" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">
              EBITDA vs PAT
            </h3>
  
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")} Cr`} />
                  <Line type="monotone" dataKey="EBITDA" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="PAT" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-white">
              90-Day Price Trend
            </h3>
  
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis tickFormatter={inr} />
                  <Tooltip formatter={(v: any) => inr(Number(v))} />
                  <Line type="monotone" dataKey="close" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    );
  }