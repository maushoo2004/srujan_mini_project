import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { supabase } from "../utils/supabaseClient";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import logo from "../assets/srujan_logo.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.risk_level === filter);

  // Prepare chart data
  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const riskCounts = last7Days.map((date) => {
      const dayLogs = logs.filter(
        (log) => log.timestamp.split("T")[0] === date
      );
      return {
        high: dayLogs.filter((l) => l.risk_level === "high").length,
        medium: dayLogs.filter((l) => l.risk_level === "medium").length,
        low: dayLogs.filter((l) => l.risk_level === "low").length,
      };
    });

    return {
      labels: last7Days.map((date) =>
        new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "High Risk",
          data: riskCounts.map((r) => r.high),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
        },
        {
          label: "Medium Risk",
          data: riskCounts.map((r) => r.medium),
          backgroundColor: "rgba(251, 191, 36, 0.8)",
        },
        {
          label: "Low Risk",
          data: riskCounts.map((r) => r.low),
          backgroundColor: "rgba(34, 197, 94, 0.8)",
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "URL Risk Analysis - Last 7 Days",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const getRiskBadgeColor = (risk) => {
    const colors = {
      high: "bg-red-950/50 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20",
      medium:
        "bg-orange-950/50 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20",
      low: "bg-green-950/50 text-green-400 border-green-500/50 shadow-lg shadow-green-500/20",
    };
    return colors[risk] || "bg-gray-800 text-gray-400 border-gray-700";
  };

  const stats = {
    total: logs.length,
    high: logs.filter((l) => l.risk_level === "high").length,
    medium: logs.filter((l) => l.risk_level === "medium").length,
    low: logs.filter((l) => l.risk_level === "low").length,
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-lg shadow-yellow-500/10 border-b border-yellow-500/30 animate-slideInUp">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img
            src={logo}
            alt="CyberShield Logo"
            className="h-48 w-auto hover:scale-110 transition-all duration-300 cursor-pointer"
            onClick={() => navigate("/home")}
          />
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/activity-monitor")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-xl hover:shadow-cyan-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 animate-slideInRight stagger-1"
            >
              Monitor
            </button>
            <button
              onClick={() => navigate("/safety-coach")}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 animate-slideInRight stagger-2"
            >
              AI Coach
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-yellow-500/10 p-8 mb-8 border border-yellow-500/30 animate-scaleIn hover:shadow-yellow-500/20 transition-shadow duration-500">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent mb-6 flex items-center animate-slideInLeft">
            <span className="mr-3 text-yellow-500 animate-pulse">📊</span>
            Activity Dashboard
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-950/50 to-amber-950/50 rounded-lg p-4 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-1">
              <div className="text-3xl font-bold text-yellow-400">
                {stats.total}
              </div>
              <div className="text-sm text-yellow-300">Total Scans</div>
            </div>
            <div className="bg-gradient-to-br from-red-950/50 to-orange-950/50 rounded-lg p-4 border-2 border-red-500/50 shadow-lg shadow-red-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-2">
              <div className="text-3xl font-bold text-red-400">
                {stats.high}
              </div>
              <div className="text-sm text-red-300">High Risk</div>
            </div>
            <div className="bg-gradient-to-br from-orange-950/50 to-yellow-950/50 rounded-lg p-4 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-3">
              <div className="text-3xl font-bold text-orange-400">
                {stats.medium}
              </div>
              <div className="text-sm text-orange-300">Medium Risk</div>
            </div>
            <div className="bg-gradient-to-br from-green-950/50 to-emerald-950/50 rounded-lg p-4 border-2 border-green-500/50 shadow-lg shadow-green-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-4">
              <div className="text-3xl font-bold text-green-400">
                {stats.low}
              </div>
              <div className="text-sm text-green-300">Low Risk</div>
            </div>
          </div>

          {/* Chart */}
          {logs.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 animate-slideInUp stagger-2 hover:border-yellow-500/50 transition-colors duration-300">
              <Bar data={getChartData()} options={chartOptions} />
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 flex-wrap animate-slideInLeft stagger-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                filter === "all"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-xl shadow-yellow-500/60 scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105 border border-gray-700"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                filter === "high"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl shadow-red-500/60 scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105 border border-gray-700"
              }`}
            >
              High Risk ({stats.high})
            </button>
            <button
              onClick={() => setFilter("medium")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                filter === "medium"
                  ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-xl shadow-orange-500/60 scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105 border border-gray-700"
              }`}
            >
              Medium Risk ({stats.medium})
            </button>
            <button
              onClick={() => setFilter("low")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                filter === "low"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl shadow-green-500/60 scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105 border border-gray-700"
              }`}
            >
              Low Risk ({stats.low})
            </button>
          </div>

          {/* Activity Logs Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading activity logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activity logs found. Start monitoring URLs to see your activity
              here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">
                      URL
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-gray-800/50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-gray-900/30" : "bg-black/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-cyan-400 break-all max-w-md">
                        {log.url}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getRiskBadgeColor(
                            log.risk_level
                          )}`}
                        >
                          {log.risk_level.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
