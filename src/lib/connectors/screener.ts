function cleanSymbol(symbol: string) {
    return symbol.replace(".NS", "").replace(".BO", "").trim().toUpperCase();
  }
  
  function stripHtml(html: string) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  function extractNumber(text: string | undefined | null) {
    if (!text) return null;
    const match = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }
  
  function findMetric(text: string, label: string) {
    const regex = new RegExp(`${label}\\s*₹?\\s*([\\d,]+\\.?\\d*)`, "i");
    return extractNumber(text.match(regex)?.[1]);
  }
  
  export async function getScreenerCompanyData(symbol: string) {
    const clean = cleanSymbol(symbol);
    const url = `https://www.screener.in/company/${clean}/consolidated/`;
  
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  
    if (!res.ok) {
      throw new Error(`Screener request failed: ${res.status}`);
    }
  
    const html = await res.text();
    const text = stripHtml(html);
  
    const companyName =
      html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i)?.[1]?.trim() ?? clean;
  
    return {
      symbol: clean,
      companyName,
      currentPrice: findMetric(text, "Current Price"),
      marketCap: findMetric(text, "Market Cap"),
      pe: findMetric(text, "Stock P/E"),
      bookValue: findMetric(text, "Book Value"),
      dividendYield: findMetric(text, "Dividend Yield"),
      roe: findMetric(text, "ROE"),
      roce: findMetric(text, "ROCE"),
      faceValue: findMetric(text, "Face Value"),
      rawText: text.slice(0, 25000),
      source: {
        provider: "Screener.in",
        url,
        retrievedAt: new Date().toISOString(),
        status: "verified_if_available",
      },
    };
  }