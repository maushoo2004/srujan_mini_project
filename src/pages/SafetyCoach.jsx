import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { supabase } from "../utils/supabaseClient";
import { chatWithAI, getAISafetyAdvice } from "../utils/aiClient";
import logo from "../assets/srujan_logo.png";

export default function SafetyCoach() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm your CyberShield AI assistant. I can help you understand online threats, analyze URLs, and answer any cybersecurity questions. How can I help you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setError("");

    // Add user message to chat
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Get AI response
      const aiResponse = await chatWithAI(
        newMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        logs
      );

      setMessages([...newMessages, { role: "assistant", content: aiResponse }]);
    } catch (err) {
      console.error("Error getting AI response:", err);
      setError(err.message || "Failed to get response. Please try again.");
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error. Please check your API key and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnalysis = async () => {
    if (logs.length === 0) {
      setError("No activity logs found. Start monitoring URLs first!");
      return;
    }

    setLoading(true);
    setError("");

    const analysisMessage =
      "Please analyze my recent browsing activity and provide security recommendations.";
    const newMessages = [
      ...messages,
      { role: "user", content: analysisMessage },
    ];
    setMessages(newMessages);

    try {
      const aiAdvice = await getAISafetyAdvice(logs);
      setMessages([...newMessages, { role: "assistant", content: aiAdvice }]);
    } catch (err) {
      console.error("Error getting AI advice:", err);
      setError(err.message || "Failed to get AI advice.");
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I'm sorry, I couldn't analyze your activity. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What makes a URL dangerous?",
    "How can I identify phishing emails?",
    "What should I do if I clicked a suspicious link?",
    "How do I protect my passwords?",
    "What are the latest cyber threats?",
  ];

  return (
    <div className="h-screen bg-black">
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
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-xl hover:shadow-green-500/60 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 animate-slideInRight stagger-2"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-8 py-6">
        <div
          className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-xl shadow-purple-500/10 overflow-hidden border border-purple-500/30 animate-scaleIn hover:shadow-purple-500/20 transition-shadow duration-500"
          style={{ height: "calc(100vh - 140px)" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 p-6 border-b border-yellow-500/30">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <span className="mr-3 text-yellow-400 animate-pulse">🤖</span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                AI Safety Coach
              </span>
              <span className="text-white ml-2">- Chat Assistant</span>
            </h2>
            <p className="text-purple-200">
              Ask me anything about cybersecurity, URL safety, or get
              personalized recommendations
            </p>
            {logs.length > 0 && (
              <div className="mt-3 flex gap-2 text-sm flex-wrap">
                <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-300 border border-yellow-500/30">
                  📊 {logs.length} URLs scanned
                </span>
                <span className="bg-red-500/20 px-3 py-1 rounded-full text-red-300 border border-red-500/30">
                  {logs.filter((l) => l.risk_level === "high").length} High Risk
                </span>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 overflow-y-auto p-8 space-y-6 bg-black"
            style={{ height: "calc(100% - 260px)" }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex animate-fadeIn ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🤖</span>
                      <span className="font-semibold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                        CyberShield AI
                      </span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4 bg-black border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-2">💡 Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(q);
                      document.getElementById("chat-input")?.focus();
                    }}
                    className="text-sm bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-800/50 transition-all duration-300 border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Analysis Button */}
          {logs.length > 0 && (
            <div className="px-6 pb-4 bg-black border-t border-gray-800">
              <button
                onClick={handleQuickAnalysis}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                ⚡ Quick Activity Analysis
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="px-6 pb-4 bg-black">
              <div className="bg-red-950/50 border border-red-500/50 text-red-400 px-4 py-2 rounded text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-6 bg-gradient-to-r from-gray-900 to-black border-t border-yellow-500/30"
          >
            <div className="flex gap-3">
              <input
                id="chat-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about cybersecurity, phishing, or any security concern..."
                className="flex-1 px-4 py-3 bg-gray-900 border border-yellow-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 transition-all duration-300"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "..." : "📤 Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
