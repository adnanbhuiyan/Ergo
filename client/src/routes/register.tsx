import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/api";

interface File { }

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password Validation State
  const [passValidations, setPassValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    match: false
  });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  // Checks if the password meets the requirements in real-time
  useEffect(() => {
    setPassValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      match: password !== "" && password === confirmPassword
    });
  }, [password, confirmPassword]);

  const isFormValid = Object.values(passValidations).every(Boolean);

  interface FastAPIValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please ensure all password requirements are met.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("username", username);
    formData.append("position", position);

    if (profilePicture) {
      formData.append("profile_photo", profilePicture as Blob);
    }

    try {
      const response = await fetch(`${getApiUrl()}/auth/signup`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Registration failed.";

        const errorData: { detail?: FastAPIValidationError[] | string } = data;

        if (errorData.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
          errorMessage = errorData.detail
            .map((err: FastAPIValidationError) => {
              const field = err.loc[err.loc.length - 1];
              return `${field}: ${err.msg}`;
            })
            .join("; ");
        } else if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Reset Form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setUsername("");
      setPosition("");
      setProfilePicture(null);

      // Navigate to login with a search param to display the success message
      navigate({ to: "/login", search: { registered: "true" } });

    } catch (err) {
      console.log(err);
      setError("Network error. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-slate-600 flex-col justify-center items-center p-8 relative">
        <div className="absolute top-10 -left-20 w-80 h-80 bg-blue-400/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute right-20 w-96 h-96 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          <h1 className="text-7xl font-bold text-white mb-6 tracking-tight text-center">Ergo</h1>
          <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mb-8"></div>
          <p className="text-white/90 text-xl text-center leading-relaxed max-w-md">
            Sign up to start your day and get your tasks organized, boost
            productivity, and turn everyday chaos into effortless clarity.
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center justify-center px-8 py-8 overflow-y-auto min-h-screen">
        <div className="w-full max-w-md my-8 bg-white rounded-2xl shadow-xl px-8 py-8 border border-gray-100">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-8 transition-all group">
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm">
              Join Ergo and start organizing your workflow
            </p>
          </div>
          <p className="text-gray-600 mb-6">Sign up to get started</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-sm">Registration Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Username & Position */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="Software Engineer"
                required
              />
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture (Optional)</label>

              {!profilePicture ? (
                <label
                  htmlFor="profilePicture"
                  className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Click to upload photo</p>
                    <p className="text-xs text-gray-500 mt-1">PNG or JPG • Max 5MB</p>
                  </div>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProfilePicture(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative w-full h-40 border-2 border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                  <img
                    src={URL.createObjectURL(profilePicture as Blob)}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setProfilePicture(null)}
                      className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Section */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              {/* Password Requirements Checklist */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <RequirementItem met={passValidations.length} text="8+ Characters" />
                <RequirementItem met={passValidations.upper} text="Uppercase Letter" />
                <RequirementItem met={passValidations.lower} text="Lowercase Letter" />
                <RequirementItem met={passValidations.number} text="Number" />
                <RequirementItem met={passValidations.special} text="Special Character (@$!%*?&)" />
                <RequirementItem met={passValidations.match} text="Passwords Match" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all hover:shadow-md group"
            >
              Sign in to your account
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

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${met ? "text-green-600" : "text-gray-400"}`}>
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {met ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
      </svg>
      <span>{text}</span>
    </div>
  );
}

export default Register;