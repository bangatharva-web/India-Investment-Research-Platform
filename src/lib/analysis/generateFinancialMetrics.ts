export function generateFinancialMetrics(financials: any[]) {
    if (!financials.length) return null;
  
    const latest = financials[0];
    const previous = financials[1];
    const oldest = financials[financials.length - 1];
  
    const safeGrowth = (current: number, prior: number) => {
      if (!current || !prior || prior <= 0) return null;
      return ((current - prior) / prior) * 100;
    };
  
    const cleanGrowth = (value: number | null) => {
      if (value == null) return null;
      if (Math.abs(value) > 75) return null;
      return value;
    };
  
    const revenueGrowthRaw = safeGrowth(latest.revenue, previous?.revenue);
    const profitGrowthRaw = safeGrowth(latest.netIncome, previous?.netIncome);
  
    const netMargin =
      latest.revenue && latest.netIncome
        ? (latest.netIncome / latest.revenue) * 100
        : null;
  
    const years = financials.length - 1;
  
    const revenueCAGRRaw =
      years > 0 && latest.revenue && oldest?.revenue
        ? (Math.pow(latest.revenue / oldest.revenue, 1 / years) - 1) * 100
        : null;
  
    return {
      revenueGrowth: cleanGrowth(revenueGrowthRaw),
      profitGrowth: cleanGrowth(profitGrowthRaw),
      netMargin,
      revenueCAGR: cleanGrowth(revenueCAGRRaw),
      isBankLike:
        latest.revenue == null ||
        latest.freeCashFlow === 0 ||
        latest.totalAssets == null,
    };
  }