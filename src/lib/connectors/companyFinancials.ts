export async function getCompanyFinancials(symbol: string) {
    const yahooSymbol = symbol.includes(".")
      ? symbol
      : `${symbol}.NS`;
  
    const response = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`
    );
  
    if (!response.ok) {
      throw new Error("Failed to fetch company financials");
    }
  
    const data = await response.json();
  
    return data?.quoteSummary?.result?.[0] ?? null;
  }