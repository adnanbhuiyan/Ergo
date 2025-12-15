import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/api";

// The search params type
type LoginSearch = {
  registered?: string
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      registered: (search.registered as string) || undefined,
    }
  },
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hook to access search params
  const search = Route.useSearch();

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  // Effect to check for the registration success flag
  useEffect(() => {
    if (search.registered === "true") {
      setSuccess("Account created successfully! Please log in to begin creating projects.");

      // Clear the search param from URL so the message doesn't persist on refresh
      navigate({ to: "/login", search: {}, replace: true });
    }
  }, [search.registered, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const apiUrl = getApiUrl();
      const loginUrl = `${apiUrl}/auth/login`;

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

      const data = await response.json();

      if (!response.ok) {
        // Handle the different potential errors when logging in
        if (response.status === 401) {
          setError("Incorrect email or password. Please try again.");
        } else if (response.status === 404) {
          setError("The account does not exist. Please register first.");
        } else {
          setError(data.detail || "An unexpected error occurred during login.");
        }
        setIsLoading(false);
        return;
      }

      login(data.session_data, data.user_profile);
      await navigate({ to: "/dashboard" });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(`Network error: ${errorMessage}. Please check your connection.`);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-slate-600 flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute top-10 -left-20 w-80 h-80 bg-blue-400/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-20 w-96 h-96 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <h1 className="text-7xl font-bold text-white mb-6 tracking-tight text-center">Ergo</h1>
          <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mb-8"></div>
          <p className="text-white/90 text-xl text-center leading-relaxed max-w-md">
            Log in for a seamless way to organize your day, boost productivity,
            and turn everyday chaos into effortless clarity.
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-8 transition-all group">
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-sm">Login Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-sm">Success</p>
                  <p className="text-sm mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="you@example.com"
                required
              />
            </div>

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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-8 space-y-4">
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors text-center block"
            >
              Forgot Password?
            </a>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to Ergo?</span>
              </div>
            </div>
            <Link
              to="/register"
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all hover:shadow-md group"
            >
              Create an account
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;