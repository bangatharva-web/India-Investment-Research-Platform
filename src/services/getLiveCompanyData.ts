import { createServerFn } from "@tanstack/react-start";
import { getCompanyFundamentals } from "@/lib/connectors/companyFundamentals";
import { generateTechnicalAnalysis } from "@/services/technicalAnalysis";

export const getLiveCompanyData = createServerFn({ method: "POST" })
  .handler(async (ctx: any): Promise<any> => {
    const symbol = ctx.data?.symbol;

    if (!symbol) {
      throw new Error("Missing symbol");
    }

    const fundamentals = await getCompanyFundamentals(symbol);
    const technicals = await generateTechnicalAnalysis(symbol);

    return {
      symbol,
      fundamentals,
      technicals,
      retrievedAt: new Date().toISOString(),
    } as any;
  });