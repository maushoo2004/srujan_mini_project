import { useState } from "react";
import { deleteSMS, reportSender } from "../utils/smsService";

export default function SMSCard({
  message,
  onDelete,
  onReport,
  userPhoneNumber,
}) {
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);

  const getRiskBadge = () => {
    switch (message.risk_level) {
      case "safe":
        return (
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
            ✓ SAFE
          </span>
        );
      case "dangerous":
        return (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
            ⛔ DANGEROUS
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full">
            PENDING
          </span>
        );
    }
  };

  const getRiskColor = () => {
    switch (message.risk_level) {
      case "safe":
        return "border-green-400 bg-gradient-to-br from-green-50 to-white";
      case "dangerous":
        return "border-red-400 bg-gradient-to-br from-red-50 to-white";
      default:
        return "border-gray-300 bg-white";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    setDeleting(true);
    const result = await deleteSMS(message.id);

    if (result.success) {
      onDelete && onDelete(message.id);
    } else {
      alert("Failed to delete message");
      setDeleting(false);
    }
  };

  const handleReport = async () => {
    if (
      !userPhoneNumber ||
      userPhoneNumber === "not-set" ||
      userPhoneNumber === "error"
    ) {
      alert("Cannot report: Phone number not available");
      return;
    }

    if (!window.confirm(`Report ${message.sender_number} as spam/scam?`)) {
      return;
    }

    setReporting(true);
    const result = await reportSender(message.sender_number, userPhoneNumber);

    if (result.success) {
      alert("Reported successfully! Message will be deleted.");
      onReport && onReport(message.sender_number, result.reportCount);

      // Delete the message after reporting
      const deleteResult = await deleteSMS(message.id);
      if (deleteResult.success) {
        onDelete && onDelete(message.id);
      }
    } else {
      alert(`Failed to report: ${result.error}`);
    }
    setReporting(false);
  };

  return (
    <div
      className={`${getRiskColor()} border-2 rounded-xl p-4 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden`}
    >
      {/* Animated background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📱</span>
            <h3 className="text-lg font-bold text-gray-800">
              {message.sender_number}
            </h3>
          </div>
          <p className="text-xs text-gray-500">{formatTime(message.sent_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getRiskBadge()}
          <div className="flex gap-2">
            {userPhoneNumber &&
              userPhoneNumber !== "not-set" &&
              userPhoneNumber !== "error" && (
                <button
                  onClick={handleReport}
                  disabled={reporting}
                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full hover:shadow-lg hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Report this sender as spam/scam"
                >
                  {reporting ? "⏳" : "🚫 Report"}
                </button>
              )}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Delete message"
              >
                {deleting ? "..." : "🗑️"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-3 border border-gray-200 relative z-10">
        <p className="text-gray-800 text-sm leading-relaxed break-words">
          {message.message_text}
        </p>
      </div>

      {/* AI Explanation (for suspicious/dangerous messages) */}
      {message.ai_explanation &&
        message.risk_level !== "safe" &&
        message.risk_level !== "pending" && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 border border-purple-300 relative z-10">
            <div className="flex items-start gap-2">
              <span className="text-lg">🤖</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-900 mb-1">
                  AI Analysis:
                </p>
                <p className="text-xs text-purple-800 leading-relaxed">
                  {message.ai_explanation}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
