import { useEffect, useRef, useState } from "react";
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

const MarketChart = ({ pollId }) => {
  const chartRef = useRef(null);
  const [historicalData, setHistoricalData] = useState([]); // { timestamp, yes_price, no_price }
  const wsRef = useRef(null);

  // Fetch historical data on mount
useEffect(() => {
  if (!pollId) return;

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/polls/${pollId}/chart/`
      );

      if (!res.ok) throw new Error("Failed response");

      const data = await res.json();

      setHistoricalData(data.map(d => ({
        timestamp: new Date(d.created_at),
        yes_price: d.yes_price,
        no_price: d.no_price,
      })));
    } catch (err) {
      console.error("Failed to load price history", err);
    }
  };

  fetchHistory();
}, [pollId]);

  // WebSocket connection for live updates
useEffect(() => {
  if (!pollId) return;

  const ws = new WebSocket(
    `ws://127.0.0.1:8000/ws/market/${pollId}/`
  );

  ws.onopen = () => console.log("WS connected");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    setHistoricalData(prev => {
      const updated = [...prev, {
        timestamp: new Date(data.created_at),
        yes_price: data.yes_price,
        no_price: data.no_price,
      }];

      return updated.slice(-MAX_POINTS);
    });
  };

  ws.onerror = (err) => console.error("WS error", err);
  ws.onclose = () => console.log("WS closed");

  return () => ws.close();
}, [pollId]);

  // Prepare chart data
const chartData = {
  datasets: [
    {
      label: "YES Price",
      data: historicalData.map(d => ({
        x: d.timestamp,
        y: d.yes_price ?? 0,
      })),
      borderColor: "#00e0ff",
      backgroundColor: "rgba(0, 224, 255, 0.1)",
      tension: 0.2,
      fill: false,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: "#00e0ff",
      pointBorderColor: "#0b0f19",
      pointBorderWidth: 2,
    },
    {
      label: "NO Price",
      data: historicalData.map(d => ({
        x: d.timestamp,
        y: d.no_price ?? 0,
      })),
      borderColor: "#ff6384",
      backgroundColor: "rgba(255, 99, 132, 0.1)",
      tension: 0.2,
      fill: false,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: "#ff6384",
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
    adapters: {
      date: {}
    },
    time: {
      displayFormats: {
        second: "HH:mm:ss",
        minute: "HH:mm",
        hour: "MMM d HH:mm",
      }
    }
  }
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
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(4)}`,
          title: (ctx) =>
            new Date(ctx[0].parsed.x).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
        },
      },
      legend: { display: true, labels: { color: "#9ca3af" } },
    },
    interaction: { mode: "nearest", intersect: false },
    elements: { line: { cubicInterpolationMode: "monotone" } },
  };

  // Gradient fill (optional – you can keep only one filled or remove)
  useEffect(() => {
    if (chartRef.current && historicalData.length > 0) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const gradientYes = ctx.createLinearGradient(0, 0, 0, 400);
      gradientYes.addColorStop(0, "rgba(0,224,255,0.3)");
      gradientYes.addColorStop(1, "rgba(0,224,255,0)");
      chart.data.datasets[0].backgroundColor = gradientYes;

      const gradientNo = ctx.createLinearGradient(0, 0, 0, 400);
      gradientNo.addColorStop(0, "rgba(255,99,132,0.3)");
      gradientNo.addColorStop(1, "rgba(255,99,132,0)");
      chart.data.datasets[1].backgroundColor = gradientNo;

      chart.update("none");
    }
  }, [historicalData]);

  return (
    <div className="relative w-full h-80">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl" />

        {/* Chart Title */}
        <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-300">Live Market Prices</span>
        </div>

        {/* Current Prices */}
        {historicalData.length > 0 && (
          <div className="absolute top-5 right-5 z-10 flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50">
              <span className="text-xs text-gray-400">YES:</span>
              <span className="text-sm font-bold text-cyan-400">
                ${historicalData[historicalData.length - 1]?.yes_price?.toFixed(4) || "0.0000"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50">
              <span className="text-xs text-gray-400">NO:</span>
              <span className="text-sm font-bold text-rose-400">
                ${historicalData[historicalData.length - 1]?.no_price?.toFixed(4) || "0.0000"}
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
              <span className="text-xs text-gray-400">YES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs text-gray-400">NO</span>
            </div>
            {historicalData.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Change (YES):</span>
                <span
                  className={`text-xs font-medium ${
                    historicalData[historicalData.length - 1]?.yes_price > historicalData[0]?.yes_price
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {(
                    ((historicalData[historicalData.length - 1]?.yes_price - historicalData[0]?.yes_price) /
                      historicalData[0]?.yes_price) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{historicalData.length} points • Auto-scroll</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketChart;