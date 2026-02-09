import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  TimeScale,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, TimeScale, Filler);

const MAX_POINTS = 50;

const MarketChart = ({ data }) => {
  const chartRef = useRef(null);

  const chartData = {
    labels: data.map((p) => new Date(p.timestamp)),
    datasets: [
      {
        label: "Price",
        data: data.map((p) => p.price ?? 0),
        borderColor: "#00e0ff",
        backgroundColor: "rgba(0, 224, 255, 0.1)",
        tension: 0.2,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: "#00e0ff",
        pointBorderColor: "#0b0f19",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "second",
          tooltipFormat: "HH:mm:ss",
          displayFormats: { second: "HH:mm:ss", minute: "HH:mm", hour: "HH:mm" },
        },
        ticks: { autoSkip: true, maxTicksLimit: 8, color: "#9ca3af", font: { size: 11 }, maxRotation: 0 },
        grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
      },
      y: {
        beginAtZero: false,
        ticks: { color: "#9ca3af", font: { size: 11 }, callback: (value) => `$${value.toFixed(4)}` },
        grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
      },
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(11,15,25,0.95)",
        titleColor: "#a0aec0",
        titleFont: { size: 12 },
        bodyColor: "#ffffff",
        bodyFont: { size: 13 },
        borderColor: "rgba(0,224,255,0.3)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) => `Price: $${ctx.parsed.y.toFixed(4)}`,
          title: (ctx) =>
            new Date(ctx[0].parsed.x).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
        },
      },
      legend: { display: false },
    },
    interaction: { mode: "nearest", intersect: false },
    elements: { line: { cubicInterpolationMode: "monotone" } },
  };

  // Auto-scroll chart points
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    if (chart.data.labels.length > MAX_POINTS) {
      chart.data.labels.shift();
      chart.data.datasets.forEach((ds) => ds.data.shift());
      chart.update("none");
    }
  }, [data]);

  // Gradient fill
  useEffect(() => {
    if (chartRef.current && chartData.datasets[0].data.length > 0) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "rgba(0,224,255,0.3)");
      gradient.addColorStop(1, "rgba(0,224,255,0)");
      chart.data.datasets[0].backgroundColor = gradient;
      chart.update("none");
    }
  }, [data]);

  return (
    <div className="relative w-full h-80">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl" />

        {/* Chart Title */}
        <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-300">Live Market Price</span>
        </div>

        {/* Current Price */}
        {data.length > 0 && (
          <div className="absolute top-5 right-5 z-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50">
              <span className="text-xs text-gray-400">Current:</span>
              <span className="text-sm font-bold text-cyan-400">
                ${data[data.length - 1]?.price?.toFixed(4) || "0.0000"}
              </span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="absolute inset-4 mt-6 mb-6">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs text-gray-400">Price</span>
            </div>
            {data.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Change:</span>
                <span
                  className={`text-xs font-medium ${
                    data[data.length - 1]?.price > data[0]?.price ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{data.length} points • Auto-scroll</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketChart;
