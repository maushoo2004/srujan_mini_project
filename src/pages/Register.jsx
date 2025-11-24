import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import logo from "../assets/srujan_logo.png";

export default function Register() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Strip any +91- or +91 prefix from phone number
    const cleanPhone = phoneNumber.replace(/^\+?91-?/, "").trim();

    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, cleanPhone);
      // Store phone number in localStorage for SMS features
      localStorage.setItem("userPhoneNumber", cleanPhone);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-pink-900/10 animate-fadeIn"></div>
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-2xl shadow-purple-500/20 p-8 w-full max-w-md border border-purple-500/30 relative z-10 animate-scaleIn hover:shadow-purple-500/30 transition-shadow duration-500">
        <div className="text-center mb-8 animate-slideInUp">
          <img
            src={logo}
            alt="CyberShield Logo"
            className="h-72 w-auto mx-auto mb-2"
          />
          <p className="text-gray-400">Create your account</p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4 animate-slideInLeft">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="animate-slideInLeft stagger-1">
            <label className="block text-yellow-400 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-purple-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:scale-[1.02] text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/70"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="animate-slideInLeft stagger-2">
            <label className="block text-yellow-400 font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-purple-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:scale-[1.02] text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/70"
              placeholder="9876543210"
              required
            />
          </div>

          <div className="animate-slideInLeft stagger-3">
            <label className="block text-yellow-400 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-purple-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:scale-[1.02] text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/70"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="animate-slideInLeft stagger-4">
            <label className="block text-yellow-400 font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-purple-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:scale-[1.02] text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/70"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-medium hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed animate-slideInUp stagger-5"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 animate-slideInUp stagger-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-medium hover:underline transition-all duration-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
