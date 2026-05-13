import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function getCompanyFinancials(
  symbol: string
) {
  const yahooSymbol = symbol.includes(".")
    ? symbol
    : `${symbol}.NS`;

  const data =
    await yahooFinance.quoteSummary(
      yahooSymbol,
      {
        modules: [
          "incomeStatementHistory",
          "balanceSheetHistory",
          "cashflowStatementHistory",
        ],
      }
    );

  return data;
}