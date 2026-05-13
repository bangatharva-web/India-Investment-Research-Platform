export function parseFinancialStatements(
    data: any
  ) {
    const income =
      data.incomeStatementHistory
        ?.incomeStatementHistory ?? [];
  
    const cashflows =
      data.cashflowStatementHistory
        ?.cashflowStatements ?? [];
  
    const balance =
      data.balanceSheetHistory
        ?.balanceSheetStatements ?? [];
  
    const financials = income.map(
      (item: any, index: number) => {
        const year = item.endDate
            ? new Date(item.endDate)
            .getFullYear()
            .toString()
            : "Unknown";
  
        return {
          year,
  
          revenue:
            item.totalRevenue ?? null,
  
          netIncome:
            item.netIncome ?? null,
  
          operatingIncome:
            item.operatingIncome ?? null,
  
          ebit:
            item.ebit ?? null,
  
          operatingCashFlow:
            cashflows[index]
              ?.totalCashFromOperatingActivities ??
            null,
  
          capitalExpenditure:
            cashflows[index]
              ?.capitalExpenditures ?? null,
  
          freeCashFlow:
            (cashflows[index]
              ?.totalCashFromOperatingActivities ??
              0) -
            Math.abs(
              cashflows[index]
                ?.capitalExpenditures ?? 0
            ),
  
          totalAssets:
            balance[index]
              ?.totalAssets ?? null,
  
          totalLiabilities:
            balance[index]
              ?.totalLiab ?? null,
  
          cash:
            balance[index]
              ?.cash ?? null,
  
          debt:
            balance[index]
              ?.longTermDebt ?? null,
        };
      }
    );
  
    return financials;
  }