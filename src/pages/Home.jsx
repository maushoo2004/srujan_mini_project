import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getRandomSafetyTip } from "../utils/aiClient";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import logo from "../assets/srujan_logo.png";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  const { user, signOut } = useUser();
  const navigate = useNavigate();
  const [safetyTip, setSafetyTip] = useState("");
  const [activityStats, setActivityStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    recentLogs: [],
    lastScan: null,
    todayScans: 0,
    weekScans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSafetyTip(getRandomSafetyTip());
    fetchActivityStats();
  }, [user]);

  const fetchActivityStats = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      const logs = data || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      setActivityStats({
        total: logs.length,
        high: logs.filter((l) => l.risk_level === "high").length,
        medium: logs.filter((l) => l.risk_level === "medium").length,
        low: logs.filter((l) => l.risk_level === "low").length,
        recentLogs: logs.slice(0, 5),
        lastScan: logs.length > 0 ? new Date(logs[0].timestamp) : null,
        todayScans: logs.filter((l) => new Date(l.timestamp) >= today).length,
        weekScans: logs.filter((l) => new Date(l.timestamp) >= weekAgo).length,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Prepare pie chart data
  const pieChartData = {
    labels: ["High Risk", "Medium Risk", "Low Risk"],
    datasets: [
      {
        data: [activityStats.high, activityStats.medium, activityStats.low],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)", // red
          "rgba(251, 191, 36, 0.8)", // yellow
          "rgba(34, 197, 94, 0.8)", // green
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const getTimeSince = (date) => {
    if (!date) return "Never";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
          />
          <button
            onClick={handleSignOut}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-xl hover:shadow-red-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 animate-slideInRight"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-yellow-500/10 p-8 mb-8 border border-yellow-500/30 animate-scaleIn hover:shadow-yellow-500/20 transition-shadow duration-500">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent mb-4 animate-slideInLeft">
            Welcome back, {user?.email?.split("@")[0]}! 👋
          </h2>
          <p className="text-gray-400 text-lg animate-slideInLeft stagger-1">
            Your digital security companion is ready to protect you.
          </p>
        </div>

        {/* Activity Summary Report */}
        {!loading && activityStats.total > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-yellow-500/10 p-8 mb-8 border border-yellow-500/30 animate-slideInUp stagger-1 hover:shadow-yellow-500/20 transition-shadow duration-500">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent mb-6 flex items-center animate-slideInLeft">
              <span className="mr-3 text-yellow-500 animate-pulse">📊</span>
              Your Activity Overview
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left: Statistics */}
              <div className="md:col-span-2 space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-yellow-950/50 to-amber-950/50 rounded-lg p-4 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-1">
                    <div className="text-3xl font-bold text-yellow-400">
                      {activityStats.total}
                    </div>
                    <div className="text-sm text-yellow-300 font-medium">
                      Total Scans
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-950/50 to-orange-950/50 rounded-lg p-4 border-2 border-red-500/50 shadow-lg shadow-red-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-2">
                    <div className="text-3xl font-bold text-red-400">
                      {activityStats.high}
                    </div>
                    <div className="text-sm text-red-300 font-medium">
                      High Risk
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-950/50 to-yellow-950/50 rounded-lg p-4 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-3">
                    <div className="text-3xl font-bold text-orange-400">
                      {activityStats.medium}
                    </div>
                    <div className="text-sm text-orange-300 font-medium">
                      Medium Risk
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-950/50 to-emerald-950/50 rounded-lg p-4 border-2 border-green-500/50 shadow-lg shadow-green-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-scaleIn stagger-4">
                    <div className="text-3xl font-bold text-green-400">
                      {activityStats.low}
                    </div>
                    <div className="text-sm text-green-300 font-medium">
                      Low Risk
                    </div>
                  </div>
                </div>

                {/* Time-based Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-950/50 rounded-lg p-4 border border-purple-500/50 shadow-lg shadow-purple-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-slideInUp stagger-2">
                    <div className="text-xl font-bold text-purple-400">
                      {activityStats.todayScans}
                    </div>
                    <div className="text-xs text-purple-300">Scans Today</div>
                  </div>
                  <div className="bg-indigo-950/50 rounded-lg p-4 border border-indigo-500/50 shadow-lg shadow-indigo-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-slideInUp stagger-3">
                    <div className="text-xl font-bold text-indigo-400">
                      {activityStats.weekScans}
                    </div>
                    <div className="text-xs text-indigo-300">This Week</div>
                  </div>
                  <div className="bg-pink-950/50 rounded-lg p-4 border border-pink-500/50 shadow-lg shadow-pink-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-slideInUp stagger-4">
                    <div className="text-xl font-bold text-pink-400">
                      {getTimeSince(activityStats.lastScan)}
                    </div>
                    <div className="text-xs text-pink-300">Last Scan</div>
                  </div>
                </div>

                {/* Security Score */}
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-6 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                  <h4 className="font-bold text-lg bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3">
                    🛡️ Security Health Score
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-400">
                          Safety Level
                        </span>
                        <span className="text-sm font-bold text-yellow-400">
                          {activityStats.total > 0
                            ? `${Math.round(
                                ((activityStats.low +
                                  activityStats.medium * 0.5) /
                                  activityStats.total) *
                                  100
                              )}%`
                            : "100%"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-amber-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-yellow-500/50"
                          style={{
                            width: `${
                              activityStats.total > 0
                                ? Math.round(
                                    ((activityStats.low +
                                      activityStats.medium * 0.5) /
                                      activityStats.total) *
                                      100
                                  )
                                : 100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {activityStats.high === 0
                          ? "✅ Great! No high-risk threats detected."
                          : `⚠️ ${activityStats.high} high-risk ${
                              activityStats.high === 1 ? "threat" : "threats"
                            } detected. Stay vigilant!`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {activityStats.recentLogs.length > 0 && (
                  <div>
                    <h4 className="font-bold text-yellow-400 mb-3">
                      📝 Recent Activity
                    </h4>
                    <div className="space-y-2">
                      {activityStats.recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate font-medium">
                              {log.url}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getTimeSince(new Date(log.timestamp))}
                            </p>
                          </div>
                          <span
                            className={`ml-3 px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                              log.risk_level === "high"
                                ? "bg-red-950/50 text-red-400 border border-red-500/50"
                                : log.risk_level === "medium"
                                ? "bg-orange-950/50 text-orange-400 border border-orange-500/50"
                                : "bg-green-950/50 text-green-400 border border-green-500/50"
                            }`}
                          >
                            {log.risk_level.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="mt-3 text-yellow-400 hover:text-yellow-300 text-sm font-medium hover:underline transition-colors duration-300"
                    >
                      View Full History →
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Pie Chart */}
              <div className="flex flex-col">
                <div className="bg-gray-900 rounded-lg p-6 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                  <h4 className="font-bold text-yellow-400 mb-4 text-center">
                    Risk Distribution
                  </h4>
                  <div style={{ height: "280px" }}>
                    {activityStats.total > 0 ? (
                      <Pie data={pieChartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No data yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => navigate("/activity-monitor")}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 text-sm"
                  >
                    🔍 Scan New URL
                  </button>
                  <button
                    onClick={() => navigate("/safety-coach")}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-sm"
                  >
                    🤖 Get AI Insights
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Activity Message */}
        {!loading && activityStats.total === 0 && (
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg shadow-xl shadow-yellow-500/10 p-8 mb-8 border-2 border-yellow-500/30 animate-scaleIn hover:shadow-yellow-500/20 transition-shadow duration-500">
            <div className="text-center">
              <span className="text-6xl mb-4 block animate-float">🚀</span>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3 animate-slideInUp">
                Get Started with CyberShield
              </h3>
              <p className="text-gray-400 mb-6 animate-slideInUp stagger-1">
                You haven't scanned any URLs yet. Start monitoring your browsing
                activity to get personalized security insights!
              </p>
              <button
                onClick={() => navigate("/activity-monitor")}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-8 py-3 rounded-lg font-bold hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-1 animate-slideInUp stagger-2"
              >
                Scan Your First URL
              </button>
            </div>
          </div>
        )}

        {/* Safety Tip Card */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg shadow-xl shadow-yellow-500/10 p-8 mb-8 border border-yellow-500/50 animate-slideInRight hover:shadow-yellow-500/20 hover:border-yellow-500/70 transition-all duration-500">
          <div className="flex items-start">
            <span className="text-4xl mr-4 animate-pulse">💡</span>
            <div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">
                Safety Tip of the Day
              </h3>
              <p className="text-gray-300 text-lg">{safetyTip}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Activity Monitor Card */}
          <div
            className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-cyan-500/10 p-8 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer border border-cyan-500/30 animate-slideInLeft stagger-2"
            onClick={() => navigate("/activity-monitor")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Activity Monitor
              </h3>
              <span className="text-4xl animate-float">🔍</span>
            </div>
            <p className="text-gray-400 mb-6">
              Scan URLs in real-time and detect potential security threats
              before they harm you.
            </p>
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-xl hover:shadow-cyan-500/60 transition-all duration-300 hover:scale-105">
              Start Monitoring
            </button>
          </div>

          {/* Dashboard Card */}
          <div
            className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-yellow-500/10 p-8 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer border border-yellow-500/30 animate-slideInRight stagger-3"
            onClick={() => navigate("/dashboard")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Activity Dashboard
              </h3>
              <span className="text-4xl animate-float text-yellow-500">📊</span>
            </div>
            <p className="text-gray-400 mb-6">
              View your browsing history, analyze patterns, and track security
              incidents.
            </p>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-3 rounded-lg font-medium hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-105">
              View Dashboard
            </button>
          </div>

          {/* AI Safety Coach Card */}
          <div
            className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-purple-500/10 p-8 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer md:col-span-2 border border-purple-500/30 animate-slideInUp stagger-4"
            onClick={() => navigate("/safety-coach")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                AI Safety Coach
              </h3>
              <span className="text-4xl animate-float">🤖</span>
            </div>
            <p className="text-gray-400 mb-6">
              Get personalized security recommendations powered by AI based on
              your browsing patterns.
            </p>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105">
              Get AI Advice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
