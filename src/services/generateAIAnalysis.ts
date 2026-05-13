import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function generateAIAnalysis(data: any) {
  const prompt = `
You are an institutional equity research analyst.

Generate:
1. Investment Thesis
2. Key Risks
3. Key Catalysts
4. Final Recommendation Summary

Company:
${JSON.stringify(data, null, 2)}

Rules:
- Professional institutional tone
- Concise
- No hallucinations
- Use actual metrics provided
- Mention valuation, growth, profitability, and technical trend
`;

  const result = await model.generateContent(
    prompt
  );

  return result.response.text();
}