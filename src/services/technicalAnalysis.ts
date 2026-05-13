import {
    SMA,
    RSI,
    MACD,
    BollingerBands,
  } from "technicalindicators";
  
  import { getNseHistoricalPrices } from "@/lib/connectors/nse";
  
  export async function generateTechnicalAnalysis(symbol: string) {
    const candles = await getNseHistoricalPrices(symbol);
    
    // ===== REMOVE INVALID YAHOO CANDLES =====
  
    const validCandles = candles.filter(
      (c: any) =>
        c &&
        c.open != null &&
        c.high != null &&
        c.low != null &&
        c.close != null &&
        c.volume != null
    );
  
    if (!validCandles.length) {
      throw new Error("No valid historical candle data found.");
    }
  
    const closes = validCandles.map((c: any) => c.close);
  
    const currentPrice = closes[closes.length - 1];
  
    // ===== MOVING AVERAGES =====
  
    const sma20Series = SMA.calculate({
      period: 20,
      values: closes,
    });
  
    const sma50Series = SMA.calculate({
      period: 50,
      values: closes,
    });
  
    const sma100Series = SMA.calculate({
      period: 100,
      values: closes,
    });
  
    const sma200Series = SMA.calculate({
      period: 200,
      values: closes,
    });
  
    const sma20 = sma20Series.at(-1);
  
    const sma50 = sma50Series.at(-1);
  
    const sma100 = sma100Series.at(-1);
  
    const sma200 = sma200Series.at(-1);
  
    // ===== RSI =====
  
    const rsiSeries = RSI.calculate({
      values: closes,
      period: 14,
    });
  
    const rsiValue = rsiSeries.at(-1);
  
    // ===== MACD =====
  
    const macdSeries = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
  
    const macd = macdSeries.at(-1);
  
    // ===== BOLLINGER =====
  
    const bollingerSeries =
      BollingerBands.calculate({
        values: closes,
        period: 20,
        stdDev: 2,
      });
  
    const bollinger =
      bollingerSeries.at(-1);
  
    // ===== TREND =====
  
    const trend =
      currentPrice >
      (sma200 ?? currentPrice)
        ? "Uptrend"
        : "Downtrend";
  
    // ===== MOMENTUM =====
  
    const momentum =
      (rsiValue ?? 50) >= 70
        ? "Overbought"
        : (rsiValue ?? 50) <= 30
        ? "Oversold"
        : "Neutral";
  
    // ===== SIGNAL =====
  
    const signal =
      (macd?.histogram ?? 0) > 0
        ? "Bullish"
        : "Bearish";

    // ===== TECHNICAL CONCLUSION =====

    let technicalConclusion = "";

    if (trend === "Uptrend" && signal === "Bullish") {
      technicalConclusion =
        "Bullish trend confirmation with positive momentum.";
    } else if (trend === "Downtrend" && signal === "Bearish") {
      technicalConclusion =
        "Weak technical structure with bearish momentum.";
    } else {
      technicalConclusion =
        "Mixed technical setup with no strong directional confirmation.";
    }
  
    // ===== SUPPORT / RESISTANCE =====
  
    const recentCandles =
      validCandles.slice(-60);
  
    const recentLows =
      recentCandles
        .map((c: any) => c.low)
        .filter(
          (v: number) =>
            typeof v === "number" &&
            v > 0
        );
  
    const recentHighs =
      recentCandles
        .map((c: any) => c.high)
        .filter(
          (v: number) =>
            typeof v === "number" &&
            v > 0
        );
  
    const support = [
      Math.round(Math.min(...recentLows)),
      Math.round(currentPrice * 0.95),
    ].sort((a, b) => a - b);
  
    const resistance = [
      Math.round(currentPrice * 1.05),
      Math.round(Math.max(...recentHighs)),
    ].sort((a, b) => a - b);
  
    // ===== AVG VOLUME =====
  
    const averageVolume =
      validCandles.reduce(
        (a: number, b: any) =>
          a + b.volume,
        0
      ) / validCandles.length;
  
    return {
      currentPrice,
  
      sma20,
      sma50,
      sma100,
      sma200,
  
      sma20Series,
      sma50Series,
  
      rsi14: rsiValue,
  
      macd,
  
      bollinger,
  
      trend,
      momentum,
      signal,
      technicalConclusion,
  
      support,
      resistance,
  
      candles: validCandles,
  
      averageVolume,
  
      source: {
        name: "NSE India",
        retrievedAt:
          new Date().toISOString(),
      },
    };
  }