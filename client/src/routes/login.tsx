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
        <div className="hidden lg:flex lg:w-1/2 bg-slate-600 flex-col items-center justify-center px-12">
          <h1 className="text-6xl font-bold text-white mb-8">Ergo</h1>
          <p className="text-white text-lg text-center leading-relaxed max-w-md">
            Log in for a seamless way to organize your day, boost productivity,
            and turn everyday chaos into effortless clarity.
          </p>
        </div>

        {/* Right Column */}
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
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                <p className="font-medium">Login Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-r">
                 <p className="font-medium">Success</p>
                 <p className="text-sm">{success}</p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-black"
                  placeholder="Enter your email"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-black"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? "Logging in..." : "Enter"}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 underline text-sm block"
              >
                Forgot Password? Click here
              </a>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 underline text-sm block"
              >
                New User? Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Login;