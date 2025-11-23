import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { supabase } from "../utils/supabaseClient";
import { classifyRisk, analyzeMediumRiskUrl } from "../utils/aiClient";
import logo from "../assets/srujan_logo.png";

export default function ActivityMonitor() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const [riskDetails, setRiskDetails] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setAlert(null);
    setRiskDetails(null);

    try {
      // Classify the risk
      const riskLevel = classifyRisk(url);

      // Get AI analysis only for medium risk
      let details = null;
      if (riskLevel === "medium") {
        details = await analyzeMediumRiskUrl(url);
        setRiskDetails(details);
      }

      // Save to Supabase
      const { error } = await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          url: url,
          risk_level: riskLevel,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Show alert based on risk level
      const alertConfig = {
        high: {
          color: "red",
          icon: "🚨",
          title: "HIGH RISK DETECTED!",
          message:
            "This URL appears to be dangerous. It may contain phishing, fraud, or malware. Do NOT proceed!",
        },
        medium: {
          color: "yellow",
          icon: "⚠️",
          title: "Medium Risk Detected",
          message:
            details && details.threats && details.threats.length > 0
              ? `We detected: ${details.threats.join(
                  ", "
                )}. Review the safety tips below before proceeding.`
              : "This URL may contain executable files or compressed archives. Proceed with caution.",
        },
        low: {
          color: "green",
          icon: "✅",
          title: "Safe to Proceed",
          message: "This URL appears to be safe. No obvious threats detected.",
        },
      };

      setAlert(alertConfig[riskLevel]);

      // Load URL in iframe (only for low/medium risk for safety)
      if (riskLevel !== "high") {
        setIframeUrl(url);
      } else {
        setIframeUrl("");
      }
    } catch (error) {
      console.error("Error analyzing URL:", error);
      setAlert({
        color: "red",
        icon: "❌",
        title: "Error",
        message: "Failed to analyze URL. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertClasses = () => {
    if (!alert) return "";
    const colorMap = {
      red: "bg-red-950/50 border-red-500 text-red-400 shadow-lg shadow-red-500/20",
      yellow:
        "bg-yellow-950/50 border-yellow-500 text-yellow-400 shadow-lg shadow-yellow-500/20",
      green:
        "bg-green-950/50 border-green-500 text-green-400 shadow-lg shadow-green-500/20",
    };
    return colorMap[alert.color] || "";
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-yellow-500/30 shadow-lg shadow-yellow-500/20 animate-slideInUp">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img
            src={logo}
            alt="CyberShield Logo"
            className="h-48 w-auto hover:scale-110 transition-all duration-300 cursor-pointer"
            onClick={() => navigate("/home")}
          />
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-4 py-2 rounded-lg hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 animate-slideInRight stagger-1"
            >
              Dashboard
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
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-2xl shadow-yellow-500/20 border border-yellow-500/30 p-8 mb-8 animate-scaleIn hover:shadow-yellow-500/30 transition-shadow duration-500">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent mb-2 flex items-center animate-slideInLeft">
            <span className="mr-3 text-4xl animate-float text-yellow-500">
              🔍
            </span>
            Activity Monitor
          </h2>
          <p className="text-gray-400 mb-6 animate-slideInLeft stagger-1">
            Enter a URL to analyze for potential security threats
          </p>

          {/* URL Input Form */}
          <form
            onSubmit={handleAnalyze}
            className="mb-6 animate-slideInUp stagger-2"
          >
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-900 border border-yellow-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus:scale-[1.02] text-white placeholder-gray-500 transition-all duration-300 hover:border-yellow-500/70"
                placeholder="https://example.com"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-8 py-3 rounded-lg font-medium hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze URL"
                )}
              </button>
            </div>
          </form>

          {/* Alert Message - Only for High Risk */}
          {alert && alert.color === "red" && (
            <div className={`border-l-4 p-4 mb-6 ${getAlertClasses()}`}>
              <div className="flex items-start">
                <span className="text-2xl mr-3">{alert.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{alert.title}</h3>
                  <p>{alert.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Medium Risk Detailed Warning - ONLY FOR MEDIUM RISK */}
          {alert &&
            alert.color === "yellow" &&
            riskDetails &&
            riskDetails.threats &&
            riskDetails.threats.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-950/30 to-orange-950/30 border-2 border-yellow-500/50 rounded-lg p-6 mb-6 shadow-xl shadow-yellow-500/20 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="font-bold text-xl text-yellow-400 mb-2 flex items-center">
                    <span className="mr-2 text-2xl animate-pulse">🛡️</span>
                    Specific Risks Detected
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4 mb-4 border border-yellow-500/30">
                    <h4 className="font-semibold text-yellow-300 mb-2">
                      Threat Analysis:
                    </h4>
                    <ul className="space-y-2">
                      {riskDetails.threats.map((threat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start animate-fadeIn"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <span className="text-yellow-500 mr-2 font-bold">
                            ▸
                          </span>
                          <span className="text-gray-300">{threat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 border border-yellow-500/30">
                  <h4 className="font-bold text-yellow-300 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    How to Stay Safe:
                  </h4>
                  <ul className="space-y-2">
                    {riskDetails.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start animate-fadeIn"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <span className="text-green-400 mr-2 font-bold text-lg">
                          ✓
                        </span>
                        <span className="text-gray-300 font-medium">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 bg-red-950/30 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400 font-semibold flex items-center">
                    <span className="text-xl mr-2 animate-pulse">⚠️</span>
                    Remember: When in doubt, don't download. Verify the source
                    first!
                  </p>
                </div>
              </div>
            )}

          {/* URL Analysis Results - Simple for Low Risk */}
          {iframeUrl && alert && alert.color === "green" && (
            <div className="mt-6 animate-fadeIn">
              <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border-2 border-green-500/50 rounded-lg p-6 shadow-xl shadow-green-500/20">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3 animate-pulse">✅</span>
                  <div>
                    <h3 className="font-bold text-xl text-green-400">
                      Safe URL Detected
                    </h3>
                    <p className="text-green-300">
                      No threats found. You can proceed safely.
                    </p>
                  </div>
                </div>

                <div className="bg-black/50 rounded-lg p-4 mb-4 border border-green-500/30">
                  <p className="text-sm text-gray-400 mb-2">URL:</p>
                  <p className="text-cyan-400 font-medium break-all">
                    {iframeUrl}
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={iframeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 text-center"
                  >
                    🔗 Open in New Tab
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(iframeUrl)}
                    className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg hover:shadow-gray-500/30 transition-all duration-300 hover:scale-105"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* URL Analysis Results - For Medium Risk (shown after detailed warning) */}
          {iframeUrl && alert && alert.color === "yellow" && (
            <div className="mt-6 animate-fadeIn">
              <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-lg p-6 shadow-xl shadow-yellow-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">URL:</p>
                    <p className="text-cyan-400 font-medium break-all mb-4">
                      {iframeUrl}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={iframeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 text-center"
                  >
                    ⚠️ Proceed with Caution
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(iframeUrl)}
                    className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg hover:shadow-gray-500/30 transition-all duration-300 hover:scale-105"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-6 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 animate-slideInUp stagger-3 hover:shadow-yellow-500/20 hover:border-yellow-500/40 transition-all duration-500">
          <h3 className="font-bold text-lg bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3 animate-slideInLeft">
            How it works:
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start transition-all duration-300 hover:translate-x-2 hover:text-yellow-400 animate-slideInLeft stagger-1">
              <span className="text-yellow-400 mr-2 animate-pulse">✓</span>
              <span>Enter any URL to analyze for security threats</span>
            </li>
            <li className="flex items-start transition-all duration-300 hover:translate-x-2 hover:text-yellow-400 animate-slideInLeft stagger-2">
              <span className="text-yellow-400 mr-2 animate-pulse">✓</span>
              <span>
                Our system checks for phishing patterns, malware indicators, and
                suspicious file types
              </span>
            </li>
            <li className="flex items-start transition-all duration-300 hover:translate-x-2 hover:text-yellow-400 animate-slideInLeft stagger-3">
              <span className="text-yellow-400 mr-2 animate-pulse">✓</span>
              <span>All scans are logged to your activity history</span>
            </li>
            <li className="flex items-start transition-all duration-300 hover:translate-x-2 hover:text-yellow-400 animate-slideInLeft stagger-4">
              <span className="text-yellow-400 mr-2 animate-pulse">✓</span>
              <span>
                High-risk URLs are blocked from preview for your safety
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
