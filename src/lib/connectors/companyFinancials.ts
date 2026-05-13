export async function getCompanyFinancials(symbol: string) {
    const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.NS`;
  
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
          yahooSymbol
        )}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json",
          },
        }
      );
  
      if (!response.ok) {
        console.warn(`Yahoo financials failed: ${response.status}`);
        return null;
      }
  
      const data = await response.json();
      return data?.quoteSummary?.result?.[0] ?? null;
    } catch (err) {
      console.warn("Yahoo financials unavailable", err);
      return null;
    }
  }