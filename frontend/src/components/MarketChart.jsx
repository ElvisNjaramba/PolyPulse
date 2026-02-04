// MarketChart.jsx
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

// Register required Chart.js components
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, TimeScale, Filler);

const MAX_POINTS = 50; // Keep last 50 points for scrolling

const MarketChart = ({ data }) => {
  const chartRef = useRef(null);

  // Transform data into Chart.js format
const chartData = {
  labels: data.map((p) => new Date(p.timestamp)), // must exist
  datasets: [
    {
      label: "Price",
      data: data.map((p) => p.price ?? 0), // fallback 0
      borderColor: "#00e0ff",
      backgroundColor: "rgba(0,224,255,0.1)",
      tension: 0.2,
      fill: true,
    },
  ],
};


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // disable animation for live updates
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "second",
          tooltipFormat: "HH:mm:ss",
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
          color: "#9ca3af",
        },
        grid: {
          color: "#1f2937",
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: "#9ca3af",
        },
        grid: {
          color: "#1f2937",
        },
      },
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
      legend: {
        display: false,
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
  };

  // Auto-scroll as new data arrives
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    if (chart.data.labels.length > MAX_POINTS) {
      chart.data.labels.shift();
      chart.data.datasets.forEach((dataset) => dataset.data.shift());
      chart.update("none");
    }
  }, [data]);

  return (
<div style={{ width: "100%", height: 300 }}> 
  <Line ref={chartRef} data={chartData} options={options} />
</div>

  );
};

export default MarketChart;
