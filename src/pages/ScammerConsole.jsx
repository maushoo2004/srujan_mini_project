import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendSMS } from "../utils/smsService";
import logo from "../assets/srujan_logo.png";

export default function ScammerConsole() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    senderNumber: "",
    targetNumber: "",
    messageText: "",
  });
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  // Preset scam templates for quick testing
  const scamTemplates = [
    // DANGEROUS SCAM TEMPLATES - URLs designed to trigger HIGH RISK in URL analyzer
    {
      name: "Bank Alert 🔴",
      risk: "dangerous",
      text: "URGENT: Your bank account has been compromised. Click here to verify-account immediately: http://secure-bank-verify.tk/verify-account?id=12345&token=XyZ789. Your account will be suspended-account in 24 hours.",
    },
    {
      name: "OTP Fraud 🔴",
      risk: "dangerous",
      text: "Your OTP for transaction is 849372. Do not share this with anyone. If you didn't request this, call us at +91-9876543210 immediately.",
    },
    {
      name: "Lottery Scam 🔴",
      risk: "dangerous",
      text: "CONGRATULATIONS! You won ₹50,00,000 in lottery! To claim-prize visit: http://lottery-winner-claim.ml/claim-prize?ref=738291&you-won=true and pay processing fee of ₹5000.",
    },
    {
      name: "UPI Phishing 🔴",
      risk: "dangerous",
      text: "Dear customer, your UPI ID account-suspended due to unusual-activity. Re-activate now at http://upi-verify-payment.tk/account-verification?action-required=urgent or face permanent suspension.",
    },
    {
      name: "Payment Scam 🔴",
      risk: "dangerous",
      text: "Your card ending 4532 has been charged ₹45,000. If this wasn't you, verify-payment immediately: http://secure-refund-confirm.ml/verify-payment?txn=78291&confirm-payment=now",
    },
    {
      name: "Threat Message 🔴",
      risk: "dangerous",
      text: "This is final warning. Pay ₹50000 immediately to http://urgent-payment-gateway.tk/pay?action-required=immediate&free-money=false or face serious consequences. We know your location.",
    },
    {
      name: "KYC Scam 🔴",
      risk: "dangerous",
      text: "Your Aadhaar linked mobile account-locked today. Update KYC at http://uidai-verify-account.ml/confirm-identity?mobile=XXX&verify-information=urgent or call 18001234567. -Govt of India",
    },
    {
      name: "Tax Fraud 🔴",
      risk: "dangerous",
      text: "Income Tax Dept: You have pending tax refund of ₹34,500. Submit details at http://tax-refund-claim.tk/verify-account?claim-prize=true&government-grant=approved within 24hrs to claim.",
    },
    {
      name: "Job Offer Scam 🔴",
      risk: "dangerous",
      text: "Congratulations! Selected for work-from-home job with ₹25000/month salary. Pay registration at http://job-offer-registration.ml/fake-job?work-from-home-fake=registration. WhatsApp: 9123456789",
    },
    {
      name: "Investment Fraud 🔴",
      risk: "dangerous",
      text: "Limited time crypto investment! Invest ₹10,000 earn ₹50,000 in 30 days. Guaranteed-profit 500%! Register: http://bitcoin-giveaway-investment.tk/free-bitcoin?double-your-money=true",
    },
    {
      name: "Fake Deal 🔴",
      risk: "dangerous",
      text: "FLASH SALE! iPhone 15 Pro at just ₹9,999! Original ₹1,29,000. Limited-time offer, act-now! Order: http://shop-deals-urgent.ml/free-iphone?expires-today=true&dont-miss=deal",
    },
    {
      name: "Survey Scam 🔴",
      risk: "dangerous",
      text: "Congratulations-winner! You're selected for survey. Complete & get FREE voucher ₹5000. Claim here: http://survey-free-gift-card.tk/claim-reward?complete-survey=win-prize",
    },
    {
      name: "Loan Scam 🔴",
      risk: "dangerous",
      text: "Get instant personal loan up to ₹5 lakhs without documents! Easy-money 1.5%/month. Apply: http://quickloan-guaranteed-profit.ml/apply?make-money-fast=instant - Approval in 5 min.",
    },
    {
      name: "Prize Scam 🔴",
      risk: "dangerous",
      text: "Your mobile won ₹25,000 in lucky draw! To claim-prize verify at http://cash-prize-you-won.tk/claim-prize?lottery-winner=true&free-money=25000 and pay ₹500 processing fee.",
    },
    {
      name: "Netflix Scam 🔴",
      risk: "dangerous",
      text: "Your Netflix account-suspended. Renew now at http://netfliix-verify-account.tk/update-payment?suspended-account=urgent to avoid permanent deletion. Pay ₹199 within 24 hours.",
    },
    {
      name: "WhatsApp Scam 🔴",
      risk: "dangerous",
      text: "Your WhatsApp account-verification failed. Verify immediately: http://whatsapp-confirm-account.ml/verify-account?security-alert=urgent&account-locked=true or lose access permanently.",
    },
    {
      name: "COVID Relief Scam 🔴",
      risk: "dangerous",
      text: "Govt COVID-19 relief: You're eligible for ₹10,000 assistance. Apply at http://covid-government-grant.tk/stimulus-check-scam?claim-prize=eligible with your Aadhaar & bank details.",
    },
    {
      name: "Delivery Scam 🔴",
      risk: "dangerous",
      text: "Your parcel delivery failed. Track & reschedule at http://courier-verify-payment.ml/confirm-payment?action-required=urgent&verify-account=track. Pay ₹50 redelivery charge today.",
    },

    // SAFE TEMPLATES (for testing)
    {
      name: "Legitimate Bank 🟢",
      risk: "safe",
      text: "Dear customer, your A/c XX1234 is debited by Rs.5000 on 24-Nov-24. Available balance: Rs.45,230. -HDFC Bank",
    },
    {
      name: "OTP Legitimate 🟢",
      risk: "safe",
      text: "Your OTP for login is 482931. Valid for 10 minutes. Never share this OTP with anyone. -Amazon",
    },
  ];
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const applyTemplate = (template) => {
    setFormData({
      ...formData,
      messageText: template.text,
    });
    showNotification("Template applied! Edit and send.", "info");
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.senderNumber ||
      !formData.targetNumber ||
      !formData.messageText
    ) {
      showNotification("All fields are required!", "error");
      return;
    }

    if (formData.senderNumber === formData.targetNumber) {
      showNotification("Sender and target cannot be the same!", "error");
      return;
    }

    setSending(true);

    try {
      const result = await sendSMS(
        formData.senderNumber,
        formData.targetNumber,
        formData.messageText
      );

      if (result.success) {
        showNotification("📨 SMS sent successfully!", "success");
        // Clear message text but keep numbers
        setFormData({
          senderNumber: formData.senderNumber,
          targetNumber: formData.targetNumber,
          messageText: "",
        });

        // Show additional toast after 2 seconds
        setTimeout(() => {
          showNotification("✅ Message delivered to recipient!", "info");
        }, 2000);
      } else if (result.blocked) {
        showNotification(`🚫 BLOCKED: ${result.error}`, "error");
      } else {
        showNotification(`Failed to send SMS: ${result.error}`, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 via-black to-gray-900 p-4 rounded-2xl shadow-2xl shadow-yellow-500/20 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo"
              className="w-12 h-12 rounded-full bg-white p-1"
            />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>⚠️</span> Sender Console
              </h1>
              <p className="text-red-100 text-sm">
                Testing Environment - Simulated SMS System
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-6xl mx-auto mb-4">
          <div
            className={`${
              notification.type === "success"
                ? "bg-green-500"
                : notification.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            } text-white px-6 py-3 rounded-xl shadow-lg animate-bounce`}
          >
            {notification.message}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Form */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-2xl shadow-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl">📱</span>
            <h2 className="text-2xl font-bold text-white">Send SMS</h2>
          </div>

          <form onSubmit={handleSendSMS} className="space-y-4">
            {/* Sender Number */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Sender Phone Number
              </label>
              <input
                type="text"
                name="senderNumber"
                value={formData.senderNumber}
                onChange={handleChange}
                placeholder="+91-9876543210"
                className="w-full px-4 py-3 bg-gray-800 text-white border-2 border-gray-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-all"
                required
              />
            </div>

            {/* Target Number */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Target User Number
              </label>
              <input
                type="text"
                name="targetNumber"
                value={formData.targetNumber}
                onChange={handleChange}
                placeholder="+91-9123456789"
                className="w-full px-4 py-3 bg-gray-800 text-white border-2 border-gray-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-all"
                required
              />
            </div>

            {/* Message Text */}
            <div>
              <label className="block text-white font-semibold mb-2">
                SMS Content
              </label>
              <textarea
                name="messageText"
                value={formData.messageText}
                onChange={handleChange}
                placeholder="Enter fraudulent SMS message..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-800 text-white border-2 border-gray-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-all resize-none"
                required
              />
              <p className="text-gray-400 text-xs mt-1">
                {formData.messageText.length} characters
              </p>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/60 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>📨</span> Send SMS
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Scam Templates */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-2xl shadow-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">📝</span>
            <h2 className="text-2xl font-bold text-white">Quick Templates</h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {scamTemplates.map((template, index) => (
              <div
                key={index}
                className={`
                  bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-yellow-500"
                    backdrop-blur-sm rounded-xl p-4 border-2 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20`}
                onClick={() => applyTemplate(template)}
              >
                <h3 className="text-white font-bold mb-2 flex items-center justify-between"></h3>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                  {template.text}
                </p>
                <button
                  type="button"
                  className={`mt-3 text-xs font-semibold py-1 px-3 rounded-lg transition-all ${
                    template.risk === "dangerous"
                      ? "bg-red-500/80 hover:bg-red-600"
                      : "bg-green-500/80 hover:bg-green-600"
                  } text-white`}
                >
                  Use Template →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="max-w-6xl mx-auto mt-6 bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-2xl p-4 shadow-lg shadow-yellow-500/10">
        \n{" "}
        <p className="text-white text-center font-semibold">
          ⚠️ This is a testing environment for demonstrating SMS fraud
          detection. Messages sent here will be analyzed by AI in real-time.
        </p>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.7);
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
