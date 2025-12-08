import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/api"; 

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const { login } = useAuth();

  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const apiUrl = getApiUrl();
      const loginUrl = `${apiUrl}/auth/login`;
      
      console.log("Attempting login to:", loginUrl);
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("Response status:", response.status);
      
      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        setIsLoading(false);
        return;
      }

      //Use the AuthContext login function to login
      login(data.session_data, data.user_profile);

      //Navigate to the dashboard after the user logs in
      await navigate({ to: "/dashboard" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(`Network error: ${errorMessage}. Please check your backend URL.`);
      console.error("Login error:", err);
      console.error("API URL being used:", getApiUrl());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
        {/* Left Column - Promotional Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-600 flex-col items-center justify-center px-12">
          <h1 className="text-6xl font-bold text-white mb-8">Ergo</h1>
          <p className="text-white text-lg text-center leading-relaxed max-w-md">
            Log in for a seamless way to organize your day, boost productivity,
            and turn everyday chaos into effortless clarity.
          </p>
        </div>

        {/* Right Column - Login Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">
              Log In Below
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-black"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-black"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Social Login removed */}

              {/* Enter/Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Enter"}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center">
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 underline text-sm block"
              >
                Forgot Password? Click here
              </a>
              <a
                href="/register"
                className="text-blue-600 hover:text-blue-800 underline text-sm block"
              >
                New User? Register here
              </a>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Login;
