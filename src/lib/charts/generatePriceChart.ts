import { ChartJSNodeCanvas } from "chartjs-node-canvas";

type Candle = {
  date: string;
  close: number;
};

export async function generatePriceChart(
  candles: Candle[],
  sma20: number[],
  sma50: number[]
) {
  const width = 1200;
  const height = 600;

  const chartJSNodeCanvas =
    new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "white",
    });

  const labels = candles.map((c) =>
    c.date.slice(5)
  );

  const closes = candles.map(
    (c) => c.close
  );

  const configuration: any = {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Price",
          data: closes,
          borderWidth: 2,
          tension: 0.2,
        },

        {
          label: "20 DMA",
          data: sma20,
          borderWidth: 2,
          tension: 0.2,
        },

        {
          label: "50 DMA",
          data: sma50,
          borderWidth: 2,
          tension: 0.2,
        },
      ],
    },

    options: {
      responsive: false,

      plugins: {
        title: {
          display: true,
          text: "Price Trend with Moving Averages",
          font: {
            size: 20,
          },
        },

        legend: {
          position: "top",
        },
      },

      scales: {
        x: {
          ticks: {
            maxTicksLimit: 12,
          },
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(
    configuration
  );
}