import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  fetchUserSMS,
  subscribeToSMS,
  analyzeSMS,
  updateSMSRiskLevel,
} from "../utils/smsService";
import { supabase } from "../utils/supabaseClient";
import SMSCard from "../components/SMSCard";
import logo from "../assets/srujan_logo.png";

export default function Inbox() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchPhoneNumber();

    // Cleanup function
    return () => {
      // Unsubscribe from realtime when component unmounts
      if (window.smsRealtimeChannel) {
        window.smsRealtimeChannel.unsubscribe();
      }
    };
  }, [user]);

  const fetchPhoneNumber = async () => {
    try {
      // First check localStorage
      const savedPhone = localStorage.getItem("userPhoneNumber");
      if (savedPhone) {
        setUserPhoneNumber(savedPhone);
        loadMessages(savedPhone);
        setupRealtime(savedPhone);
        return;
      }

      // If not in localStorage, fetch from Supabase user profile
      if (user?.id) {
        const { data, error } = await supabase
          .from("users")
          .select("phone_number")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.phone_number) {
          const phone = data.phone_number;
          localStorage.setItem("userPhoneNumber", phone);
          setUserPhoneNumber(phone);
          loadMessages(phone);
          setupRealtime(phone);
        } else {
          // No phone number in profile
          setLoading(false);
          setUserPhoneNumber("not-set");
        }
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
      setLoading(false);
      setUserPhoneNumber("error");
    }
  };

  const loadMessages = async (phone) => {
    try {
      setLoading(true);
      const data = await fetchUserSMS(phone, "safe");
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = (phone) => {
    console.log("Setting up realtime for phone:", phone);
    const channel = subscribeToSMS(phone, handleIncomingSMS);

    // Store channel reference for cleanup
    window.smsRealtimeChannel = channel;

    return () => {
      channel.unsubscribe();
    };
  };

  const handleIncomingSMS = async (newMessage, eventType) => {
    console.log("Inbox received message:", eventType, newMessage);

    // If it's an update event, check if message should be in inbox
    if (eventType === "update") {
      if (newMessage.risk_level === "safe") {
        console.log("Adding safe message to inbox");
        // Add or update safe message
        setMessages((prev) => {
          const exists = prev.find((msg) => msg.id === newMessage.id);
          if (exists) {
            return prev.map((msg) =>
              msg.id === newMessage.id ? newMessage : msg
            );
          } else {
            return [newMessage, ...prev];
          }
        });
      } else {
        console.log("Removing non-safe message from inbox");
        // Remove if it became unsafe
        setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
      }
      setAnalyzing(false);
      return;
    }

    // New message inserted - wait for UPDATE event with analysis
    if (eventType === "insert") {
      if (newMessage.risk_level === "pending") {
        console.log("Message pending analysis...");
        setAnalyzing(true);
      } else if (newMessage.risk_level === "safe") {
        console.log("Adding pre-analyzed safe message");
        setMessages((prev) => [newMessage, ...prev]);
      }
    }
    // Don't add dangerous/suspicious to inbox
  };

  const handleDeleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const changePhoneNumber = async () => {
    const newPhone = prompt("Enter your new phone number:");
    if (newPhone && user?.id) {
      try {
        // Update in Supabase
        const { error } = await supabase
          .from("users")
          .update({ phone_number: newPhone })
          .eq("id", user.id);

        if (error) throw error;

        // Update localStorage
        localStorage.setItem("userPhoneNumber", newPhone);
        setUserPhoneNumber(newPhone);
        loadMessages(newPhone);
        setupRealtime(newPhone);
      } catch (error) {
        console.error("Error updating phone number:", error);
        alert("Failed to update phone number");
      }
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
                <span>📬</span> Safe Inbox
              </h1>
              <p className="text-white/80 text-sm">
                {userPhoneNumber || "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={changePhoneNumber}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 text-sm"
            >
              Change Number
            </button>
            <button
              onClick={() => navigate("/home")}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-6 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl hover:shadow-green-500/50 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
            <span className="flex items-center justify-center gap-2">
              <span>✓</span> Safe Inbox ({messages.length})
            </span>
          </button>
          <button
            onClick={() => navigate("/flagged")}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 border border-gray-700"
          >
            <span className="flex items-center justify-center gap-2">
              <span>⚠️</span> Flagged Messages
            </span>
          </button>
        </div>
      </div>

      {/* Analysis Indicator */}
      {analyzing && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-6 py-3 rounded-xl shadow-lg shadow-yellow-500/50 flex items-center gap-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>🤖 AI is analyzing incoming message...</span>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="max-w-6xl mx-auto">
        {userPhoneNumber === "not-set" ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
            <span className="text-6xl mb-4 block">📱</span>
            <h3 className="text-2xl font-bold text-white mb-2">
              Phone Number Not Set
            </h3>
            <p className="text-gray-400 mb-6">
              Please set your phone number to use SMS features.
            </p>
            <button
              onClick={changePhoneNumber}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-8 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-yellow-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Set Phone Number
            </button>
          </div>
        ) : userPhoneNumber === "error" ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h3 className="text-2xl font-bold text-white mb-2">
              Error Loading Profile
            </h3>
            <p className="text-gray-400 mb-6">
              Failed to load your phone number. Please try again.
            </p>
            <button
              onClick={() => fetchPhoneNumber()}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-8 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-yellow-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
            <span className="text-6xl mb-4 block">📭</span>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Safe Messages
            </h3>
            <p className="text-gray-400">
              Your inbox is empty. Safe messages will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
              <p className="text-white text-sm flex items-center gap-2">
                <span className="text-green-400 text-xl">✓</span>
                <span>
                  Showing <strong>{messages.length}</strong> safe message
                  {messages.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
            {messages.map((message) => (
              <SMSCard
                key={message.id}
                message={message}
                onDelete={handleDeleteMessage}
                userPhoneNumber={userPhoneNumber}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="max-w-6xl mx-auto mt-6 bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-2xl p-4 shadow-lg shadow-yellow-500/10">
        <p className="text-white text-center text-sm">
          💡 <strong>Real-time Protection:</strong> All incoming messages are
          automatically analyzed by AI. Suspicious messages are moved to Flagged
          Messages.
        </p>
      </div>
    </div>
  );
}
