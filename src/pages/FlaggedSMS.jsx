import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { fetchUserSMS, subscribeToSMS } from "../utils/smsService";
import { supabase } from "../utils/supabaseClient";
import SMSCard from "../components/SMSCard";
import logo from "../assets/srujan_logo.png";

export default function FlaggedSMS() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhoneNumber, setUserPhoneNumber] = useState("");

  useEffect(() => {
    fetchPhoneNumber();

    // Cleanup function
    return () => {
      // Unsubscribe from realtime when component unmounts
      if (window.flaggedRealtimeChannel) {
        window.flaggedRealtimeChannel.unsubscribe();
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
      const data = await fetchUserSMS(phone, "dangerous");
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = (phone) => {
    console.log("Setting up realtime for flagged messages:", phone);
    const channel = subscribeToSMS(phone, handleIncomingSMS);

    // Store channel reference for cleanup
    window.flaggedRealtimeChannel = channel;

    return () => {
      channel.unsubscribe();
    };
  };

  const handleIncomingSMS = (newMessage, eventType) => {
    console.log("Flagged page received message:", eventType, newMessage);

    // If it's an update event, check if message is dangerous
    if (eventType === "update") {
      if (newMessage.risk_level === "dangerous") {
        console.log("Adding dangerous message to flagged");
        // Add or update dangerous message
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
        console.log("Removing non-dangerous message from flagged");
        // Remove if it became safe
        setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
      }
      return;
    }

    // New message inserted - wait for UPDATE event with analysis
    if (eventType === "insert") {
      console.log("Insert event - waiting for analysis");
      // Don't add pending messages, wait for them to be analyzed
    }
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

  // Count dangerous messages
  const counts = {
    total: messages.length,
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
                <span>⚠️</span> Flagged Messages
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
          <button
            onClick={() => navigate("/inbox")}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 border border-gray-700"
          >
            <span className="flex items-center justify-center gap-2">
              <span>✓</span> Safe Inbox
            </span>
          </button>
          <button className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-xl hover:shadow-red-500/50 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
            <span className="flex items-center justify-center gap-2">
              <span>⚠️</span> Flagged Messages ({counts.total})
            </span>
          </button>
        </div>
      </div>

      {/* Stats Display */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-yellow-500/30 text-center shadow-xl shadow-yellow-500/10">
          <div className="text-5xl mb-3">🔴</div>
          <div className="text-4xl font-bold text-white mb-2">
            {counts.total}
          </div>
          <div className="text-lg font-semibold text-white/90">
            Dangerous Messages Detected
          </div>
          <p className="text-white/70 text-sm mt-2">
            AI-flagged threats and scams
          </p>
        </div>
      </div>

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
            <p className="text-white text-lg">Loading flagged messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
            <span className="text-6xl mb-4 block">🎉</span>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Dangerous Messages
            </h3>
            <p className="text-gray-400">
              Great! No dangerous or fraudulent messages detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info Header */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
              <p className="text-white text-sm flex items-center gap-2">
                <span className="text-red-400 text-xl">⚠️</span>
                <span>
                  Showing <strong>{messages.length}</strong> dangerous message
                  {messages.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>

            {/* Dangerous Messages */}
            <div className="space-y-3">
              {messages.map((message) => (
                <SMSCard
                  key={message.id}
                  message={message}
                  onDelete={handleDeleteMessage}
                  userPhoneNumber={userPhoneNumber}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Warning Banner */}
      <div className="max-w-6xl mx-auto mt-6 bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-2xl p-4 shadow-lg shadow-yellow-500/10">
        <p className="text-white text-center text-sm">
          🛡️ <strong>AI-Powered Protection:</strong> These messages were flagged
          by our AI analysis system. Review carefully and never share sensitive
          information.
        </p>
      </div>
    </div>
  );
}
